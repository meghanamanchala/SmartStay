import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import Stripe from 'stripe';
import clientPromise from '@/lib/mongodb';

export async function POST(req) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !stripeWebhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const payload = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe webhook signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session?.metadata?.bookingId;

    if (bookingId) {
      try {
        const client = await clientPromise;
        const db = client.db();
        const bookingObjectId = new ObjectId(bookingId);

        await db.collection('bookings').updateOne(
          { _id: bookingObjectId },
          {
            $set: {
              paymentStatus: 'paid',
              paymentPaidAt: new Date(),
              paymentSessionId: session.id,
              updatedAt: new Date(),
            },
          }
        );
      } catch {
      }
    }
  }

  return NextResponse.json({ received: true });
}
