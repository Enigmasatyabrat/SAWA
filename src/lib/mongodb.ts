/**
 * MongoDB Connection Module
 * Reusable async connection for all API routes.
 *
 * The client is cached on `globalThis` (not a plain module variable) so the
 * connection survives Next.js dev hot-reloads and is reused across serverless
 * invocations, instead of opening a new pool on every request. This is the
 * recommended pattern for the MongoDB driver in Next.js.
 */

import { MongoClient, type Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

const globalForMongo = globalThis as unknown as {
  _mongoClient?: MongoClient;
};

/**
 * Connect to MongoDB and cache the client.
 * Reuses the connection on subsequent calls (production best practice).
 */
export async function connectToDatabase(): Promise<MongoClient> {
  if (globalForMongo._mongoClient) {
    console.log('✅ Using cached MongoDB connection');
    return globalForMongo._mongoClient;
  }

  console.log('🔗 Connecting to MongoDB Atlas...');
  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();
    console.log('✅ MongoDB connected successfully');
    globalForMongo._mongoClient = client;
    return client;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

/**
 * Get the sawa_db database.
 * Always call after connectToDatabase().
 */
export async function getDatabase(): Promise<Db> {
  const client = await connectToDatabase();
  return client.db('sawa_db');
}
