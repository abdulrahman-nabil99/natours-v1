import express from 'express';
import * as tourController from '../controllers/tourController.js';
import * as authController from '../controllers/authController.js';
// import * as reviewController from '../controllers/reviewController.js';
import { reviewRouter } from './reviewRoutes.js';

export const tourRouter = express.Router();

// nested params
tourRouter.use('/:tourId/reviews', reviewRouter);

tourRouter.route('/stats').get(tourController.getTourStats);

tourRouter
  .route('/monthly-plane/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlane,
  );

tourRouter
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

tourRouter
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getDistances);

tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.newTour,
  );

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.editTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );
