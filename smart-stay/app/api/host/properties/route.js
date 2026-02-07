import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function PUT(req) {
  const client = await clientPromise;
  const db = client.db();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Property id missing' }, { status: 400 });
  }

  const data = await req.json();

  delete data._id;
  delete data.host;
  delete data.createdAt;

  const result = await db.collection('properties').updateOne(
    { _id: new ObjectId(id), host: new ObjectId(session.user.id) },
    { $set: { ...data, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: 'Property not found or unauthorized' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req) {
  const client = await clientPromise;
  const db = client.db();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing property id' }, { status: 400 });
  }

  const result = await db.collection('properties').deleteOne({
    _id: new ObjectId(id),
    host: new ObjectId(session.user.id), // ✅ FIX HERE
  });

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: 'Property not found or unauthorized' },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true });
}


export async function POST(req) {
  const client = await clientPromise;
  const db = client.db();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  try {
    const property = {
      ...data,
      host: new ObjectId(session.user.id),
      createdAt: new Date(),
    };
    const result = await db.collection('properties').insertOne(property);
    return NextResponse.json({ ...property, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  const client = await clientPromise;
  const db = client.db();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let userId;
  try {
    userId = new ObjectId(session.user.id);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    // Fetch a single property by id for details page
    let property;
    try {
      property = await db.collection('properties').findOne({ _id: new ObjectId(id), host: userId });
    } catch (e) {
      return NextResponse.json({ error: 'Invalid property id' }, { status: 400 });
    }
    if (!property) {
      return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 404 });
    }
    return NextResponse.json(property);
  }

  // Fetch properties owned by host

  const properties = await db.collection('properties').find({ host: userId }).toArray();

  // Dashboard stats
  const activeListings = properties.length;

  // Fetch bookings for host's properties
  const propertyIds = properties.map(p => p._id);
  const bookings = propertyIds.length > 0
    ? await db.collection('bookings').find({ property: { $in: propertyIds } }).toArray()
    : [];

  // Total earnings (sum of booking amounts)
  const totalEarnings = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  // Upcoming bookings (future check-in dates)
  const now = new Date();
  const upcomingBookings = bookings.filter(b => b.checkIn && new Date(b.checkIn) > now).length;

  // Average rating (from reviews)
  const reviews = propertyIds.length > 0
    ? await db.collection('reviews').find({ property: { $in: propertyIds } }).toArray()
    : [];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  // Recent bookings (last 5)
  const recentBookings = bookings
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return NextResponse.json({
    properties,
    stats: {
      activeListings,
      totalEarnings,
      upcomingBookings,
      avgRating,
      recentBookings,
    }
  });
}
