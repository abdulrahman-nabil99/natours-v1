import express from 'express';
import * as viewController from '../controllers/viewController.js';
import * as authController from '../controllers/authController.js';
import * as bookingController from '../controllers/bookingController.js';

export const viewRouter = express.Router();

viewRouter.get(
  '/',
  authController.isLoggedIn,
  viewController.getOverview,
);
viewRouter.get(
  '/tour/:slug',
  authController.isLoggedIn,
  viewController.getTour,
);
viewRouter.get(
  '/login',
  authController.isLoggedIn,
  viewController.loginForm,
);
viewRouter.get('/me', authController.protect, viewController.getMe);
viewRouter.get(
  '/my-tours',
  authController.protect,
  viewController.getMyTours,
);

viewRouter.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUser,
);
