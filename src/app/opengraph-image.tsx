import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Mapping Crime France, carte citoyenne des crimes et délits";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 30, width: "100%", height: "100%", background: "#142449", color: "white", padding: 90 }}>
      <div style={{ fontSize: 76, fontWeight: 700 }}>Mapping Crime France</div>
      <div style={{ fontSize: 38, color: "#c5dcff" }}>Carte citoyenne des crimes et délits en France</div>
    </div>,
    size,
  );
}
