/**
 * API Client Bridge
 * Handles all communication between frontend and backend.
 * Separates API concerns from React components.
 */

import type { RGB, Nutrients, SoilType } from "@/lib/soil-engine";

/** Wire shape returned by POST /api/analyze-soil (snake_case, see API.md). */
export type AnalysisResponse = {
  soil_type: SoilType;
  dominant_colors: RGB[];
  color_percentages: number[];
  nutrients: Nutrients;
  recommended_crops: string[];
  /** `null` when the analysis succeeded but the database write did not. */
  analysis_id: string | null;
  /** Present only when persistence failed; the analysis itself is still valid. */
  storage_warning?: string;
};

/**
 * Call the backend analyze-soil API.
 *
 * @param imageFile - The soil image to analyze.
 * @returns Analysis result with soil type, colours, nutrients and crops.
 * @throws Error carrying the server's own message when the request fails.
 */
export async function analyzeSoilWithBackend(imageFile: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append("file", imageFile);

  // Default to a same-origin relative path so the app works on any deployed
  // domain; NEXT_PUBLIC_API_URL only needs setting when the API is elsewhere.
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const endpoint = `${base}/api/analyze-soil`;

  let response: Response;
  try {
    response = await fetch(endpoint, { method: "POST", body: formData });
  } catch {
    // fetch() only rejects on network-level failure.
    throw new Error("Could not reach the analysis server. Check your connection and try again.");
  }

  if (!response.ok) {
    // 4xx responses use `error`; 5xx adds `details`. Prefer the specific message
    // so the user sees "Image could not be decoded…" rather than "API error: 400".
    let message = `API error: ${response.status}`;
    try {
      const body = await response.json();
      message = body.error ?? body.details ?? message;
    } catch {
      /* non-JSON error body — keep the status-code message */
    }
    throw new Error(message);
  }

  return (await response.json()) as AnalysisResponse;
}
