import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sinceParam = req.nextUrl.searchParams.get('since');
    const since = sinceParam ? new Date(parseInt(sinceParam)) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const client = await clientPromise;
    const db = client.db();

    const notifications = await db
      .collection('notifications')
      .find({
        recipientEmail: session.user.email,
        createdAt: { $gt: since },
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    if (notifications.length > 0) {
      const ids = notifications.map((n: any) =>
        typeof n._id === 'string' ? new ObjectId(n._id) : n._id
      );
      await db.collection('notifications').updateMany(
        { _id: { $in: ids } },
        { $set: { read: true } }
      );
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Notification fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
