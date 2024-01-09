import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Validator from 'validator';
import bcryptjs from 'bcryptjs';
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A User must Have a name'],
    trim: true,
    maxlength: [
      30,
      'User name must have less or equal than 30 characters',
    ],
    minlength: [
      6,
      'User name must have more or equal than 6 characters',
    ],
  },
  email: {
    type: String,
    required: [true, 'A User must Have an email'],
    unique: true,
    trim: true,
    maxlength: [
      30,
      'User email must have less or equal than 30 characters',
    ],
    minlength: [
      6,
      'User email must have more or equal than 6 characters',
    ],
    validate: [Validator.isEmail, 'Invalid Email'],
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
    select: false,
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [true, 'A User must Have a Password'],
    minlength: [8, 'Password cant be less than 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A User must Have a Password'],
    minlength: [8, 'Password cant be less than 8 characters'],
    select: false,
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Failed to match password',
    },
  },
  passwordChangedAt: {
    type: Date,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcryptjs.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candPass,
  userPass,
) {
  return await bcryptjs.compare(candPass, userPass);
};

userSchema.methods.changerPasswordAfter = function (JWTtimestamp) {
  if (this.passwordChangedAt) {
    const changeTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return changeTimeStamp > JWTtimestamp;
  } else return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

export const User = mongoose.model('User', userSchema);
