import { Hotel } from '../models/Hotel.js';
import { RoomType } from '../models/RoomType.js';
import { Review } from '../models/Review.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { validateStay } from '../utils/dates.js';
import { notFound } from '../utils/AppError.js';
import { getFreeRooms } from './availabilityService.js';
import mongoose from 'mongoose';

/** Keeps denormalised hotel fields (startingPrice, maxGuests) in sync after any room change. */
export async function syncHotelDerived(hotelId) {
  const rooms = await RoomType.find({ hotel: hotelId, isActive: true }).select('pricePerNight maxGuests').lean();
  const startingPrice = rooms.length ? Math.min(...rooms.map((r) => r.pricePerNight)) : 0;
  const maxGuests = rooms.length ? Math.max(...rooms.map((r) => r.maxGuests)) : 0;
  await Hotel.updateOne({ _id: hotelId }, { $set: { startingPrice, maxGuests } });
}

const SORTS = {
  recommended: (a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating || a.name.localeCompare(b.name),
  price_asc: (a, b) => a.fromPrice - b.fromPrice,
  price_desc: (a, b) => b.fromPrice - a.fromPrice,
  rating_desc: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
};

/**
 * Hotel discovery. Hotel-level filters run in MongoDB; room-level conditions (price, guests,
 * rooms, availability) are applied to RoomTypes and joined back. Hotels are only marked
 * `available` when dates were supplied AND a room type really has free inventory.
 */
export async function searchHotels(q) {
  const guests = q.guests || 1;
  const rooms = q.rooms || 1;
  const guestsPerRoom = Math.ceil(guests / rooms);

  // ---- hotel level filter
  const hotelFilter = { isActive: true };
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    hotelFilter.$or = [{ name: rx }, { city: rx }, { state: rx }, { country: rx }, { tagline: rx }];
  }
  if (q.city) hotelFilter.city = new RegExp(`^${escapeRegex(q.city)}$`, 'i');
  if (q.propertyType?.length) hotelFilter.propertyType = { $in: q.propertyType };
  if (q.amenities?.length) hotelFilter.amenities = { $all: q.amenities };
  if (q.stars) hotelFilter.starCategory = { $gte: q.stars };

  // ---- room level filter
  const roomFilter = {
    isActive: true,
    maxGuests: { $gte: guestsPerRoom },
    totalRooms: { $gte: rooms },
  };
  if (q.minPrice != null || q.maxPrice != null) {
    roomFilter.pricePerNight = {};
    if (q.minPrice != null) roomFilter.pricePerNight.$gte = q.minPrice;
    if (q.maxPrice != null) roomFilter.pricePerNight.$lte = q.maxPrice;
  }

  const datesGiven = Boolean(q.checkIn && q.checkOut);
  let stay = null;
  if (datesGiven) stay = validateStay(q.checkIn, q.checkOut);

  const hotels = await Hotel.find(hotelFilter)
    .select('-sampleReviews -policies.houseRules')
    .lean();
  const hotelIds = hotels.map((h) => h._id);
  const roomTypes = await RoomType.find({ ...roomFilter, hotel: { $in: hotelIds } })
    .select('hotel pricePerNight maxGuests totalRooms name')
    .lean();

  let freeMap = null;
  if (datesGiven) freeMap = await getFreeRooms(roomTypes, stay.checkIn, stay.checkOut);

  const byHotel = new Map();
  for (const rt of roomTypes) {
    if (freeMap && freeMap.get(String(rt._id)) < rooms) continue; // not enough free rooms for the dates
    const key = String(rt.hotel);
    const entry = byHotel.get(key) || { fromPrice: Infinity, matchingRooms: 0 };
    entry.fromPrice = Math.min(entry.fromPrice, rt.pricePerNight);
    entry.matchingRooms += 1;
    byHotel.set(key, entry);
  }

  let results = hotels
    .filter((h) => byHotel.has(String(h._id)))
    .map((h) => ({
      ...h,
      fromPrice: byHotel.get(String(h._id)).fromPrice,
      matchingRoomTypes: byHotel.get(String(h._id)).matchingRooms,
      // Honest availability: unknown unless the user gave dates
      availability: datesGiven
        ? { checked: true, available: true, checkIn: q.checkIn, checkOut: q.checkOut, nights: stay.nights }
        : { checked: false },
    }));

  results.sort(SORTS[q.sort] || SORTS.recommended);

  const total = results.length;
  const page = q.page || 1;
  const limit = q.limit || 9;
  results = results.slice((page - 1) * limit, page * limit);

  return { hotels: results, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function getHotelByIdOrSlug(idOrSlug, { activeOnly = true } = {}) {
  const filter = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  if (activeOnly) filter.isActive = true;
  const hotel = await Hotel.findOne(filter).lean();
  if (!hotel) throw notFound('Property not found.');
  return hotel;
}

/** Room list for a hotel with availability for the given stay (when provided). */
export async function getRoomsWithAvailability(hotelId, { checkIn, checkOut, rooms = 1, guests = 1 } = {}) {
  const roomTypes = await RoomType.find({ hotel: hotelId, isActive: true }).sort({ pricePerNight: 1 }).lean();
  let freeMap = null;
  let stay = null;
  if (checkIn && checkOut) {
    stay = validateStay(checkIn, checkOut);
    freeMap = await getFreeRooms(roomTypes, stay.checkIn, stay.checkOut);
  }
  return roomTypes.map((rt) => {
    const fitsGuests = rt.maxGuests * rooms >= guests;
    if (!freeMap) return { ...rt, availability: { checked: false }, fitsGuests };
    const free = freeMap.get(String(rt._id));
    return {
      ...rt,
      fitsGuests,
      availability: {
        checked: true,
        availableRooms: free,
        available: free >= rooms && fitsGuests,
        nights: stay.nights,
      },
    };
  });
}

export async function getSimilarHotels(hotel, limit = 3) {
  return Hotel.find({
    _id: { $ne: hotel._id },
    isActive: true,
    $or: [{ city: hotel.city }, { propertyType: hotel.propertyType }],
  })
    .select('name slug city state propertyType images startingPrice rating reviewCount ratingIsDemo starCategory amenities')
    .sort({ featured: -1, rating: -1 })
    .limit(limit)
    .lean();
}

/** Options that populate the filter UI (only values that really exist in the database). */
export async function getFilterMeta() {
  const [cities, types, priceRange] = await Promise.all([
    Hotel.distinct('city', { isActive: true }),
    Hotel.distinct('propertyType', { isActive: true }),
    RoomType.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, min: { $min: '$pricePerNight' }, max: { $max: '$pricePerNight' } } },
    ]),
  ]);
  const amenities = await Hotel.distinct('amenities', { isActive: true });
  return {
    cities: cities.sort(),
    propertyTypes: types.sort(),
    amenities: amenities.sort(),
    priceRange: { min: priceRange[0]?.min || 0, max: priceRange[0]?.max || 0 },
  };
}

export async function getPopularDestinations(limit = 6) {
  return Hotel.aggregate([
    { $match: { isActive: true } },
    { $sort: { featured: -1, rating: -1 } },
    {
      $group: {
        _id: '$city',
        state: { $first: '$state' },
        properties: { $sum: 1 },
        fromPrice: { $min: '$startingPrice' },
        image: { $first: { $arrayElemAt: ['$images', 0] } },
      },
    },
    { $sort: { properties: -1, _id: 1 } },
    { $limit: limit },
    { $project: { _id: 0, city: '$_id', state: 1, properties: 1, fromPrice: 1, image: 1 } },
  ]);
}

/** Recalculate the public rating from real reviews. Seeded demo ratings are replaced once real reviews exist. */
export async function recalculateRating(hotelId) {
  const [row] = await Review.aggregate([
    { $match: { hotel: new mongoose.Types.ObjectId(String(hotelId)) } },
    { $group: { _id: '$hotel', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (!row) return;
  await Hotel.updateOne(
    { _id: hotelId },
    { $set: { rating: Math.round(row.avg * 10) / 10, reviewCount: row.count, ratingIsDemo: false } }
  );
}
