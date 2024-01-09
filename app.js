import path from 'node:path';
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
import express from 'express';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import morgan from 'morgan';
import { viewRouter } from './routes/viewRoutes.js';
import { tourRouter } from './routes/tourRoutes.js';
import { userRouter } from './routes/userRoutes.js';
import { reviewRouter } from './routes/reviewRoutes.js';
import { bookingRouter } from './routes/bookingRoutes.js';
import { AppError } from './utils/appError.js';
import { errHandler } from './controllers/errorController.js';

export const app = express();
app.enable('trust proxy')

// templete engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares
// set Security http request
const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://cdnjs.cloudflare.com',
  'https://tile.openstreetmap.org',
  'https://js.stripe.com/',
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://cdnjs.cloudflare.com',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
  'https://js.stripe.com/',
];
const connectSrcUrls = [
  'https://unpkg.com',
  'https://cdnjs.cloudflare.com',
  'https://tile.openstreetmap.org',
  'https://js.stripe.com/',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const frameSrcUrls = [
  'https://unpkg.com',
  'https://cdnjs.cloudflare.com',
  'https://tile.openstreetmap.org',
  'https://js.stripe.com/',
];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", ...fontSrcUrls],
      frameSrc: ["'self'", ...frameSrcUrls],
    },
  }),
);

// rate limiter
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message:
    'To many requests from this ip, please try again in an hour!',
});
app.use('/api', limiter);

// body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// data sanitization agains NoSQL query injection,cross-site scripting attack
app.use(mongoSanitize());

// data sanitization agains cross-site scripting attack
app.use(xss());

// Prevent parametar pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'price',
      'ratingsQuantity',
      'difficulty',
      'maxGroupSize',
      'ratingsAverage',
      'name',
    ],
  }),
);
app.use(compression());
//
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes

// app.use((req, res, next) => {
//   console.log(req.cookies);
//   next();
// });

// View
app.use('/', viewRouter);

// API
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

app.all('*', (req, res, next) => {
  // const err = new Error(`Can't Find ${req.originalUrl} on this server!`);
  // (err.statusCode = 404), (err.status = 'fail');
  next(
    new AppError(
      `Can't Find ${req.originalUrl} on this server!`,
      404,
    ),
  );
});

app.use(errHandler);
