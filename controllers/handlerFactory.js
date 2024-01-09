import { catchAsync } from './errorController.js';
import { AppError } from '../utils/appError.js';
import { APIFeatures } from '../utils/apiFeatures.js';

export const deleteOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) throw new AppError('No Result Found With that ID', 404);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

export const updateOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!doc) throw new AppError('No result Found With that ID', 404);
    res.status(200).json({
      status: 'success',
      data: { doc },
    });
  });

export const createOne = (Model) =>
  catchAsync(async (req, res) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { newDoc },
    });
  });

export const getOne = (Model, populateOptions) =>
  catchAsync(async (req, res) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;
    if (!doc) throw new AppError('No Result Found With that ID', 404);
    res.status(200).json({
      status: 'success',
      data: { doc },
    });
  });

export const getAll = (Model) =>
  catchAsync(async (req, res) => {
    // for review
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }
    // for all
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limit()
      .pagination();
    // execution
    const doc = await features.query;
    res.status(200).json({
      status: 'success',
      data: { results: doc.length, doc },
    });
  });
