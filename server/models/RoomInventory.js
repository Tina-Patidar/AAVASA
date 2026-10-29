import mongoose from 'mongoose';

/**
 * One document per (room type, night) recording how many rooms are already booked.
 *
 * Why this design? Booking N rooms for several nights becomes a handful of atomic
 * conditional $inc operations ("only add rooms if booked + rooms <= totalRooms").
 * Because MongoDB applies each single-document update atomically, two people racing
 * for the last room can never both succeed, and no multi-document transaction (which
 * needs a replica set) is required.
 */
const roomInventorySchema = new mongoose.Schema({
  roomType: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  date: { type: Date, required: true },
  booked: { type: Number, default: 0, min: 0 },
});

roomInventorySchema.index({ roomType: 1, date: 1 }, { unique: true });

export const RoomInventory = mongoose.model('RoomInventory', roomInventorySchema);
