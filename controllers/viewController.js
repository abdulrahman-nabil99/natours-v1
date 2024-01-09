import { Tour } from '../models/tourModel.js';
import { User } from '../models/userModel.js';
import { catchAsync } from './errorController.js';
import { AppError } from '../utils/appError.js';
import { Booking } from '../models/bookingModel.js';

export const getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'Exciting tours for adventurous people',
    tours,
  });
});

export const getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate(
    {
      path: 'reviews',
    },
  );
  if (!tour)
    return next(new AppError('No Tour found with that name', 404));
  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

export const loginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Login to your account',
  });
});

export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+role');
  res.status(200).render('account', {
    title: user.name,
    user,
  });
});

export const getMyTours = catchAsync(async (req, res, next) => {
  // get all bookings
  const bookings = await Booking.find({ user: req.user.id });
  //get all tours
  const toursId = bookings.map((book) => book.tour);
  const tours = await Tour.find({ _id: { $in: toursId } });
  const user = await User.findById(req.user.id).select('+role');

  res.status(200).render('overview', {
    title: 'My Tours',
    user,
    tours,
  });
});

export const updateUser = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    { new: true, runValidators: true },
  );
  res.status(200).render('account', {
    title: updatedUser.name,
    user: updatedUser,
  });
});

export const alerts = catchAsync(async (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.aler =
      'Your Booking Was Successful, Please check email for confirmation\n if your booking does not show here immediatly, come back later';
  next();
});
