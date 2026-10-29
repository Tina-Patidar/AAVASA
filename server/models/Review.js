import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100, default: '' },
    comment: { type: String, required: true, trim: true, maxlength: 1200 },
  },
  { timestamps: true }
);

export const Review = mongoose.model('Review', reviewSchema);
