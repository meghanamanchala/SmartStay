import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { notifyBookingConfirmed, notifyBookingCancelled } from '@/lib/notificationHelpers';
import { stripe } from '@/lib/stripe';

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
          paymentStatus: 1,
          paymentSessionId: 1,
          paymentIntentId: 1,
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
    const allowed = ['pending', 'confirmed', 'checked-in', 'completed', 'cancelled'];
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

    const currentStatus = booking.status || 'pending';
    const now = new Date();
    const checkInDate = booking.checkIn instanceof Date ? booking.checkIn : new Date(booking.checkIn);
    const checkOutDate = booking.checkOut instanceof Date ? booking.checkOut : new Date(booking.checkOut);

    const isBeforeCheckIn = !Number.isNaN(checkInDate.getTime()) && now < checkInDate;
    const isAfterCheckIn = !Number.isNaN(checkInDate.getTime()) && now >= checkInDate;
    const isAfterCheckOut = !Number.isNaN(checkOutDate.getTime()) && now >= checkOutDate;

    const transitionAllowed =
      (currentStatus === 'pending' && status === 'confirmed') ||
      (currentStatus === 'pending' && status === 'cancelled' && isBeforeCheckIn) ||
      (currentStatus === 'confirmed' && status === 'cancelled' && isBeforeCheckIn) ||
      (currentStatus === 'confirmed' && status === 'checked-in' && isAfterCheckIn && !isAfterCheckOut) ||
      (currentStatus === 'checked-in' && status === 'completed' && isAfterCheckOut);

    if (!transitionAllowed) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
    }

    // Handle refund for paid bookings being cancelled
    if (status === 'cancelled' && booking.paymentStatus === 'paid' && booking.paymentIntentId) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: booking.paymentIntentId,
          reason: 'requested_by_customer',
        });

        await db.collection('bookings').updateOne(
          { _id: bookingObjectId },
          { 
            $set: { 
              status, 
              refundId: refund.id,
              refundStatus: refund.status,
              refundedAt: new Date(),
              updatedAt: new Date() 
            } 
          }
        );
      } catch (refundError) {
        return NextResponse.json({ 
          error: `Failed to process refund: ${refundError.message || 'Unknown error'}` 
        }, { status: 500 });
      }
    } else {
      await db.collection('bookings').updateOne(
        { _id: bookingObjectId },
        { $set: { status, updatedAt: new Date() } }
      );
    }

    const propertyDoc = await db.collection('properties').findOne({ _id: booking.property });

    let guestEmail;
    if (typeof booking.guest === 'string') {
      guestEmail = booking.guest;
    } else if (booking.guest) {
      const guestUser = await db.collection('users').findOne({ _id: booking.guest });
      guestEmail = guestUser?.email;
    }

    if (guestEmail) {
      const checkIn = booking.checkIn instanceof Date ? booking.checkIn : new Date(booking.checkIn);
      const checkOut = booking.checkOut instanceof Date ? booking.checkOut : new Date(booking.checkOut);
      const checkInDate = Number.isNaN(checkIn.getTime()) ? '' : checkIn.toISOString().split('T')[0];
      const checkOutDate = Number.isNaN(checkOut.getTime()) ? '' : checkOut.toISOString().split('T')[0];

      if (status === 'confirmed') {
        notifyBookingConfirmed(guestEmail, {
          propertyTitle: propertyDoc?.title || 'Property',
          checkInDate,
          checkOutDate,
          confirmedAt: new Date().toISOString(),
          bookingId: bookingObjectId.toString(),
        }).catch(() => undefined);
      }

      if (status === 'cancelled') {
        const wasRefunded = booking.paymentStatus === 'paid' && booking.paymentIntentId;
        notifyBookingCancelled(guestEmail, false, {
          propertyTitle: propertyDoc?.title || 'Property',
          reason: wasRefunded ? 'Host cancelled booking - Full refund processed' : 'Host cancelled booking',
          bookingId: bookingObjectId.toString(),
        }).catch(() => undefined);
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
