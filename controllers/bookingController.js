import Stripe from 'stripe';
import { Tour } from '../models/tourModel.js';
import { AppError } from '../utils/appError.js';
import { Booking } from '../models/bookingModel.js';
import { catchAsync } from './errorController.js';
import * as handlerFactory from './handlerFactory.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const checkoutSession = catchAsync(async (req, res, next) => {
  // Get tour
  const tour = await Tour.findById(req.params.tourId);
  // create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${
      tour.slug
    }`,
    mode: 'payment',
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} tour`,
            description: `${tour.summary}`,
            images: [
              'https://images.unsplash.com/photo-1634840884193-2f6cf2538871?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            ],
          },
        },
        quantity: 1,
      },
    ],
  });
  // response
  res.status(200).json({
    status: 'success',
    session,
  });
});

export const createBookingCheckout = catchAsync(
  async (req, res, next) => {
    const { tour, user, price } = req.query;
    if (!tour || !user || !price) return next();
    await Booking.create({
      tour,
      user,
      price,
    });
    res.redirect(req.originalUrl.split('?')[0]);
  },
);

export const getAllBookings = handlerFactory.getAll(Booking);
export const getBooking = handlerFactory.getOne(Booking, {
  path: 'user',
  select: '-__v +name +email',
});
export const editBooking = handlerFactory.updateOne(Booking);
export const deleteBooking = handlerFactory.deleteOne(Booking);
export const newBooking = handlerFactory.createOne(Booking);
