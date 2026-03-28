import { ImageResponse } from "next/og";

export const alt = "LastEnvelope — Encrypted Digital Legacy Vault";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0d1117 0%, #18181b 50%, #0d1117 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 25% 25%, rgba(16,185,129,0.08) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(16,185,129,0.05) 0%, transparent 50%)",
            display: "flex",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #10b981, transparent)",
            display: "flex",
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <svg width="80" height="80" viewBox="0 0 64 64" fill="none">
            <rect
              x="6"
              y="16"
              width="52"
              height="36"
              rx="5"
              fill="#0d1117"
              stroke="#10b981"
              strokeWidth="2.5"
            />
            <path
              d="M6 19 L32 40 L58 19"
              stroke="#10b981"
              strokeWidth="2.5"
              fill="none"
              strokeLinejoin="round"
            />
            <path
              d="M25 28 L32 23 L39 28 L39 39 C39 43 32 47 32 47 C32 47 25 43 25 39Z"
              fill="#10b981"
            />
            <circle cx="32" cy="33" r="2.5" fill="#0d1117" />
            <rect x="30.8" y="35" width="2.4" height="5" rx="1" fill="#0d1117" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 300,
              color: "#e5e7eb",
              letterSpacing: -1,
            }}
          >
            Last
          </span>
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#10b981",
              letterSpacing: -1,
            }}
          >
            Envelope
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 24,
            color: "#a1a1aa",
            margin: 0,
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Your encrypted digital vault with Dead Man&apos;s Switch.
          <br />
          Passwords, documents &amp; final messages — securely delivered.
        </p>

        {/* Feature badges */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 36,
          }}
        >
          {["Zero-Knowledge Encryption", "Dead Man's Switch", "Beneficiary System"].map(
            (badge) => (
              <div
                key={badge}
                style={{
                  padding: "8px 20px",
                  borderRadius: 100,
                  border: "1px solid rgba(16,185,129,0.3)",
                  backgroundColor: "rgba(16,185,129,0.08)",
                  color: "#10b981",
                  fontSize: 14,
                  fontWeight: 500,
                  display: "flex",
                }}
              >
                {badge}
              </div>
            )
          )}
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #10b981, transparent)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
