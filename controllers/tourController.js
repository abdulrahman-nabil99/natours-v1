import multer from 'multer';
import sharp from 'sharp';
import { Tour } from '../models/tourModel.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from './errorController.js';
import * as handlerFactory from './handlerFactory.js';

// upload
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

export const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

export const resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  req.body.imageCover = `tour-${
    req.params.id
  }-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  await Promise.all(
    req.files.images.map(async (file, i) => {
      req.body.images = [];
      const currentFile = `tour-${req.params.id}-${Date.now()}-${
        i + 1
      }.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${currentFile}`);
      req.body.images.push(currentFile);
    }),
  );

  next();
});

export const aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields =
    'name,price,ratingsAverage,summary,difficulty,duration';
  next();
};

export const getAllTours = handlerFactory.getAll(Tour);
export const getTour = handlerFactory.getOne(Tour, {
  path: 'reviews',
  select: '-__v',
});
export const editTour = handlerFactory.updateOne(Tour);
export const deleteTour = handlerFactory.deleteOne(Tour);
export const newTour = handlerFactory.createOne(Tour);

export const getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    { $sort: { avgPrice: 1 } },
    // { $match: { _id: { $ne: 'EASY' } } },
  ]);
  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

export const getMonthlyPlane = catchAsync(async function (req, res) {
  const year = +req.params.year;
  const plane = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { months: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numToursStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: { results: plane.length, plane },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit

export const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, unit, latlng } = req.params;
  const radius =
    unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    return next(
      new AppError(
        'Please Provide latitude and longitude ind the format lat,lng.',
        400,
      ),
    );

  const filter = {
    startLocation: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] },
    },
  };

  const tours = await Tour.find(filter);
  res.status(200).json({
    status: 'success',
    data: { results: tours.length, tours },
  });
});

export const getDistances = catchAsync(async (req, res) => {
  let { unit, latlng } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng)
    return next(
      new AppError(
        'Please Provide latitude and longitude ind the format lat,lng.',
        400,
      ),
    );
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [+lng, +lat] },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: { distances },
  });
});
