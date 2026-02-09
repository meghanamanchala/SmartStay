import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // Find all properties owned by the host (by host ObjectId)
    // Safely get possible host identifiers
    const userAny = session.user as any;
    let hostId: string | undefined = undefined;
    if (userAny && typeof userAny === 'object') {
      hostId = userAny._id || userAny.id || undefined;
    }
    // Try to use ObjectId if possible, else fallback to string
    let hostObjId: any = undefined;
    if (hostId) {
      try {
        const { ObjectId } = await import('mongodb');
        hostObjId = new ObjectId(hostId);
      } catch (e) {
        hostObjId = hostId;
      }
    }
    // Find properties where host matches ObjectId
    const propertyQuery: any = { $or: [] };
    if (hostObjId) propertyQuery.$or.push({ host: hostObjId });
    if (hostId) propertyQuery.$or.push({ host: hostId });
    if (session.user.email) propertyQuery.$or.push({ hostEmail: session.user.email });
    // If no host info, fallback to impossible query
    if (propertyQuery.$or.length === 0) propertyQuery.$or.push({ _id: null });
    const properties = await db.collection('properties').find(propertyQuery).toArray();
    const propertyIds = properties.map((p: any) => p._id);

    // Find all reviews for these properties
    const reviews = await db.collection('reviews').find({ property: { $in: propertyIds } }).toArray();

    // Optionally, join guest info and property info
    const users = await db.collection('users').find({}).toArray();
    const usersMap = Object.fromEntries(users.map((u: any) => [u._id.toString(), u]));
    const propertiesMap = Object.fromEntries(properties.map((p: any) => [p._id.toString(), p]));

    // Format reviews
    const formattedReviews = reviews.map((r: any) => ({
      _id: r._id,
      guest: usersMap[r.guest?.toString()] || null,
      property: propertiesMap[r.property?.toString()] || null,
      rating: r.rating,
      comment: r.comment,
      date: r.date,
      reply: r.reply || null,
    }));

    // Calculate summary
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / totalReviews) : 0;
    const fiveStarReviews = reviews.filter((r: any) => r.rating === 5).length;

    return NextResponse.json({
      summary: {
        averageRating: averageRating.toFixed(1),
        totalReviews,
        fiveStarReviews,
      },
      reviews: formattedReviews,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews', details: error }, { status: 500 });
  }
}
