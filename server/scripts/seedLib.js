import { Hotel } from '../models/Hotel.js';
import { RoomType } from '../models/RoomType.js';
import { RoomInventory } from '../models/RoomInventory.js';
import { Booking } from '../models/Booking.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { slugify } from '../utils/slugify.js';
import { syncHotelDerived } from '../services/hotelService.js';
import { hotels } from './seedData.js';

export async function seedDemoUsers() {
  const users = [
    { name: 'AAVASA Admin', email: 'admin@aavasa.com', password: 'Admin123!', role: 'admin' },
    { name: 'AAVASA Staff', email: 'staff@aavasa.com', password: 'Staff123!', role: 'staff' },
    { name: 'Demo Guest', email: 'guest@aavasa.com', password: 'Guest123!', role: 'user', phone: '+91 98765 43210', city: 'Mumbai', staffNotes: 'VIP guest. Prefers high floor and garden view.' },
    { name: 'Priya Sharma', email: 'priya@example.com', password: 'Guest123!', role: 'user', phone: '+91 98765 11111', city: 'Delhi', staffNotes: 'Late check-in requested on previous visits.' },
    { name: 'Rahul Verma', email: 'rahul@example.com', password: 'Guest123!', role: 'user', phone: '+91 98765 22222', city: 'Bengaluru' },
  ];
  for (const u of users) {
    const existing = await User.findOne({ email: u.email });
    if (!existing) {
      await User.create(u);
    } else {
      existing.role = u.role;
      if (u.staffNotes && !existing.staffNotes) existing.staffNotes = u.staffNotes;
      await existing.save();
    }
  }
}

/**
 * Idempotent seeding: hotels are matched by slug and rooms by (hotel, name), then updated in place.
 * Running it twice never creates duplicates, and it never touches users or real bookings.
 */
export async function seedCatalogue() {
  await seedDemoUsers();
  let hotelCount = 0;
  let roomCount = 0;

  for (const { rooms, ...data } of hotels) {
    const slug = `${slugify(data.name)}-${slugify(data.city)}`;
    // Seeded ratings are demo data. Do not overwrite a rating once real reviews have been recorded.
    const existing = await Hotel.findOne({ slug }).select('ratingIsDemo reviewCount');
    const payload = { ...data, slug, ratingIsDemo: true, isActive: true };
    if (existing && existing.ratingIsDemo === false) {
      delete payload.rating;
      delete payload.reviewCount;
      delete payload.ratingIsDemo;
    }
    const hotel = await Hotel.findOneAndUpdate({ slug }, { $set: payload }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    hotelCount += 1;

    for (const room of rooms) {
      await RoomType.findOneAndUpdate(
        { hotel: hotel._id, name: room.name },
        { $set: { ...room, hotel: hotel._id, isActive: true } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
      roomCount += 1;
    }
    await syncHotelDerived(hotel._id);
  }
  return { hotels: hotelCount, roomTypes: roomCount };
}

/** Wipes catalogue and booking data (NOT users) so the demo can start fresh. */
export async function resetCatalogue() {
  const [b, i, r, rt, h] = await Promise.all([
    Booking.deleteMany({}),
    RoomInventory.deleteMany({}),
    Review.deleteMany({}),
    RoomType.deleteMany({}),
    Hotel.deleteMany({}),
  ]);
  return { bookings: b.deletedCount, inventory: i.deletedCount, reviews: r.deletedCount, roomTypes: rt.deletedCount, hotels: h.deletedCount };
}
