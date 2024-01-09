import express from 'express';
import * as authController from '../controllers/authController.js';
import * as reviewController from '../controllers/reviewController.js';
export const reviewRouter = express.Router({
  mergeParams: true,
});

reviewRouter.use(authController.protect);
reviewRouter
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setUserTourId,
    reviewController.newReview,
  );

reviewRouter
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authController.restrictTo('admin', 'user'),
    reviewController.deleteReview,
  )
  .patch(
    authController.restrictTo('admin', 'user'),
    reviewController.updateReview,
  );
