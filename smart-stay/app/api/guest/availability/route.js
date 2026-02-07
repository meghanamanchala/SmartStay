import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function POST(req) {
  const client = await clientPromise;
  const db = client.db();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { propertyId, checkIn, checkOut } = body || {};

    if (!propertyId || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
    }
    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 });
    }

    let propertyObjectId;
    try {
      propertyObjectId = new ObjectId(propertyId);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid property id' }, { status: 400 });
    }

    const property = await db.collection('properties').findOne({ _id: propertyObjectId });
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const overlap = await db.collection('bookings').findOne({
      property: propertyObjectId,
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
      status: { $ne: 'cancelled' },
    });

    if (overlap) {
      return NextResponse.json({ available: false, reason: 'Dates overlap with an existing booking.' });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
