import mongoose from 'mongoose';

export const BOOKING_STATUSES = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'completed'];

const bookingSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    roomType: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },

    // Snapshots so a booking stays readable even if the hotel/room is edited or deactivated later
    hotelSnapshot: {
      name: String,
      city: String,
      image: String,
      imageAlt: String,
      slug: String,
    },
    roomSnapshot: { name: String },

    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    rooms: { type: Number, required: true, min: 1, max: 10 },
    guests: { type: Number, required: true, min: 1 },

    guestDetails: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, trim: true, default: '' },
      specialRequests: { type: String, trim: true, maxlength: 500, default: '' },
    },

    // Every amount is computed on the server by pricingService
    pricing: {
      nightlyRate: { type: Number, required: true },
      nights: { type: Number, required: true },
      rooms: { type: Number, required: true },
      subtotal: { type: Number, required: true },
      taxRate: { type: Number, required: true },
      taxes: { type: Number, required: true },
      serviceFeeRate: { type: Number, required: true },
      serviceFee: { type: Number, required: true },
      total: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
    },

    status: { type: String, enum: BOOKING_STATUSES, default: 'confirmed', index: true },

    // Demo checkout: nothing is charged. A future gateway can replace `provider` and `status`.
    payment: {
      mode: { type: String, enum: ['demo', 'gateway'], default: 'demo' },
      provider: { type: String, default: 'demo' },
      status: { type: String, enum: ['demo_recorded', 'pending', 'paid', 'refunded'], default: 'demo_recorded' },
    },

    cancellation: {
      cancelledAt: Date,
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: { type: String, maxlength: 300 },
      freeCancellation: Boolean,
    },

    // Client-generated key so double-clicks / retries do not create duplicate bookings
    idempotencyKey: { type: String },
    // True while inventory for this booking is held. Prevents releasing inventory twice.
    inventoryHeld: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });
bookingSchema.index({ user: 1, checkIn: -1 });
bookingSchema.index({ hotel: 1, checkIn: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
