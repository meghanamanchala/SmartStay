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

  return NextResponse.json(properties);
}
