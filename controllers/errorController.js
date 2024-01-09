import { AppError } from '../utils/appError.js';

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      err: err,
      stack: err.stack,
    });
    // RENDERED WEB
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
};
const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational)
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

    console.error('Error ⚠️');
    return res.status(500).json({
      status: 'error',
      message: 'Something Went Wrong',
    });

    // RENDERED WEB
  } else {
    if (err.isOperational)
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: err.message,
      });

    console.error('Error ⚠️');
    return res.status(500).render('error', {
      title: 'Something went wrong',
      msg: 'Please Try again later',
    });
  }
};
const handleCastErrDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate Field Value '${
    Object.values(err.keyValue)[0]
  }', Please Use Another Value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors)
    .map((val) => val.message)
    .join(', ');
  const message = `Invalid Input Data: ${errors}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid Token, please login again', 401);

const handleTokenExpiredError = () =>
  new AppError('Your Token has expired, please login again', 401);

export const errHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    if (err.name === 'CastError') error = handleCastErrDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError')
      error = handleTokenExpiredError();
    error.message = err.message
    sendErrorProd(error, req, res);
  }
  next();
};

export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
