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

  let hostId;
  try {
    hostId = new ObjectId(session.user.id);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const dateFilter = searchParams.get('date');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') || 10)));

    const properties = await db.collection('properties').find({ host: hostId }).toArray();
    const propertyIds = properties.map((p) => p._id);
    
    const match = {
      $or: [
        { host: hostId },
        { property: { $in: propertyIds } }
      ]
    };

    if (status && status !== 'all') {
      match.status = status;
    }

    const now = new Date();
    if (dateFilter === 'upcoming') {
      match.checkIn = { $gte: now };
    } else if (dateFilter === 'past') {
      match.checkOut = { $lt: now };
    } else if (dateFilter === 'custom') {
      if (from) {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime())) {
          match.checkIn = { ...match.checkIn, $gte: fromDate };
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) {
          match.checkOut = { ...match.checkOut, $lte: toDate };
        }
      }
    }

    const total = await db.collection('bookings').countDocuments(match);
    const totalPages = Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;

    const bookings = await db.collection('bookings').aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'properties',
          localField: 'property',
          foreignField: '_id',
          as: 'property',
        },
      },
      { $unwind: '$property' },
      { $sort: { checkIn: -1 } },
      { $skip: skip },
      { $limit: pageSize },
      {
        $addFields: {
          guestObjectId: {
            $convert: {
              input: '$guest',
              to: 'objectId',
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'guestObjectId',
          foreignField: '_id',
          as: 'guestDetails',
        },
      },
      { $unwind: { path: '$guestDetails', preserveNullAndEmptyArrays: true } },
      { $sort: { checkIn: -1 } },
      {
        $project: {
          checkIn: 1,
          checkOut: 1,
          guests: 1,
          totalPrice: 1,
          status: 1,
          createdAt: 1,
          property: {
            _id: '$property._id',
            title: '$property.title',
            city: '$property.city',
            country: '$property.country',
            images: { $slice: ['$property.images', 1] },
          },
          guestDetails: {
            name: '$guestDetails.name',
            email: '$guestDetails.email',
          },
        },
      },
    ]).toArray();

    return NextResponse.json({
      bookings,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  const client = await clientPromise;
  const db = client.db();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let hostId;
  try {
    hostId = new ObjectId(session.user.id);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { bookingId, status } = body || {};
    const allowed = ['confirmed', 'cancelled'];
    if (!bookingId || !allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid booking update' }, { status: 400 });
    }

    let bookingObjectId;
    try {
      bookingObjectId = new ObjectId(bookingId);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
    }

    const booking = await db.collection('bookings').findOne({ _id: bookingObjectId });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if host owns this booking (either via host field or property ownership)
    const isHostOwner = booking.host && booking.host.equals(hostId);
    const property = await db.collection('properties').findOne({ _id: booking.property, host: hostId });
    
    if (!isHostOwner && !property) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.collection('bookings').updateOne(
      { _id: bookingObjectId },
      { $set: { status, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true, status });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
