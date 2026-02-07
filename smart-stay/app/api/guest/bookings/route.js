import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function GET(req) {
  const client = await clientPromise;
  const db = client.db();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    // Find bookings for the current user
    const bookings = await db.collection('bookings').aggregate([
      { $match: { guest: session.user.id } },
      {
        $lookup: {
          from: 'properties',
          localField: 'property',
          foreignField: '_id',
          as: 'property',
        },
      },
      { $unwind: '$property' },
      // Lookup host details from users collection
      {
        $lookup: {
          from: 'users',
          localField: 'property.host',
          foreignField: '_id',
          as: 'hostDetails',
        },
      },
      { $unwind: { path: '$hostDetails', preserveNullAndEmptyArrays: true } },
      { $sort: { checkIn: -1 } },
    ]).toArray();
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const client = await clientPromise;
  const db = client.db();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      propertyId,
      checkIn,
      checkOut,
      guests,
      pricePerNight,
      cleaningFee,
      serviceFee,
      totalPrice,
    } = body || {};

    if (!propertyId || !checkIn || !checkOut || !guests) {
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
    if (guests > property.maxGuests) {
      return NextResponse.json({ error: 'Guest count exceeds max guests' }, { status: 400 });
    }

    const overlap = await db.collection('bookings').findOne({
      property: propertyObjectId,
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
      status: { $ne: 'cancelled' },
    });
    if (overlap) {
      return NextResponse.json({ error: 'Selected dates are not available' }, { status: 409 });
    }

    const booking = {
      property: propertyObjectId,
      guest: session.user.id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      pricePerNight: Number(pricePerNight || property.price),
      cleaningFee: Number(cleaningFee || 0),
      serviceFee: Number(serviceFee || 0),
      totalPrice: Number(totalPrice || 0),
      status: 'confirmed',
      createdAt: new Date(),
    };

    const result = await db.collection('bookings').insertOne(booking);
    return NextResponse.json({ ...booking, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
