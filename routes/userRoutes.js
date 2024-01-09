import express from 'express';
import * as userController from '../controllers/userController.js';
import * as authController from '../controllers/authController.js';

export const userRouter = express.Router();
userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);
userRouter.post('/forgetPassword', authController.forgetPassword);
userRouter.patch(
  '/resetPassword/:token',
  authController.resetPassword,
);

userRouter.use(authController.protect);
userRouter.get('/logout', authController.logout);

// need authentication

userRouter.patch('/updateMyPassword/', authController.updatePassword);
userRouter.patch(
  '/updateMe/',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
userRouter.delete(
  '/deleteMe/',
  authController.restrictTo('user'),
  userController.deleteMe,
);
userRouter.get('/me/', userController.getMe, userController.getUser);
userRouter
  .route('/')
  .get(authController.restrictTo('admin'), userController.getAllUsers)
  .post(authController.restrictTo('admin'), userController.newUser);
userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(authController.restrictTo('admin'), userController.editUser)
  .delete(
    authController.restrictTo('admin'),
    userController.deleteUser,
  );
