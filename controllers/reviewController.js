import { Review } from '../models/reviewModel.js';
import * as handlerFactory from './handlerFactory.js';

export const setUserTourId = function (req, res, next) {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.author = req.user.id;
  next();
};

export const getAllReviews = handlerFactory.getAll(Review);
export const getReview = handlerFactory.getOne(Review);
export const newReview = handlerFactory.createOne(Review);
export const deleteReview = handlerFactory.deleteOne(Review);
export const updateReview = handlerFactory.updateOne(Review);
