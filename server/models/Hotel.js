import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

export const PROPERTY_TYPES = ['Boutique Hotel', 'Resort', 'Heritage Haveli', 'Mountain Retreat', 'Beach Villa', 'City Hotel'];
export const AMENITIES = [
  'Free Wi-Fi',
  'Swimming Pool',
  'Spa',
  'Restaurant',
  'Breakfast Included',
  'Air Conditioning',
  'Parking',
  'Gym',
  'Bar & Lounge',
  'Garden',
  'Airport Transfer',
  'Pet Friendly',
  'Yoga Deck',
  'Bonfire',
];

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { _id: false }
);

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Hotel name is required'], trim: true, maxlength: 120 },
    slug: { type: String, unique: true, index: true },
    tagline: { type: String, trim: true, maxlength: 160, default: '' },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    propertyType: { type: String, enum: PROPERTY_TYPES, required: true },
    starCategory: { type: Number, min: 1, max: 5, default: 3 },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    location: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },
    images: {
      type: [imageSchema],
      validate: [(v) => v.length >= 1, 'At least one image is required'],
    },
    amenities: [{ type: String, enum: AMENITIES }],
    policies: {
      checkInTime: { type: String, default: '14:00' },
      checkOutTime: { type: String, default: '11:00' },
      cancellation: {
        type: String,
        default: 'Free cancellation up to 48 hours before check-in. After that, the first night is charged.',
      },
      // Free cancellation window in hours before check-in (used by the cancellation rules)
      freeCancellationHours: { type: Number, default: 48, min: 0 },
      houseRules: { type: String, default: 'No smoking inside rooms. Quiet hours from 10 pm to 7 am.' },
    },
    // Ratings are derived from the Review collection. Seeded properties mark them as demo data.
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    ratingIsDemo: { type: Boolean, default: false },
    // Clearly labelled sample reviews shown only when a property has no real reviews yet (demo mode)
    sampleReviews: [
      {
        _id: false,
        author: String,
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        stay: String,
      },
    ],
    // Lowest active room price, kept in sync by the room service so listings can sort by price
    startingPrice: { type: Number, default: 0, index: true },
    maxGuests: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    // Deactivating (instead of deleting) keeps old bookings readable
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

hotelSchema.index({ name: 'text', city: 'text', state: 'text' });

hotelSchema.pre('validate', function makeSlug(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = `${slugify(this.name)}-${slugify(this.city)}`;
  }
  next();
});

export const Hotel = mongoose.model('Hotel', hotelSchema);
