import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import Productivity from '../../../models/Productivity';
import { connectToDatabase } from '../../../lib/mongodb';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const data = await req.json();

    // Normalize the date to start of day to prevent duplicate entries
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    const productivity = await Productivity.create({
      ...data,
      date,
      userId: session.user.id,
    });

    return NextResponse.json(productivity, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating productivity entry:', error);

    // Handle duplicate key error
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: 'Productivity entry for this date already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error creating productivity entry' },
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const query: { userId: string; date?: { $gte?: Date; $lte?: Date } } = {
      userId: session.user.id,
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const productivityEntries = await Productivity.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Productivity.countDocuments(query);

    return NextResponse.json({
      data: productivityEntries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching productivity entries:', error);
    return NextResponse.json(
      { error: 'Error fetching productivity entries' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const productivity = await Productivity.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      data,
      { new: true }
    );

    if (!productivity) {
      return NextResponse.json(
        { error: 'Productivity entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(productivity);
  } catch (error) {
    console.error('Error updating productivity entry:', error);
    return NextResponse.json(
      { error: 'Error updating productivity entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const productivity = await Productivity.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!productivity) {
      return NextResponse.json(
        { error: 'Productivity entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Productivity entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting productivity entry:', error);
    return NextResponse.json(
      { error: 'Error deleting productivity entry' },
      { status: 500 }
    );
  }
}
