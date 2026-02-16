import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('smartstay');

    // Get all messages where user is sender or recipient
    const messages = await db
      .collection('messages')
      .find({
        $or: [
          { senderEmail: session.user.email },
          { recipientEmail: session.user.email },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    // Group messages by conversation (by other participant)
    const conversations = new Map();
    
    for (const msg of messages) {
      const otherParty = msg.senderEmail === session.user.email 
        ? msg.recipientEmail 
        : msg.senderEmail;

      if (!conversations.has(otherParty)) {
        // Get the other participant's name from users collection
        const otherUser = await db.collection('users').findOne({ email: otherParty });
        const otherName = otherUser?.name || msg.senderName || otherParty;

        conversations.set(otherParty, {
          participantEmail: otherParty,
          participantName: otherName,
          messages: [],
          lastMessage: msg.message,
          lastMessageTime: msg.createdAt,
          unreadCount: 0,
          bookingId: msg.bookingId,
          propertyId: msg.propertyId,
        });
      }

      const conv = conversations.get(otherParty);
      conv.messages.push(msg);
      
      // Count unread messages from the other party
      if (msg.recipientEmail === session.user.email && !msg.read) {
        conv.unreadCount++;
      }
    }

    return NextResponse.json({
      conversations: Array.from(conversations.values()),
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipientEmail, subject, message, bookingId, propertyId } = await req.json();

    if (!recipientEmail || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('smartstay');

    // Get sender details
    const sender = await db.collection('users').findOne({ email: session.user.email });
    if (!sender) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Store the message in the database
    const messageDoc = {
      senderEmail: session.user.email,
      senderName: sender.name || session.user.name || 'Host',
      recipientEmail,
      subject,
      message,
      bookingId: bookingId || null,
      propertyId: propertyId || null,
      createdAt: new Date(),
      read: false,
      type: 'host_to_guest',
    };

    await db.collection('messages').insertOne(messageDoc);

    // Create notification for the guest
    const notification = {
      recipientEmail,
      type: 'new_message',
      message: `${sender.name || 'Host'} sent you a message`,
      actionUrl: `/guest/messages`,
      createdAt: new Date(),
      read: false,
      metadata: {
        senderName: sender.name || session.user.name,
        subject,
        preview: message.substring(0, 100),
      },
    };

    await db.collection('notifications').insertOne(notification);

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully' 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
