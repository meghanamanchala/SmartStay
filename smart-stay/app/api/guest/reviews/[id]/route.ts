import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

// DELETE a specific review by ID (only if user is the review author)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    let reviewObjId;
    try {
      reviewObjId = new ObjectId(reviewId);
    } catch {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
    }

    const review = await db.collection('reviews').findOne({
      _id: reviewObjId,
      guest: session.user.email,
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      );
    }

    await db.collection('reviews').deleteOne({ _id: reviewObjId });

    if (review.booking) {
      await db.collection('bookings').updateOne(
        { _id: review.booking },
        { $set: { reviewed: false } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
