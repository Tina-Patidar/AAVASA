import mongoose from 'mongoose';
import { Hotel } from '../models/Hotel.js';
import { RoomType } from '../models/RoomType.js';
import { RoomInventory } from '../models/RoomInventory.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { Review } from '../models/Review.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, conflict, notFound } from '../utils/AppError.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { parseDay, todayUTC } from '../utils/dates.js';
import { syncHotelDerived } from '../services/hotelService.js';
import { adminUpdateStatus, syncCompletedBookings, canCancel } from '../services/bookingService.js';
import { getOccupancy, maxBookedFromToday } from '../services/availabilityService.js';

const paginate = (q, defLimit = 10) => ({ page: q.page || 1, limit: q.limit || defLimit });
const pages = (total, limit) => Math.max(1, Math.ceil(total / limit));

// ======================= overview =======================
export const stats = asyncHandler(async (req, res) => {
  await syncCompletedBookings();
  const since = new Date(todayUTC().getTime() - 29 * 24 * 60 * 60 * 1000);

  const [hotels, activeHotels, bookings, users, byStatus, revenue, recent, trend] = await Promise.all([
    Hotel.countDocuments(),
    Hotel.countDocuments({ isActive: true }),
    Booking.countDocuments(),
    User.countDocuments(),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    // Revenue counts confirmed, checked_in, checked_out and completed bookings; cancelled/pending ones are excluded.
    // Payments are demo records, so this is "recorded booking value", not real money.
    Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'checked_in', 'checked_out', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
    ]),
    Booking.find().sort({ createdAt: -1 }).limit(8).populate('user', 'name email'),
    Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, bookings: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', bookings: 1 } },
    ]),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
  res.json({
    success: true,
    stats: {
      totalProperties: hotels,
      activeProperties: activeHotels,
      totalBookings: bookings,
      totalUsers: users,
      statusDistribution: ['pending', 'confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled'].map((s) => ({ status: s, count: statusMap[s] || 0 })),
      revenue: { total: revenue[0]?.total || 0, bookingCount: revenue[0]?.count || 0, currency: 'INR', note: 'Recorded booking value (demo payments, no real money processed)' },
      recentBookings: recent.map((b) => ({
        id: b._id,
        reference: b.reference,
        guest: b.user?.name || b.guestDetails.fullName,
        hotel: b.hotelSnapshot.name,
        total: b.pricing.total,
        status: b.status,
        createdAt: b.createdAt,
      })),
      // Frontend only draws a trend line when at least two days have data
      bookingTrend: trend,
    },
  });
});

// ======================= hotels =======================
export const listHotels = asyncHandler(async (req, res) => {
  const { q, status } = req.validatedQuery;
  const { page, limit } = paginate(req.validatedQuery);
  const filter = {};
  if (status) filter.isActive = status === 'active';
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { city: rx }];
  }
  const [hotels, total] = await Promise.all([
    Hotel.find(filter).select('-sampleReviews').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Hotel.countDocuments(filter),
  ]);
  const roomCounts = await RoomType.aggregate([
    { $match: { hotel: { $in: hotels.map((h) => h._id) } } },
    { $group: { _id: '$hotel', roomTypes: { $sum: 1 }, rooms: { $sum: '$totalRooms' } } },
  ]);
  const rc = new Map(roomCounts.map((r) => [String(r._id), r]));
  res.json({
    success: true,
    hotels: hotels.map((h) => ({ ...h, roomTypeCount: rc.get(String(h._id))?.roomTypes || 0, roomCount: rc.get(String(h._id))?.rooms || 0 })),
    pagination: { page, limit, total, pages: pages(total, limit) },
  });
});

export const getHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id).lean();
  if (!hotel) throw notFound('Property not found.');
  res.json({ success: true, hotel });
});

export const createHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.create(req.body);
  res.status(201).json({ success: true, hotel });
});

export const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw notFound('Property not found.');
  Object.assign(hotel, req.body);
  await hotel.save();
  res.json({ success: true, hotel });
});

/**
 * Safe deletion: a property with any booking history is only DEACTIVATED (hidden from guests,
 * old bookings stay readable). A property that never had a booking is removed together with its rooms.
 */
export const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw notFound('Property not found.');

  const bookingCount = await Booking.countDocuments({ hotel: hotel._id });
  if (bookingCount > 0) {
    hotel.isActive = false;
    await hotel.save();
    return res.json({ success: true, action: 'deactivated', message: 'This property has booking history, so it was deactivated instead of deleted.', hotel });
  }
  const rooms = await RoomType.find({ hotel: hotel._id }).select('_id');
  await RoomInventory.deleteMany({ roomType: { $in: rooms.map((r) => r._id) } });
  await RoomType.deleteMany({ hotel: hotel._id });
  await Review.deleteMany({ hotel: hotel._id });
  await hotel.deleteOne();
  res.json({ success: true, action: 'deleted', message: 'Property deleted.' });
});

