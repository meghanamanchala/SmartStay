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
    let since: Date;
    if (sinceParam) {
      const sinceNum = Number(sinceParam);
      if (isNaN(sinceNum)) {
        console.error('Invalid since parameter:', sinceParam);
        return NextResponse.json({ error: 'Invalid since parameter' }, { status: 400 });
      }
      since = new Date(sinceNum);
      if (isNaN(since.getTime())) {
        console.error('Invalid since date from parameter:', sinceParam);
        return NextResponse.json({ error: 'Invalid since date' }, { status: 400 });
      }
    } else {
      since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    }

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

    console.log('Fetched notifications:', notifications);

    if (notifications.length > 0) {
      const ids = notifications.map((n: any) => {
        if (!n._id) {
          console.error('Notification missing _id:', n);
          return null;
        }
        try {
          return typeof n._id === 'string' ? new ObjectId(n._id) : n._id;
        } catch (e) {
          console.error('Invalid ObjectId for notification:', n._id, e);
          return null;
        }
      }).filter(Boolean);
      if (ids.length > 0) {
        await db.collection('notifications').updateMany(
          { _id: { $in: ids } },
          { $set: { read: true } }
        );
      } else {
        console.warn('No valid notification IDs to update as read.');
      }
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Notification fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
}
