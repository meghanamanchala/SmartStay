import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participantEmail } = await req.json();

    if (!participantEmail) {
      return NextResponse.json(
        { error: 'Participant email is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('smartstay');

    // Mark all messages from participantEmail to current user as read
    await db.collection('messages').updateMany(
      {
        senderEmail: participantEmail,
        recipientEmail: session.user.email,
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Messages marked as read' 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