// ======================= rooms =======================
export const listRooms = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.hotelId).select('name');
  if (!hotel) throw notFound('Property not found.');
  const rooms = await RoomType.find({ hotel: hotel._id }).sort({ pricePerNight: 1 }).lean();
  const occupancy = await getOccupancy(rooms.map((r) => r._id), 14);
  res.json({
    success: true,
    hotel: { id: hotel._id, name: hotel.name },
    rooms: rooms.map((r) => ({ ...r, occupancy: occupancy.get(String(r._id)) || [] })),
  });
});

export const createRoom = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.hotelId).select('_id');
  if (!hotel) throw notFound('Property not found.');
  const room = await RoomType.create({ ...req.body, hotel: hotel._id });
  await syncHotelDerived(hotel._id);
  res.status(201).json({ success: true, room });
});

export const updateRoom = asyncHandler(async (req, res) => {
  const room = await RoomType.findById(req.params.id);
  if (!room) throw notFound('Room type not found.');

  if (req.body.totalRooms !== undefined && req.body.totalRooms < room.totalRooms) {
    const booked = await maxBookedFromToday(room._id);
    if (req.body.totalRooms < booked) {
      throw conflict(`Cannot reduce inventory to ${req.body.totalRooms}: up to ${booked} rooms are already booked on an upcoming night.`);
    }
  }
  Object.assign(room, req.body);
  await room.save();
  await syncHotelDerived(room.hotel);
  res.json({ success: true, room });
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await RoomType.findById(req.params.id);
  if (!room) throw notFound('Room type not found.');

  const hasHistory = await Booking.exists({ roomType: room._id });
  if (hasHistory) {
    const upcoming = await Booking.exists({ roomType: room._id, status: { $in: ['pending', 'confirmed'] }, checkOut: { $gt: todayUTC() } });
    if (upcoming) throw conflict('This room type has upcoming bookings. Cancel or complete them before removing it.');
    room.isActive = false;
    await room.save();
    await syncHotelDerived(room.hotel);
    return res.json({ success: true, action: 'deactivated', message: 'Room type has booking history, so it was deactivated.' });
  }
  await RoomInventory.deleteMany({ roomType: room._id });
  await room.deleteOne();
  await syncHotelDerived(room.hotel);
  res.json({ success: true, action: 'deleted', message: 'Room type deleted.' });
});

// ======================= bookings =======================
export const listBookings = asyncHandler(async (req, res) => {
  await syncCompletedBookings();
  const { q, status, hotelId, from, to } = req.validatedQuery;
  const { page, limit } = paginate(req.validatedQuery);

  const filter = {};
  if (status) filter.status = status;
  if (hotelId) filter.hotel = hotelId;
  if (from || to) {
    filter.checkIn = {};
    if (from) filter.checkIn.$gte = parseDay(from, 'From date');
    if (to) filter.checkIn.$lte = parseDay(to, 'To date');
  }
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    const users = await User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id').limit(50).lean();
    filter.$or = [
      { reference: rx },
      { 'guestDetails.fullName': rx },
      { 'guestDetails.email': rx },
      { 'hotelSnapshot.name': rx },
      { user: { $in: users.map((u) => u._id) } },
    ];
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'name email'),
    Booking.countDocuments(filter),
  ]);
  res.json({
    success: true,
    bookings: bookings.map((b) => ({ ...b.toObject(), canCancel: canCancel(b) })),
    pagination: { page, limit, total, pages: pages(total, limit) },
  });
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('user', 'name email phone').populate('hotel', 'name city address slug isActive');
  if (!booking) throw notFound('Booking not found.');
  res.json({ success: true, booking: { ...booking.toObject(), canCancel: canCancel(booking) } });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw notFound('Booking not found.');
  const updated = await adminUpdateStatus(booking, req.body.status, req.user, req.body.reason);
  res.json({ success: true, booking: { ...updated.toObject(), canCancel: canCancel(updated) } });
});

// ======================= users =======================
export const listUsers = asyncHandler(async (req, res) => {
  const { q, role, active } = req.validatedQuery;
  const { page, limit } = paginate(req.validatedQuery);
  const filter = {};
  if (role) filter.role = role;
  if (active) filter.isActive = active === 'true';
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  const counts = await Booking.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) } } },
    { $group: { _id: '$user', bookings: { $sum: 1 } } },
  ]);
  const cm = new Map(counts.map((c) => [String(c._id), c.bookings]));
  res.json({
    success: true,
    users: users.map((u) => ({ ...u.toSafeJSON(), bookingCount: cm.get(String(u._id)) || 0 })),
    pagination: { page, limit, total, pages: pages(total, limit) },
  });
});

export const getUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw badRequest('Invalid user id.');
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found.');
  const bookings = await Booking.find({ user: user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, user: user.toSafeJSON(), bookings });
});

