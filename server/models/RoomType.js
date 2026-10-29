import mongoose from 'mongoose';

export const ROOM_AMENITIES = [
  'King Bed',
  'Twin Beds',
  'Queen Bed',
  'Private Balcony',
  'Garden View',
  'Mountain View',
  'Sea View',
  'Pool Access',
  'Bathtub',
  'Rain Shower',
  'Work Desk',
  'Mini Bar',
  'Tea & Coffee Maker',
  'Living Area',
];

/**
 * A RoomType is a category of room (e.g. "Garden Suite") with `totalRooms` physical units.
 * Nightly bookings against it are tracked in the RoomInventory collection.
 */
const roomTypeSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    pricePerNight: { type: Number, required: true, min: [100, 'Price must be at least 100'] },
    maxGuests: { type: Number, required: true, min: 1, max: 12 },
    totalRooms: { type: Number, required: true, min: 0, max: 200 },
    sizeSqFt: { type: Number, min: 50, default: 300 },
    amenities: [{ type: String, enum: ROOM_AMENITIES }],
    images: [{ url: String, alt: String, _id: false }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomTypeSchema.index({ hotel: 1, name: 1 }, { unique: true });

export const RoomType = mongoose.model('RoomType', roomTypeSchema);
