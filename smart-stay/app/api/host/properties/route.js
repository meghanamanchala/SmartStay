
import { ObjectId } from 'mongodb';

export async function DELETE(req) {
  const client = await clientPromise;
  const db = client.db();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing property id' }, { status: 400 });
  }
  try {
    const result = await db.collection('properties').deleteOne({ _id: new ObjectId(id), host: session.user.id });
    if (result.deletedCount === 0) {
      // Check if property exists at all
      const exists = await db.collection('properties').findOne({ _id: new ObjectId(id) });
      if (exists) {
        return NextResponse.json({ error: 'You are not authorized to delete this property.' }, { status: 403 });
      } else {
        return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  const client = await clientPromise;
  const db = client.db();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  try {
    const property = {
      ...data,
      host: session.user.id,
      createdAt: new Date(),
    };
    const result = await db.collection('properties').insertOne(property);
    return NextResponse.json({ ...property, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  const client = await clientPromise;
  const db = client.db();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Only return properties for the current user
  const properties = await db.collection('properties').find({ host: session.user.id }).toArray();
  return NextResponse.json(properties);
}
