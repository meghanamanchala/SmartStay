import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import Stripe from 'stripe';

function getBaseUrl(req) {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  const origin = req.headers.get('origin');
  if (origin) return origin;
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req, { params }) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
  } catch {
    return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
  }

  let guestId = session.user.id;
  try {
    guestId = new ObjectId(session.user.id);
  } catch {
  }

  const booking = await db.collection('bookings').findOne({
    _id: bookingId,
    $or: [{ guest: guestId }, { guest: session.user.id }],
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if ((booking.status || '').toLowerCase() !== 'confirmed') {
    return NextResponse.json({ error: 'Payment is allowed only for confirmed bookings' }, { status: 400 });
  }

  if ((booking.paymentStatus || 'unpaid').toLowerCase() === 'paid') {
    return NextResponse.json({ error: 'Booking is already paid' }, { status: 400 });
  }

  const total = Number(booking.totalPrice || 0);
  if (!Number.isFinite(total) || total <= 0) {
    return NextResponse.json({ error: 'Invalid booking amount' }, { status: 400 });
  }

  const property = await db.collection('properties').findOne({ _id: booking.property });
  const baseUrl = getBaseUrl(req);
  const amountCents = Math.round(total * 100);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${baseUrl}/guest/bookings/${bookingId.toString()}?payment=success`,
    cancel_url: `${baseUrl}/guest/bookings/${bookingId.toString()}?payment=cancelled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: property?.title || 'SmartStay Booking',
            description: `Booking ${bookingId.toString()}`,
          },
        },
      },
    ],
    metadata: {
      bookingId: bookingId.toString(),
    },
  });

  await db.collection('bookings').updateOne(
    { _id: bookingId },
    {
      $set: {
        paymentStatus: 'unpaid',
        paymentSessionId: checkoutSession.id,
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({ url: checkoutSession.url });
}
