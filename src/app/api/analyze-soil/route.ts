/**
 * POST /api/analyze-soil
 * Main API endpoint for soil analysis.
 *
 * Input:  multipart/form-data with an image under the `file` field.
 * Output: soil type, dominant colours + percentages, nutrients, recommended crops.
 *
 * Pipeline (K-Means -> classification -> nutrient heuristic -> crop matching) is
 * imported from `@/lib/soil-engine`, which is a verified faithful port of Plan A's
 * `backend/server.py`. Nothing here is a placeholder — the engine is the single
 * source of truth shared with the client analyzer, so API and UI cannot drift.
 *
 * Fidelity note: the image is resized to 150x150 with `fit: 'fill'` to match
 * Plan A's `image.resize((150, 150))` (PIL stretches, it does not crop).
 */

import { getDatabase } from '@/lib/mongodb';
import {
  kmeans,
  classifySoilType,
  predictNutrients,
  recommendCrops,
  type RGB,
} from '@/lib/soil-engine';
import { NextRequest, NextResponse } from 'next/server';
import sharp, { type OutputInfo } from 'sharp';

// sharp is a native module, so this handler must run on the Node.js runtime,
// and must execute per-request rather than being prerendered.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Matches Plan A's `image.resize((150, 150))`. */
const SAMPLE_SIZE = 150;
/** Guard against unbounded memory use from very large uploads. */
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Analyzing soil image...');

    // A malformed / non-multipart body is a client error, so parse defensively:
    // `formData()` throws on a bad Content-Type and would otherwise surface as a 500.
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data with an image under the "file" field' },
        { status: 400 }
      );
    }

    const imageFile = formData.get('file');

    if (!imageFile || typeof imageFile === 'string') {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Plan A parity: reject non-images up front.
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    if (imageFile.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `Image exceeds the ${MAX_FILE_BYTES / (1024 * 1024)}MB limit` },
        { status: 413 }
      );
    }

    console.log(`📸 Processing image: ${imageFile.name} (${imageFile.size} bytes)`);

    // Decode -> honour EXIF orientation -> drop alpha so raw output is strictly RGB.
    const buffer = Buffer.from(await imageFile.arrayBuffer());

    // An undecodable upload is bad input, not a server fault — report it as 400.
    let data: Buffer;
    let info: OutputInfo;
    try {
      ({ data, info } = await sharp(buffer)
        .rotate()
        .removeAlpha()
        .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: 'fill' })
        .raw()
        .toBuffer({ resolveWithObject: true }));
    } catch (decodeError) {
      console.warn('⚠️  Undecodable image upload:', decodeError);
      return NextResponse.json(
        { error: 'Image could not be decoded — the file may be corrupt or an unsupported format' },
        { status: 400 }
      );
    }

    if (info.channels !== 3) {
      throw new Error(`Expected 3 raw channels after removeAlpha, got ${info.channels}`);
    }

    const pixels: RGB[] = [];
    for (let i = 0; i < data.length; i += 3) {
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }

    console.log(`🎨 Extracted ${pixels.length} pixels`);

    // --- Real Plan A pipeline (see src/lib/soil-engine.ts) ---
    // kmeans returns clusters already sorted by descending share, so
    // `percentages` are the true cluster shares, not an even split.
    const { colors: dominantColors, percentages } = kmeans(pixels, 5, 10);
    const soilType = classifySoilType(dominantColors);
    const nutrients = predictNutrients(dominantColors, soilType);
    const crops = recommendCrops(nutrients);

    console.log(`✅ Analysis complete: ${soilType}`);

    // Persist the analysis. A storage failure must not lose the user's result,
    // so it is reported alongside the analysis rather than failing the request.
    let persisted: string | null = null;
    let storageError: string | null = null;
    try {
      const db = await getDatabase();
      const result = await db.collection('analyses').insertOne({
        timestamp: new Date(),
        soilType,
        dominantColors,
        colorPercentages: percentages,
        nutrients,
        crops,
        fileName: imageFile.name,
        fileSize: imageFile.size,
        contentType: imageFile.type,
      });
      persisted = result.insertedId.toString();
      console.log(`💾 Saved to MongoDB with ID: ${persisted}`);
    } catch (dbError) {
      storageError = dbError instanceof Error ? dbError.message : String(dbError);
      console.error('⚠️  Analysis succeeded but persistence failed:', storageError);
    }

    return NextResponse.json({
      soil_type: soilType,
      dominant_colors: dominantColors,
      color_percentages: percentages,
      nutrients,
      recommended_crops: crops,
      analysis_id: persisted,
      ...(storageError ? { storage_warning: storageError } : {}),
    });
  } catch (error) {
    console.error('❌ Analysis error:', error);
    return NextResponse.json(
      {
        error: 'Soil analysis failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
