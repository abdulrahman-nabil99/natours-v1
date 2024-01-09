import mongoose from 'mongoose';
import { Tour } from './tourModel.js';

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review Cant be Empty'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating cant be less than 1.0'],
      max: [5, 'Rating cant be more than 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must have an author'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'review must belong to a tour'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name duration difficulty ratingsAverage summary ',
  // }).populate({
  //   path: 'author',
  //   select: '-__v',
  // });

  this.populate({
    path: 'author',
    select: '-__v',
  });
  next();
});

reviewSchema.index({ tour: 1, author: 1 }, { unique: true });

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0)
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating,
    });
  if (stats.length === 0)
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    });
};
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) doc.constructor.calcAverageRatings(doc.tour);
});

export const Review = mongoose.model('Review', reviewSchema);
