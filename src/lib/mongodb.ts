import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

// Force the URI to use the activetime database
// This handles all URI formats including mongodb+srv://
const MONGODB_URI_WITH_DB = MONGODB_URI.replace(
  /(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/[^?]*)?(\?.*)?$/,
  '$1/activetime$2'
);

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env'
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}
// Declare mongoose on global namespace to fix TypeScript errors
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: 'activetime', // Force database name
    };

    cached.promise = mongoose
      .connect(MONGODB_URI_WITH_DB, opts)
      .then((mongoose) => {
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
