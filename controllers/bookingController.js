import Stripe from 'stripe';
import { Tour } from '../models/tourModel.js';
import { AppError } from '../utils/appError.js';
import { Booking } from '../models/bookingModel.js';
import { catchAsync } from './errorController.js';
import * as handlerFactory from './handlerFactory.js';
import { User } from '../models/userModel.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const checkoutSession = catchAsync(async (req, res, next) => {
  // Get tour
  const tour = await Tour.findById(req.params.tourId);
  // create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    // cancel_url: `${req.protocol}://${req.get('host')}/tour/${
    //   tour.slug
    // }`,
    success_url: `${req.protocol}://${req.get(
      'host',
    )}/my-tours?alert=booking`,
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
              `${req.protocol}://${req.get('host')}/img/tours/${
                tour.imageCover
              }`,
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

// export const createBookingCheckout = catchAsync(
//   async (req, res, next) => {
//     const { tour, user, price } = req.query;
//     if (!tour || !user || !price) return next();
//     await Booking.create({
//       tour,
//       user,
//       price,
//     });
//     res.redirect(req.originalUrl.split('?')[0]);
//   },
// );

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = await User.findOne({ email: session.customer_email });
  const price = session.amount_total / 100;
  await Booking.create({ tour, user: user.id, price });
};

export const webhookCheckout = catchAsync(async (req, res, next) => {
  let event;
  try {
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOKS_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);
  res.status(200).json({
    received: true,
  });
});

export const getAllBookings = handlerFactory.getAll(Booking);
export const getBooking = handlerFactory.getOne(Booking, {
  path: 'user',
  select: '-__v +name +email',
});
export const editBooking = handlerFactory.updateOne(Booking);
export const deleteBooking = handlerFactory.deleteOne(Booking);
export const newBooking = handlerFactory.createOne(Booking);