/**
 * Permitted account actions: activate/deactivate and promote/demote.
 * Guard rails: admins cannot modify their own account, and the last active admin cannot be removed.
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found.');
  if (String(user._id) === String(req.user._id)) throw badRequest('You cannot change your own role or status.');

  const demoting = user.role === 'admin' && (req.body.role === 'user' || req.body.isActive === false);
  if (demoting) {
    const otherAdmins = await User.countDocuments({ role: 'admin', isActive: true, _id: { $ne: user._id } });
    if (otherAdmins === 0) throw conflict('At least one active administrator must remain.');
  }
  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
  await user.save();
  res.json({ success: true, user: user.toSafeJSON() });
});

// ======================= guest management (staff & admin) =======================
export const listGuests = asyncHandler(async (req, res) => {
  const { q } = req.validatedQuery;
  const { page, limit } = paginate(req.validatedQuery);
  const filter = { role: 'user' };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  const userIds = users.map((u) => u._id);
  const bookingStats = await Booking.aggregate([
    { $match: { user: { $in: userIds } } },
    {
      $group: {
        _id: '$user',
        totalBookings: { $sum: 1 },
        totalSpend: {
          $sum: {
            $cond: [{ $in: ['$status', ['confirmed', 'checked_in', 'checked_out', 'completed']] }, '$pricing.total', 0],
          },
        },
        lastBookingDate: { $max: '$createdAt' },
      },
    },
  ]);
  const statsMap = new Map(bookingStats.map((s) => [String(s._id), s]));
  res.json({
    success: true,
    guests: users.map((u) => {
      const bs = statsMap.get(String(u._id)) || { totalBookings: 0, totalSpend: 0, lastBookingDate: null };
      return {
        ...u.toStaffSafeJSON(),
        bookingCount: bs.totalBookings,
        totalSpend: bs.totalSpend,
        lastBookingDate: bs.lastBookingDate,
      };
    }),
    pagination: { page, limit, total, pages: pages(total, limit) },
  });
});

export const getGuest = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw badRequest('Invalid guest id.');
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('Guest not found.');
  const bookings = await Booking.find({ user: user._id }).sort({ createdAt: -1 }).populate('hotel', 'name city slug');
  const totalSpend = bookings
    .filter((b) => ['confirmed', 'checked_in', 'checked_out', 'completed'].includes(b.status))
    .reduce((acc, b) => acc + (b.pricing?.total || 0), 0);
  res.json({
    success: true,
    guest: {
      ...user.toStaffSafeJSON(),
      bookingCount: bookings.length,
      totalSpend,
    },
    bookings: bookings.map((b) => ({ ...b.toObject(), canCancel: canCancel(b) })),
  });
});

export const updateGuestNotes = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw badRequest('Invalid guest id.');
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('Guest not found.');
  user.staffNotes = req.body.staffNotes ?? '';
  await user.save();
  res.json({ success: true, guest: user.toStaffSafeJSON() });
});

// ======================= room inventory 14-day grid (staff & admin) =======================
export const getRoomInventory = asyncHandler(async (req, res) => {
  const hotels = await Hotel.find({ isActive: true }).select('_id name city slug').sort({ name: 1 }).lean();
  if (!hotels.length) {
    return res.json({ success: true, hotels: [], matrix: [], dates: [] });
  }
  let selectedHotelId = req.query.hotelId;
  if (!selectedHotelId || !mongoose.isValidObjectId(selectedHotelId)) {
    selectedHotelId = String(hotels[0]._id);
  }
  const hotel = hotels.find((h) => String(h._id) === String(selectedHotelId)) || hotels[0];
  const roomTypes = await RoomType.find({ hotel: hotel._id, isActive: true }).sort({ pricePerNight: 1 }).lean();

  const days = Math.min(30, Math.max(1, Number(req.query.days) || 14));
  const startDay = req.query.startDate ? parseDay(req.query.startDate, 'Start date') : todayUTC();
  const dates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDay.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(d.toISOString().slice(0, 10));
  }
  const endDate = new Date(startDay.getTime() + days * 24 * 60 * 60 * 1000);

  const inventoryDocs = await RoomInventory.find({
    roomType: { $in: roomTypes.map((rt) => rt._id) },
    date: { $gte: startDay, $lt: endDate },
  }).lean();

  const inventoryMap = new Map();
  for (const doc of inventoryDocs) {
    const dateStr = doc.date.toISOString().slice(0, 10);
    inventoryMap.set(`${String(doc.roomType)}:${dateStr}`, doc.booked);
  }

  const matrix = roomTypes.map((rt) => {
    const rtId = String(rt._id);
    const dayStats = dates.map((dateStr) => {
      const booked = inventoryMap.get(`${rtId}:${dateStr}`) || 0;
      const total = rt.totalRooms;
      const free = Math.max(0, total - booked);
      const occupancyRate = total > 0 ? Math.round((booked / total) * 100) : 0;
      return {
        date: dateStr,
        booked,
        total,
        free,
        occupancyRate,
      };
    });
    return {
      roomType: {
        _id: rt._id,
        name: rt.name,
        totalRooms: rt.totalRooms,
        pricePerNight: rt.pricePerNight,
        maxGuests: rt.maxGuests,
      },
      days: dayStats,
    };
  });

  res.json({
    success: true,
    hotels,
    selectedHotel: hotel,
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    dates,
    matrix,
  });
});
