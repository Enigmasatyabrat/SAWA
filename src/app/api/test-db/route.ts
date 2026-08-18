/**
 * GET /api/test-db
 * Tests MongoDB connection and returns database status.
 * Used for verification during setup.
 */

import { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

// Force runtime execution so the DB connection is tested on each request
// rather than being prerendered/cached at build time.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDatabase();

    // List collections to verify the database is accessible.
    const collections = await db.listCollections().toArray();

    return NextResponse.json({
      status: '✅ MongoDB connected',
      database: 'sawa_db',
      collectionsCount: collections.length,
      collections: collections.map((c) => c.name),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('MongoDB test failed:', error);
    return NextResponse.json(
      {
        status: '❌ MongoDB connection failed',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
