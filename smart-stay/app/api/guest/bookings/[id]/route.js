import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { notifyBookingCancelled } from '@/lib/notificationHelpers';

export async function GET(req, { params }) {
  const client = await clientPromise;
  const db = client.db();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let bookingId;
  try {
    bookingId = new ObjectId(id);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
  }

  let guestId = session.user.id;
  try {
    guestId = new ObjectId(session.user.id);
  } catch (e) {
  }

  const match = {
    _id: bookingId,
    $or: [{ guest: guestId }, { guest: session.user.id }],
  };

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
    { $unwind: { path: '$property', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        hostObjectId: {
          $convert: {
            input: '$property.host',
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
        localField: 'hostObjectId',
        foreignField: '_id',
        as: 'hostDetails',
      },
    },
    { $unwind: { path: '$hostDetails', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        checkIn: 1,
        checkOut: 1,
        guests: 1,
        status: 1,
        paymentStatus: 1,
        paymentPaidAt: 1,
        pricePerNight: 1,
        cleaningFee: 1,
        serviceFee: 1,
        totalPrice: 1,
        createdAt: 1,
        cancelledAt: 1,
        property: {
          _id: '$property._id',
          title: '$property.title',
          category: '$property.category',
          address: '$property.address',
          city: '$property.city',
          country: '$property.country',
          price: '$property.price',
          images: { $slice: ['$property.images', 5] },
        },
        hostDetails: {
          _id: '$hostDetails._id',
          name: '$hostDetails.name',
          email: '$hostDetails.email',
          phone: '$hostDetails.phone',
        },
      },
    },
  ]).toArray();

  if (!bookings[0]) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  return NextResponse.json(bookings[0]);
}

export async function PATCH(req, { params }) {
  const client = await clientPromise;
  const db = client.db();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let bookingId;
  try {
    bookingId = new ObjectId(id);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
  }

  let guestId = session.user.id;
  try {
    guestId = new ObjectId(session.user.id);
  } catch (e) {
  }

  const match = {
    _id: bookingId,
    $or: [{ guest: guestId }, { guest: session.user.id }],
  };

  const booking = await db.collection('bookings').findOne(match);
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: 'Booking already cancelled' }, { status: 400 });
  }
  if (booking.status === 'checked-in' || booking.status === 'completed') {
    return NextResponse.json({ error: 'Booking can no longer be cancelled after check-in' }, { status: 400 });
  }

  const today = new Date();
  const checkInDate = new Date(booking.checkIn);
  const cutoffMs = 24 * 60 * 60 * 1000;

  if (Number.isNaN(checkInDate.getTime())) {
    return NextResponse.json({ error: 'Invalid check-in date' }, { status: 400 });
  }

  if (checkInDate.getTime() - today.getTime() <= cutoffMs) {
    return NextResponse.json({ error: 'Booking can no longer be cancelled within 24 hours of check-in' }, { status: 400 });
  }

  const cancelledAt = new Date();
  const updateResult = await db.collection('bookings').updateOne(
    { _id: bookingId },
    { $set: { status: 'cancelled', cancelledAt } }
  );

  if (!updateResult.matchedCount) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const updated = { ...booking, status: 'cancelled', cancelledAt };
  const propertyDoc = await db.collection('properties').findOne({ _id: updated.property });
  let hostEmail;
  if (typeof updated.host === 'string') {
    hostEmail = updated.host;
  } else if (updated.host) {
    const hostUser = await db.collection('users').findOne({ _id: updated.host });
    hostEmail = hostUser?.email;
  }

  if (hostEmail) {
    notifyBookingCancelled(hostEmail, true, {
      propertyTitle: propertyDoc?.title || 'Property',
      guestName: session.user.email,
      reason: 'Guest cancelled booking',
      bookingId: bookingId.toString(),
    }).catch(() => undefined);
  }
  const serialized = {
    ...updated,
    _id: updated._id?.toString?.() || updated._id,
    property: updated.property?.toString?.() || updated.property,
    guest: updated.guest?.toString?.() || updated.guest,
    host: updated.host?.toString?.() || updated.host,
    checkIn: updated.checkIn instanceof Date ? updated.checkIn.toISOString() : updated.checkIn,
    checkOut: updated.checkOut instanceof Date ? updated.checkOut.toISOString() : updated.checkOut,
    createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : updated.createdAt,
    cancelledAt: updated.cancelledAt instanceof Date ? updated.cancelledAt.toISOString() : updated.cancelledAt,
  };

  return NextResponse.json(serialized);
}
