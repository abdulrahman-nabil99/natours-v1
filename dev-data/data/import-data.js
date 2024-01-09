import * as fs from 'node:fs';
import mongoose from 'mongoose';
import { User } from '../../models/userModel.js';
import { Review } from '../../models/reviewModel.js';
import { Tour } from '../../models/tourModel.js';

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose.connect(db, {}).then((con) => {
  console.log('Database Connected Successfully');
});

const users = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));
const tours = JSON.parse(fs.readFileSync('./tours.json', 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync('./reviews.json', 'utf-8'),
);
const importData = async function () {
  try {
    // await User.create(users, { validateBeforeSave: false });
    // await Review.create(reviews);
    await Tour.create(tours);

    console.log('Data Loaded');
    process.exit();
  } catch (err) {
    console.error(err.message);
  }
};

const deleteData = async function () {
  try {
    // await User.deleteMany();
    // await Review.deleteMany();
    await Tour.deleteMany();
    console.log('Data Deleted');
    process.exit();
  } catch (err) {
    console.error(err.message);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

// node --env-file=../../.env import-data.js --import
