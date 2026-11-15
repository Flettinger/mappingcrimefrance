import { ImageResponse } from "next/og";

export const size = { width: 96, height: 96 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#142449", borderRadius: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, background: "#ffffff", borderRadius: "50% 50% 50% 0", transform: "translateY(-6px) rotate(-45deg)" }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#3068dd" }} />
      </div>
    </div>,
    size,
  );
}
