import { Hotel } from '../models/Hotel.js';
import { Review } from '../models/Review.js';
import { Booking } from '../models/Booking.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, conflict, forbidden } from '../utils/AppError.js';
import {
  getFilterMeta,
  getHotelByIdOrSlug,
  getPopularDestinations,
  getRoomsWithAvailability,
  getSimilarHotels,
  recalculateRating,
  searchHotels,
} from '../services/hotelService.js';

export const listHotels = asyncHandler(async (req, res) => {
  const data = await searchHotels(req.validatedQuery);
  res.json({ success: true, ...data });
});

export const featuredHotels = asyncHandler(async (req, res) => {
  const hotels = await Hotel.find({ isActive: true, featured: true })
    .select('-sampleReviews')
    .sort({ rating: -1 })
    .limit(6)
    .lean();
  res.json({ success: true, hotels });
});

export const filterMeta = asyncHandler(async (req, res) => {
  res.json({ success: true, ...(await getFilterMeta()) });
});

export const popularDestinations = asyncHandler(async (req, res) => {
  res.json({ success: true, destinations: await getPopularDestinations() });
});

export const getHotel = asyncHandler(async (req, res) => {
  const hotel = await getHotelByIdOrSlug(req.params.idOrSlug);
  const { checkIn, checkOut, rooms, guests } = req.validatedQuery;
  const [roomTypes, similar, reviews] = await Promise.all([
    getRoomsWithAvailability(hotel._id, { checkIn, checkOut, rooms, guests }),
    getSimilarHotels(hotel),
    Review.find({ hotel: hotel._id }).sort({ createdAt: -1 }).limit(6).populate('user', 'name').lean(),
  ]);

  const realReviews = reviews.map((r) => ({
    id: r._id,
    author: r.user?.name?.split(' ')[0] || 'Guest',
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    createdAt: r.createdAt,
    isSample: false,
  }));
  const sample = (hotel.sampleReviews || []).map((r) => ({ ...r, isSample: true }));
  const { sampleReviews, ...rest } = hotel;

  res.json({
    success: true,
    hotel: rest,
    rooms: roomTypes,
    reviews: realReviews.length ? realReviews : sample,
    reviewsAreSample: realReviews.length === 0 && sample.length > 0,
    similar,
  });
});

export const hotelAvailability = asyncHandler(async (req, res) => {
  const hotel = await getHotelByIdOrSlug(req.params.idOrSlug);
  const rooms = await getRoomsWithAvailability(hotel._id, req.validatedQuery);
  res.json({ success: true, rooms });
});

export const listReviews = asyncHandler(async (req, res) => {
  const hotel = await getHotelByIdOrSlug(req.params.idOrSlug);
  const reviews = await Review.find({ hotel: hotel._id }).sort({ createdAt: -1 }).limit(50).populate('user', 'name').lean();
  res.json({
    success: true,
    reviews: reviews.map((r) => ({
      id: r._id,
      author: r.user?.name?.split(' ')[0] || 'Guest',
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
  });
});

/** Only guests who completed a stay at this property can review it, once per booking. */
export const createReview = asyncHandler(async (req, res) => {
  const hotel = await getHotelByIdOrSlug(req.params.idOrSlug);
  const { bookingId, rating, title, comment } = req.body;

  const booking = await Booking.findOne({ _id: bookingId, user: req.user._id, hotel: hotel._id });
  if (!booking) throw forbidden('You can only review properties you have stayed at.');
  if (booking.status !== 'completed') throw badRequest('You can review a stay once it has been completed.');
  if (await Review.exists({ booking: booking._id })) throw conflict('You have already reviewed this stay.');

  const review = await Review.create({ hotel: hotel._id, user: req.user._id, booking: booking._id, rating, title, comment });
  await recalculateRating(hotel._id);
  res.status(201).json({ success: true, review });
});
