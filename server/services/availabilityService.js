import { RoomInventory } from '../models/RoomInventory.js';
import { RoomType } from '../models/RoomType.js';
import { listNights, todayUTC } from '../utils/dates.js';
import { conflict } from '../utils/AppError.js';

/**
 * How many rooms of each type are free for EVERY night of the stay?
 *   free = totalRooms - (highest number already booked on any single night)
 * Returns a Map<roomTypeId string, number>.
 */
export async function getFreeRooms(roomTypes, checkIn, checkOut) {
  const ids = roomTypes.map((r) => r._id);
  const rows = await RoomInventory.aggregate([
    { $match: { roomType: { $in: ids }, date: { $gte: checkIn, $lt: checkOut } } },
    { $group: { _id: '$roomType', maxBooked: { $max: '$booked' } } },
  ]);
  const maxBooked = new Map(rows.map((r) => [String(r._id), r.maxBooked]));
  const result = new Map();
  for (const rt of roomTypes) {
    result.set(String(rt._id), Math.max(0, rt.totalRooms - (maxBooked.get(String(rt._id)) || 0)));
  }
  return result;
}

/** Try to add `rooms` to a single night. Returns true only if capacity allowed it (atomic). */
async function holdNight(roomType, date, rooms) {
  const maxBookedBefore = roomType.totalRooms - rooms;
  if (maxBookedBefore < 0) return false;

  const filter = { roomType: roomType._id, date, booked: { $lte: maxBookedBefore } };
  const update = { $inc: { booked: rooms } };

  try {
    // upsert creates the night's counter the first time anybody books it
    const doc = await RoomInventory.findOneAndUpdate(filter, update, { upsert: true, new: true });
    return Boolean(doc);
  } catch (err) {
    if (err.code !== 11000) throw err;
    // Duplicate key: the counter exists but either (a) the night is full, so the conditional upsert
    // tried to insert a second document, or (b) another request created it a split second ago.
    // Retrying WITHOUT upsert tells those cases apart.
    const doc = await RoomInventory.findOneAndUpdate(filter, update, { new: true });
    return Boolean(doc);
  }
}

/**
 * Atomically reserve `rooms` rooms for every night. If any night is full the nights already
 * reserved are rolled back and a 409 error is thrown, so inventory never leaks.
 */
export async function holdInventory(roomType, nights, rooms) {
  const held = [];
  try {
    for (const date of nights) {
      const ok = await holdNight(roomType, date, rooms);
      if (!ok) {
        throw conflict('Sorry, that room type is no longer available for all of the selected dates.');
      }
      held.push(date);
    }
  } catch (err) {
    await releaseNights(roomType._id, held, rooms);
    throw err;
  }
}

async function releaseNights(roomTypeId, nights, rooms) {
  for (const date of nights) {
    await RoomInventory.updateOne({ roomType: roomTypeId, date, booked: { $gte: rooms } }, { $inc: { booked: -rooms } });
  }
}

export async function releaseInventory(roomTypeId, checkIn, checkOut, rooms) {
  await releaseNights(roomTypeId, listNights(checkIn, checkOut), rooms);
}

/** Highest booking count on any future night. Used to stop admins shrinking inventory below existing bookings. */
export async function maxBookedFromToday(roomTypeId) {
  const [row] = await RoomInventory.aggregate([
    { $match: { roomType: roomTypeId, date: { $gte: todayUTC() } } },
    { $group: { _id: null, maxBooked: { $max: '$booked' } } },
  ]);
  return row?.maxBooked || 0;
}

/** Day-by-day occupancy for the admin room view. */
export async function getOccupancy(roomTypeIds, days = 14) {
  const start = todayUTC();
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  const rows = await RoomInventory.find({ roomType: { $in: roomTypeIds }, date: { $gte: start, $lt: end } })
    .select('roomType date booked')
    .lean();
  const types = await RoomType.find({ _id: { $in: roomTypeIds } }).select('totalRooms').lean();
  const totals = new Map(types.map((t) => [String(t._id), t.totalRooms]));
  const byType = new Map();
  for (const row of rows) {
    const key = String(row.roomType);
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key).push({
      date: row.date.toISOString().slice(0, 10),
      booked: row.booked,
      free: Math.max(0, (totals.get(key) || 0) - row.booked),
    });
  }
  for (const list of byType.values()) list.sort((a, b) => a.date.localeCompare(b.date));
  return byType;
}
