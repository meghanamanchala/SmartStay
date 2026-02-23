
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { notifyNewReview } from '@/lib/notificationHelpers';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookingId, propertyId, rating, comment } = await req.json();
    if (!bookingId || !propertyId || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Convert to ObjectId
    let bookingObjId, propertyObjId;
    try {
      bookingObjId = new ObjectId(bookingId);
      propertyObjId = new ObjectId(propertyId);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid booking or property id' }, { status: 400 });
    }

    // Check if review already exists for this booking
    const existing = await db.collection('reviews').findOne({ booking: bookingObjId });
    if (existing) {
      return NextResponse.json({ error: 'Review already submitted for this booking' }, { status: 409 });
    }

    // Insert review
    const review = {
      booking: bookingObjId,
      property: propertyObjId,
      guest: session.user.email,
      rating,
      comment,
      date: new Date(),
    };
    const result = await db.collection('reviews').insertOne(review);

    // Optionally, mark booking as reviewed
    await db.collection('bookings').updateOne({ _id: bookingObjId }, { $set: { reviewed: true } });

    const property = await db.collection('properties').findOne({ _id: propertyObjId });
    const guestUser = await db.collection('users').findOne({ email: session.user.email });

    if (property?.host) {
      let hostQuery;
      if (typeof property.host === 'string') {
        try {
          hostQuery = { _id: new ObjectId(property.host) };
        } catch (e) {
          hostQuery = { email: property.host };
        }
      } else {
        hostQuery = { _id: property.host };
      }
      const hostUser = await db.collection('users').findOne(hostQuery);
      if (hostUser?.email) {
        notifyNewReview(hostUser.email, {
          guestName: guestUser?.name || session.user.email,
          propertyTitle: property.title || 'Property',
          rating: Number(rating),
          reviewTitle: String(comment).slice(0, 80),
          reviewId: result.insertedId.toString(),
        }).catch(() => undefined);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit review', details: error }, { status: 500 });
  }
}

// GET guest's own reviews with property details
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Find all reviews by this guest
    const reviews = await db
      .collection('reviews')
      .find({ guest: session.user.email })
      .sort({ date: -1 })
      .toArray();

    // Enrich with property details
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        let property = null;
        
        if (review.property) {
          try {
            // Try as ObjectId first
            if (typeof review.property === 'string') {
              property = await db.collection('properties').findOne({
                _id: new ObjectId(review.property),
              });
            } else {
              property = await db.collection('properties').findOne({
                _id: review.property,
              });
            }
          } catch (e) {
            // Fallback if not valid ObjectId
          }
        }

        return {
          _id: review._id,
          property: property ? {
            _id: property._id,
            title: property.title || property.name || 'Property',
            images: property.images || [],
            city: property.city,
            country: property.country,
          } : null,
          rating: review.rating,
          comment: review.comment,
          date: review.date,
        };
      })
    );

    return NextResponse.json({ reviews: enrichedReviews });
  } catch (error) {
    console.error('Error fetching guest reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
