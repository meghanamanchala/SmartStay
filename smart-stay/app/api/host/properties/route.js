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

export async function GET() {
  const client = await clientPromise;
  const db = client.db();
  const properties = await db.collection('properties').find().toArray();
  return NextResponse.json(properties);
}
