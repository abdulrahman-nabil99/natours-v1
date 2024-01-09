import multer from 'multer';
import sharp from 'sharp';
import { User } from '../models/userModel.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from './errorController.js';
import * as handlerFactory from './handlerFactory.js';

// upload
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users/');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid data Type, Please Upload only images',
        400,
      ),
      false,
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadUserPhoto = upload.single('photo');
export const resizeUserPhoto = catchAsync(async(req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(300, 300)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
    next()
})

// Controllers
export const getAllUsers = handlerFactory.getAll(User);
export const getUser = handlerFactory.getOne(User);
export const newUser = handlerFactory.createOne(User);
export const editUser = handlerFactory.updateOne(User);
export const deleteUser = handlerFactory.deleteOne(User);

//------------------------- user self-controll

const filterFields = (obj, ...fields) => {
  const returnObj = {};
  Object.keys(obj).forEach((key) => {
    if (fields.includes(key)) returnObj[key] = obj[key];
  });
  return returnObj;
};

export const updateMe = catchAsync(async (req, res, next) => {
  const filteredObj = filterFields(
    req.body,
    'name',
    'email',
    'photo',
  );
  if (req.file) filteredObj.photo = req.file.filename;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    filteredObj,
    {
      new: true,
      runValidators: true,
    },
  );
  res.status(200).json({
    status: 'success',
    user,
  });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, {
    active: false,
  });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const getMe = async (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
