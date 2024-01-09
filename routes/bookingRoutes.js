import express from 'express';
import * as authController from '../controllers/authController.js';
import * as bookingController from '../controllers/bookingController.js';
export const bookingRouter = express.Router();

bookingRouter.use(authController.protect);
bookingRouter
  .route('/checkout-session/:tourId')
  .get(bookingController.checkoutSession);
bookingRouter.use(authController.restrictTo('admin', 'lead-guide'));
bookingRouter.route('/').get(bookingController.getAllBookings);
bookingRouter.route('/:id').get(bookingController.getBooking);
bookingRouter.route('/:id').patch(bookingController.editBooking);
bookingRouter.route('/:id').delete(bookingController.deleteBooking);
bookingRouter.route('/').post(bookingController.newBooking);
