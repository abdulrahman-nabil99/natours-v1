import mongoose from 'mongoose';
import slugify from 'slugify';
import Validator from 'validator';
// import { User } from './userModel.js';
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must Have a name'],
      unique: true,
      trim: true,
      maxlength: [
        60,
        'Tour name must have less or equal than 60 characters',
      ],
      minlength: [
        8,
        'Tour name must have more or equal than 8 characters',
      ],
      // validate: [Validator.isAlpha, ' Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must Have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must Have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must Have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult',
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating cant be less than 1.0'],
      max: [5, 'Rating cant be more than 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    price: {
      type: Number,
      required: [true, 'A tour must Have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        message: 'Discount ({VALUE}) cant be more than the price',
        validator: function (val) {
          return val <= this.price;
        },
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must Have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      required: true,
      type: String,
      required: [true, 'A tour must Have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    startLocation: {
      type: { type: String, default: 'Point', enum: ['Point'] },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    secretTour: {
      type: Boolean,
      default: false,
    },
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// indexes
// tourSchema.index({ price: 1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// compound index
tourSchema.index({ price: 1, ratingsAverage: -1 });

// virtual
tourSchema.virtual('durationWeeks').get(function () {
  return (this.duration / 7).toFixed(2);
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Document Middleware

// slugify
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// embading
// tourSchema.pre('save', async function (next) {
//   const guidesPromise = this.guides.map((id) => User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// Query Middleware
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  // populating
  this.populate({
    path: 'guides',
    select: '-__v +role',
  });
  next();
});

// Aggregation Middleware
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });
export const Tour = mongoose.model('Tour', tourSchema);
