import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { product, booking } = await req.json();
    const amount = Number(product?.price || 0);

    if (!product?.name || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid checkout payload" }, { status: 400 });
    }

    const appUrl =
      process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const metadata: Record<string, string> = {
      guestEmail: session.user.email || "",
      guestId: (session.user as any).id || "",
    };

    if (booking?.propertyId) metadata.propertyId = String(booking.propertyId);
    if (booking?.checkIn) metadata.checkIn = String(booking.checkIn);
    if (booking?.checkOut) metadata.checkOut = String(booking.checkOut);
    if (booking?.guests) metadata.guests = String(booking.guests);
    if (booking?.nights) metadata.nights = String(booking.nights);
    if (booking?.pricePerNight) metadata.pricePerNight = String(booking.pricePerNight);
    if (booking?.cleaningFee !== undefined) metadata.cleaningFee = String(booking.cleaningFee);
    if (booking?.serviceFee !== undefined) metadata.serviceFee = String(booking.serviceFee);
    if (booking?.totalPrice) metadata.totalPrice = String(booking.totalPrice);

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: session.user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              description: "SmartStay - Your trusted accommodation platform",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
