import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/guest/properties
export async function GET(req) {
  const client = await clientPromise;
  const db = client.db();

  // Aggregate all properties with host details (name, email only)
  const properties = await db.collection('properties').aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'host',
        foreignField: '_id',
        as: 'hostDetails',
      },
    },
    { $unwind: { path: '$hostDetails', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        title: 1,
        description: 1,
        images: 1,
        city: 1,
        country: 1,
        price: 1,
        maxGuests: 1,
        bedrooms: 1,
        bathrooms: 1,
        amenities: 1,
        createdAt: 1,
        host: 1,
        'hostDetails._id': 1,
        'hostDetails.name': 1,
        'hostDetails.email': 1,
      },
    },
  ]).toArray();

  // Fetch reviews for all properties
  const propertyIds = properties.map(p => p._id);
  const reviews = propertyIds.length > 0
    ? await db.collection('reviews').find({ property: { $in: propertyIds } }).toArray()
    : [];
  // Map propertyId to its reviews
  const reviewsByProperty = {};
  for (const r of reviews) {
    const pid = r.property?.toString();
    if (!reviewsByProperty[pid]) reviewsByProperty[pid] = [];
    reviewsByProperty[pid].push(r);
  }

  // Attach avgRating and reviewCount to each property
  const propertiesWithReviews = properties.map(p => {
    const pid = p._id?.toString();
    const propReviews = reviewsByProperty[pid] || [];
    const reviewCount = propReviews.length;
    // avgRating as a number, not string
    const avgRating = reviewCount > 0 ? (propReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount) : null;
    return { ...p, avgRating, reviewCount };
  });

  return NextResponse.json(propertiesWithReviews);
}
