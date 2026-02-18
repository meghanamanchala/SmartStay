import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { stripe } from "@/lib/stripe";
import { notifyBookingConfirmed, notifyInfo } from "@/lib/notificationHelpers";

export const runtime = "nodejs";

async function handleCheckoutCompleted(checkoutSession: Stripe.Checkout.Session) {
  const metadata = checkoutSession.metadata || {};
  const propertyId = metadata.propertyId;
  const checkInRaw = metadata.checkIn;
  const checkOutRaw = metadata.checkOut;
  const guestsRaw = metadata.guests;
  const guestIdRaw = metadata.guestId;

  if (!propertyId || !checkInRaw || !checkOutRaw || !guestsRaw || !guestIdRaw) {
    return;
  }

  let propertyObjectId: ObjectId;
  let guestObjectId: ObjectId;

  try {
    propertyObjectId = new ObjectId(propertyId);
    guestObjectId = new ObjectId(guestIdRaw);
  } catch {
    return;
  }

  const checkInDate = new Date(checkInRaw);
  const checkOutDate = new Date(checkOutRaw);
  const guests = Number(guestsRaw);

  if (
    Number.isNaN(checkInDate.getTime()) ||
    Number.isNaN(checkOutDate.getTime()) ||
    checkOutDate <= checkInDate ||
    !Number.isFinite(guests) ||
    guests < 1
  ) {
    return;
  }

  const client = await clientPromise;
  const db = client.db();

  const existingBySession = await db.collection("bookings").findOne({
    paymentSessionId: checkoutSession.id,
  });
  if (existingBySession) {
    return;
  }

  const property = await db.collection("properties").findOne({ _id: propertyObjectId });
  if (!property) {
    return;
  }

  if (guests > Number(property.maxGuests || 0)) {
    return;
  }

  const overlap = await db.collection("bookings").findOne({
    property: propertyObjectId,
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
    status: { $ne: "cancelled" },
  });
  if (overlap) {
    return;
  }

  const nights = Math.max(
    1,
    Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const pricePerNight = Number(metadata.pricePerNight || property.price || 0);
  const cleaningFee = Number(metadata.cleaningFee || 0);
  const serviceFee = Number(metadata.serviceFee || 0);
  const computedTotal = pricePerNight * nights + cleaningFee + serviceFee;
  const totalPrice = Number(metadata.totalPrice || computedTotal);

  let hostRef: any = property.host;
  if (typeof property.host === "string") {
    try {
      hostRef = new ObjectId(property.host);
    } catch {
      hostRef = property.host;
    }
  }

  const paidAt =
    typeof checkoutSession.created === "number"
      ? new Date(checkoutSession.created * 1000)
      : new Date();

  const booking = {
    property: propertyObjectId,
    guest: guestObjectId,
    host: hostRef,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests,
    pricePerNight,
    cleaningFee,
    serviceFee,
    totalPrice,
    status: "confirmed",
    paymentStatus: "paid",
    paymentSessionId: checkoutSession.id,
    paymentIntentId:
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : "",
    paidAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("bookings").insertOne(booking);

  const guestEmail =
    metadata.guestEmail ||
    checkoutSession.customer_details?.email ||
    checkoutSession.customer_email ||
    "";

  if (guestEmail) {
    notifyBookingConfirmed(guestEmail, {
      propertyTitle: property.title || "Property",
      checkInDate: checkInDate.toISOString().split("T")[0],
      checkOutDate: checkOutDate.toISOString().split("T")[0],
      confirmedAt: new Date().toISOString(),
      bookingId: result.insertedId.toString(),
    }).catch(() => undefined);
  }

  let hostEmail = "";
  if (typeof hostRef === "string") {
    hostEmail = hostRef;
  } else if (hostRef) {
    const hostUser = await db.collection("users").findOne({ _id: hostRef });
    hostEmail = hostUser?.email || "";
  }

  if (hostEmail) {
    notifyInfo(hostEmail, {
      title: "New Paid Booking",
      message: `${guestEmail || "A guest"} paid for \"${property.title || "your property"}\" (${nights} night${nights > 1 ? "s" : ""}).`,
      actionUrl: "/host/bookings",
    }).catch(() => undefined);
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
  }

  try {
    const payload = await req.text();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(checkoutSession);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Webhook processing failed" },
      { status: 400 }
    );
  }
}
