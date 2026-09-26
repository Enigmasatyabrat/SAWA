/**
 * MongoDB Connection Module
 * Reusable async connection for all API routes.
 *
 * The client is cached on `globalThis` (not a plain module variable) so the
 * connection survives Next.js dev hot-reloads and is reused across serverless
 * invocations, instead of opening a new pool on every request. This is the
 * recommended pattern for the MongoDB driver in Next.js.
 *
 * MONGODB_URI is read when a connection is first needed, not at import time.
 * `next build` imports every route to collect page data, so an import-time
 * check made the build itself fail wherever the secret is only provided at
 * runtime (CI, most hosts).
 */

import { MongoClient, type Db } from 'mongodb';

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

/**
 * Connect to MongoDB and cache the client.
 * Reuses the connection on subsequent calls (production best practice).
 *
 * The pending promise is cached, not the resolved client, so requests that
 * arrive while the first connection is still opening share it instead of
 * each opening (and leaking) a pool of their own.
 */
export async function connectToDatabase(): Promise<MongoClient> {
  if (globalForMongo._mongoClientPromise) {
    return globalForMongo._mongoClientPromise;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  console.log('🔗 Connecting to MongoDB Atlas...');
  const pending = new MongoClient(uri).connect();
  globalForMongo._mongoClientPromise = pending;

  try {
    const client = await pending;
    console.log('✅ MongoDB connected successfully');
    return client;
  } catch (error) {
    // Forget the failed attempt so the next request can retry.
    globalForMongo._mongoClientPromise = undefined;
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
