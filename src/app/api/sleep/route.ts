import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import Sleep from '../../../models/Sleep';
import { connectToDatabase } from '../../../lib/mongodb';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const data = await req.json();

    const sleep = await Sleep.create({
      ...data,
      userId: session.user.id,
    });

    return NextResponse.json(sleep, { status: 201 });
  } catch (error) {
    console.error('Error creating sleep entry:', error);
    return NextResponse.json(
      { error: 'Error creating sleep entry' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    const sleepEntries = await Sleep.find({ userId: session.user.id })
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Sleep.countDocuments({ userId: session.user.id });

    return NextResponse.json({
      data: sleepEntries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching sleep entries:', error);
    return NextResponse.json(
      { error: 'Error fetching sleep entries' },
      { status: 500 }
    );
  }
}
