import { ImageResponse } from "next/og";

export const alt = "SAWA, Soil Analysis Web App: a soil photo turned into colour, soil type and crop suggestions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Palette mirrors globals.css (bg, ink, forest, soil tones).
const SWATCHES = ["#5a3d24", "#7a5230", "#9c6b3e", "#b98a5a", "#d4b48c"];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#f6f2e7",
          color: "#1f2a1c",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: "#2f4b33", fontWeight: 700 }}>
          <div style={{ width: 22, height: 22, borderRadius: 999, background: "#2f4b33" }} />
          SAWA
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, fontWeight: 700, maxWidth: 900 }}>
            Read your soil from a single photo.
          </div>
          <div style={{ fontSize: 30, color: "#5b6b54", maxWidth: 880 }}>
            Colour, soil type and crop suggestions in seconds. Estimates, not a lab test.
          </div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {SWATCHES.map((c) => (
            <div key={c} style={{ width: 120, height: 56, borderRadius: 14, background: c }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
