import { promisify } from 'node:util';
import crypto from 'node:crypto';
import { User } from '../models/userModel.js';
import { catchAsync } from './errorController.js';
import { AppError } from '../utils/appError.js';
import jwt from 'jsonwebtoken';
import { Email } from '../utils/email.js';

const signToken = function (id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN,
  });
};

const cookieOptions = {
  expires: new Date(
    Date.now() +
      process.env.JWT_COOKIE_EXPIRE_IN * 24 * 60 * 60 * 1000,
  ),
  secure: process.env.NODE_ENV === 'production' ? true : false,
  httpOnly: true,
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
  });
};
export const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    photo: req.body.photo,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(
      new AppError('please enter email and password!', 400),
    );
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('incorrect Email or Password', 401));

  createSendToken(user, 200, res);
});

export const protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    return next(new AppError('Please login to get access', 401));
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET,
  );

  const freshUser = await User.findById(decoded.id).select('role');
  if (!freshUser)
    return next(
      new AppError('The User with that token No longer Exist!', 401),
    );
  if (freshUser.changerPasswordAfter(decoded.iat))
    return next(
      new AppError(
        'Password has been updated recently, please login again',
        401,
      ),
    );

  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError(
          'You do not have premission to perform this action',
          403,
        ),
      );
    next();
  };
};

export const forgetPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  console.log(user);
  if (!user)
    return next(new AppError('The is no user with than email', 404));
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending token to your email, please try again later',
        500,
      ),
    );
  }
};

export const resetPassword = catchAsync(
  async function (req, res, next) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user)
      return next(new AppError('Invalid token or Expired', 400));

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 201, res);
  },
);

export const updatePassword = catchAsync(async (req, res, next) => {
  const { password, newPassword, newPasswordConfirm } = req.body;
  if (!password || !newPassword || !newPasswordConfirm)
    return next(
      new AppError(
        'Please enter your current password, and new password',
        404,
      ),
    );

  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.correctPassword(password, user.password)))
    return next(new AppError('incorrect Password', 401));
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();
  createSendToken(user, 200, res);
});

export const isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // check if user exist
      const currentUser = await User.findById(decoded.id).select(
        'role name photo',
      );
      if (!currentUser) return next();

      //  check if user  if user changed his password
      if (currentUser.changerPasswordAfter(decoded.iat))
        return next();
      // there is a logged in user
      res.locals.user = currentUser;
      next();
    } catch (err) {
      return next();
    }
  } else {
    next();
  }
};

export const logout = catchAsync(async (req, res) => {
  res.cookie('jwt', `loggedout at ${Date.now()}`, {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
});
