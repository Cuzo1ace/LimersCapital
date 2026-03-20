import { useState } from "react";

const STATUS = {
  DEDICATED: {
    label: "Dedicated Crypto Law",
    color: "#00E5A0",
    glow: "0 0 18px #00E5A088",
    bg: "#00E5A022",
    border: "#00E5A0",
    desc: "Country has enacted specific dedicated legislation governing digital assets and virtual currencies.",
  },
  ECCU: {
    label: "ECCU Regional Framework",
    color: "#38BDF8",
    glow: "0 0 18px #38BDF888",
    bg: "#38BDF822",
    border: "#38BDF8",
    desc: "Part of the Eastern Caribbean Currency Union's harmonized Virtual Asset Business Bill.",
  },
  PARTIAL: {
    label: "CBDC / Partial Framework",
    color: "#FACC15",
    glow: "0 0 18px #FACC1588",
    bg: "#FACC1522",
    border: "#FACC15",
    desc: "Has launched a Central Bank Digital Currency or adopted partial crypto regulations.",
  },
  PERMITTED: {
    label: "Permitted, No Specific Law",
    color: "#FB923C",
    glow: "0 0 18px #FB923C88",
    bg: "#FB923C22",
    border: "#FB923C",
    desc: "Crypto is allowed but no dedicated regulatory framework exists. General financial laws may apply.",
  },
  NONE: {
    label: "No Framework",
    color: "#94A3B8",
    glow: "0 0 10px #94A3B844",
    bg: "#94A3B811",
    border: "#94A3B8",
    desc: "No specific crypto regulation. Usage is largely unaddressed by law.",
  },
};

const COUNTRIES = [
  {
    id: "cuba",
    name: "Cuba",
    status: "PARTIAL",
    x: 195,
    y: 162,
    r: 22,
    law: "Central Bank Resolution No. 215 (2021)",
    details:
      "Cuba acknowledged crypto as a means of payment in 2021. The Central Bank licenses Virtual Asset Service Providers (VASPs), making it one of the earliest Caribbean adopters of formal VASP licensing.",
    flag: "🇨🇺",
  },
  {
    id: "bahamas",
    name: "Bahamas",
    status: "DEDICATED",
    x: 290,
    y: 90,
    r: 16,
    law: "Digital Assets and Registered Exchanges Act (DARE Act)",
    details:
      "The Bahamas passed the DARE Act providing a comprehensive licensing regime for digital asset businesses. It also launched the Sand Dollar, the world's first fully deployed central bank digital currency.",
    flag: "🇧🇸",
  },
  {
    id: "cayman",
    name: "Cayman Islands",
    status: "DEDICATED",
    x: 118,
    y: 248,
    r: 13,
    law: "Virtual Asset (Service Providers) Act — fully operational April 2025",
    details:
      "The Cayman Islands updated its VASP Act with a fully operational licensing regime from April 2025. Combined with zero capital gains and income tax, it is one of the most crypto-friendly jurisdictions globally.",
    flag: "🇰🇾",
  },
  {
    id: "jamaica",
    name: "Jamaica",
    status: "PARTIAL",
    x: 258,
    y: 290,
    r: 15,
    law: "Bank of Jamaica Act (JamDex CBDC)",
    details:
      "Jamaica launched JamDex, its CBDC, under the Bank of Jamaica Act. While the country has been cautious about private cryptocurrencies, the CBDC provides a regulated digital currency option.",
    flag: "🇯🇲",
  },
  {
    id: "haiti",
    name: "Haiti",
    status: "NONE",
    x: 402,
    y: 248,
    r: 13,
    law: "None",
    details:
      "Haiti has no specific cryptocurrency legislation. The country's regulatory capacity remains limited and crypto operates in a legal grey area.",
    flag: "🇭🇹",
  },
  {
    id: "dr",
    name: "Dominican Republic",
    status: "PERMITTED",
    x: 460,
    y: 248,
    r: 15,
    law: "No specific law — Central Bank caution advisory",
    details:
      "The Dominican Republic permits crypto but does not regulate it. The Central Bank has issued warnings that digital assets are not legal tender and advised financial institutions to proceed cautiously.",
    flag: "🇩🇴",
  },
  {
    id: "pr",
    name: "Puerto Rico",
    status: "PERMITTED",
    x: 570,
    y: 265,
    r: 12,
    law: "US federal framework applies",
    details:
      "As a US territory, Puerto Rico falls under US federal crypto regulations. It has also introduced its own tax incentives attracting crypto businesses under Acts 20 and 22.",
    flag: "🇵🇷",
  },
  {
    id: "anguilla",
    name: "Anguilla",
    status: "DEDICATED",
    x: 715,
    y: 200,
    r: 10,
    law: "Digital Assets Business Act + AUTO Act",
    details:
      "Anguilla has both the Digital Assets Business Act and the Anguilla Utility Token Offering (AUTO) Act for ICO regulation. It pioneered a framework for non-security token offerings with a 1.5% levy on token raises.",
    flag: "🇦🇮",
  },
  {
    id: "skn",
    name: "St. Kitts & Nevis",
    status: "ECCU",
    x: 740,
    y: 222,
    r: 10,
    law: "Virtual Asset Business Act (ECCU)",
    details:
      "St. Kitts & Nevis passed the ECCU's Virtual Asset Business Bill, creating a harmonized regional framework. The country also accepts crypto as proof of funds for its citizenship-by-investment program.",
    flag: "🇰🇳",
  },
  {
    id: "montserrat",
    name: "Montserrat",
    status: "ECCU",
    x: 758,
    y: 247,
    r: 9,
    law: "Virtual Asset Business Act (ECCU)",
    details:
      "Montserrat is one of seven ECCU member states that passed the Virtual Asset Business Bill, adopting a harmonized regional approach to digital asset regulation.",
    flag: "🇲🇸",
  },
  {
    id: "antigua",
    name: "Antigua & Barbuda",
    status: "DEDICATED",
    x: 766,
    y: 268,
    r: 11,
    law: "Digital Financial Assets Act 2020 + ECCU VABA",
    details:
      "Antigua & Barbuda enacted its own Digital Financial Assets Act in 2020, providing a dedicated crypto framework. It is also an ECCU member that passed the regional Virtual Asset Business Bill and has been home to major crypto exchanges.",
    flag: "🇦🇬",
  },
  {
    id: "dominica",
    name: "Dominica",
    status: "ECCU",
    x: 776,
    y: 295,
    r: 10,
    law: "Virtual Asset Business Act (ECCU)",
    details:
      "Dominica passed the ECCU Virtual Asset Business Bill as part of the harmonized Eastern Caribbean regulatory framework for digital assets.",
    flag: "🇩🇲",
  },
  {
    id: "stlucia",
    name: "St. Lucia",
    status: "ECCU",
    x: 788,
    y: 320,
    r: 10,
    law: "Virtual Asset Business Act (ECCU) + General Financial Laws",
    details:
      "St. Lucia is an ECCU member that passed the Virtual Asset Business Bill. Crypto exchanges and service providers also fall under general financial sector laws.",
    flag: "🇱🇨",
  },
  {
    id: "svg",
    name: "St. Vincent & Grenadines",
    status: "ECCU",
    x: 778,
    y: 348,
    r: 10,
    law: "Virtual Asset Business Act (ECCU)",
    details:
      "St. Vincent & the Grenadines is one of seven ECCU countries that adopted the Virtual Asset Business Bill, creating a regionally harmonized legal framework for digital assets.",
    flag: "🇻🇨",
  },
  {
    id: "barbados",
    name: "Barbados",
    status: "PERMITTED",
    x: 820,
    y: 368,
    r: 10,
    law: "General financial laws only",
    details:
      "Barbados applies general financial laws to crypto, particularly around exchanges and service providers. There is no dedicated crypto legislation, though Barbados is home to Bitt Inc., a key fintech player.",
    flag: "🇧🇧",
  },
  {
    id: "grenada",
    name: "Grenada",
    status: "ECCU",
    x: 775,
    y: 378,
    r: 10,
    law: "Virtual Asset Business Act (ECCU)",
    details:
      "Grenada passed the ECCU Virtual Asset Business Bill, adopting the harmonized regional framework for regulating virtual asset businesses across the Eastern Caribbean.",
    flag: "🇬🇩",
  },
  {
    id: "tt",
    name: "Trinidad & Tobago",
    status: "PERMITTED",
    x: 790,
    y: 430,
    r: 12,
    law: "No specific law — regulatory caution advisory",
    details:
      "Trinidad & Tobago does not prohibit cryptocurrency but has issued caution warnings about volatility and scams. No dedicated legal framework has been enacted as of 2025.",
    flag: "🇹🇹",
  },
];

// Simple ocean polygon for Caribbean sea background shape
function OceanPath() {
  return (
    <rect x="0" y="0" width="950" height="520" fill="transparent" />
  );
}

export default function CaribbeanCryptoMap() {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);

  const activeCountry = selected
    ? COUNTRIES.find((c) => c.id === selected)
    : hovered
    ? COUNTRIES.find((c) => c.id === hovered)
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #020818 0%, #041529 50%, #050d1f 100%)",
        fontFamily: "'Georgia', 'Palatino', serif",
        color: "#E2E8F0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse 80% 50% at 50% 30%, #0a2a4a33 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "-20%", right: "-10%",
        width: 500, height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, #00E5A006 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28, zIndex: 1 }}>
        <p style={{ 
          letterSpacing: "0.35em", fontSize: 11, 
          color: "#00E5A0", textTransform: "uppercase",
          marginBottom: 10, fontFamily: "'Courier New', monospace",
        }}>
          Digital Asset Regulation Intelligence
        </p>
        <h1 style={{
          fontSize: "clamp(24px, 4vw, 42px)",
          fontWeight: 700,
          margin: 0,
          background: "linear-gradient(90deg, #E2E8F0 0%, #00E5A0 60%, #38BDF8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}>
          Caribbean Crypto<br />Regulation Map
        </h1>
        <p style={{ 
          color: "#64748B", fontSize: 13, marginTop: 10,
          fontFamily: "'Courier New', monospace", letterSpacing: "0.05em",
        }}>
          Legal framework status across 17 jurisdictions — 2025
        </p>
      </div>

      {/* Main content */}
      <div style={{
        display: "flex",
        gap: 24,
        width: "100%",
        maxWidth: 1200,
        zIndex: 1,
        flexWrap: "wrap",
        justifyContent: "center",
      }}>
        {/* Map */}
        <div style={{
          flex: "1 1 600px",
          background: "linear-gradient(180deg, #0a1f3d 0%, #061428 100%)",
          borderRadius: 20,
          border: "1px solid #0f2d50",
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 0 60px #00E5A008, 0 20px 60px #00000060",
        }}>
          {/* Ocean grid lines */}
          <svg width="100%" viewBox="0 0 950 520" style={{ display: "block" }}>
            <defs>
              <radialGradient id="oceanGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0ea5e920" />
                <stop offset="100%" stopColor="#020c1a" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="strongGlow">
                <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0d2540" strokeWidth="0.5" />
              </pattern>
            </defs>

            {/* Ocean base */}
            <rect width="950" height="520" fill="#040f1e" />
            <rect width="950" height="520" fill="url(#oceanGlow)" />
            <rect width="950" height="520" fill="url(#grid)" opacity="0.6" />

            {/* Subtle latitude lines */}
            {[100, 160, 220, 280, 340, 400, 460].map((y) => (
              <line key={y} x1="0" y1={y} x2="950" y2={y}
                stroke="#0a2540" strokeWidth="0.8" strokeDasharray="4 8" />
            ))}
            {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="520"
                stroke="#0a2540" strokeWidth="0.8" strokeDasharray="4 8" />
            ))}

            {/* Florida peninsula hint */}
            <path d="M 80 0 Q 90 40 75 90 Q 65 130 80 160 Q 95 180 85 200"
              fill="none" stroke="#1a3a5c" strokeWidth="1.5" opacity="0.5" />
            <text x="30" y="70" fill="#1e3a5f" fontSize="11" fontFamily="monospace">FLORIDA</text>

            {/* Central America hint */}
            <path d="M 0 230 Q 30 240 50 260 Q 70 290 60 320 Q 50 350 40 380 Q 30 410 20 450"
              fill="none" stroke="#1a3a5c" strokeWidth="1.5" opacity="0.5" />

            {/* Venezuela/Colombia coast */}
            <path d="M 400 520 Q 500 500 600 510 Q 700 515 800 505 Q 870 500 950 490"
              fill="none" stroke="#1a3a5c" strokeWidth="1.5" opacity="0.5" />

            {/* Compass rose */}
            <g transform="translate(60, 450)">
              <circle cx="0" cy="0" r="22" fill="#040f1e" stroke="#0d2540" strokeWidth="1" />
              <text x="0" y="-27" textAnchor="middle" fill="#00E5A060" fontSize="9" fontFamily="monospace">N</text>
              <line x1="0" y1="-20" x2="0" y2="-10" stroke="#00E5A060" strokeWidth="1.5" />
              <line x1="0" y1="10" x2="0" y2="20" stroke="#64748B60" strokeWidth="1" />
              <line x1="-20" y1="0" x2="-10" y2="0" stroke="#64748B60" strokeWidth="1" />
              <line x1="10" y1="0" x2="20" y2="0" stroke="#64748B60" strokeWidth="1" />
              <circle cx="0" cy="0" r="2" fill="#00E5A080" />
            </g>

            {/* Scale */}
            <g transform="translate(800, 490)">
              <line x1="0" y1="0" x2="80" y2="0" stroke="#1e3a5f" strokeWidth="1.5" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#1e3a5f" strokeWidth="1.5" />
              <line x1="80" y1="-4" x2="80" y2="4" stroke="#1e3a5f" strokeWidth="1.5" />
              <text x="40" y="-8" textAnchor="middle" fill="#1e3a5f" fontSize="8" fontFamily="monospace">~800 km</text>
            </g>

            {/* Connection lines for Lesser Antilles chain */}
            {[
              ["anguilla", "skn"],
              ["skn", "montserrat"],
              ["montserrat", "antigua"],
              ["antigua", "dominica"],
              ["dominica", "stlucia"],
              ["stlucia", "svg"],
              ["svg", "grenada"],
              ["grenada", "tt"],
            ].map(([a, b]) => {
              const ca = COUNTRIES.find((c) => c.id === a);
              const cb = COUNTRIES.find((c) => c.id === b);
              return (
                <line
                  key={`${a}-${b}`}
                  x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y}
                  stroke="#0d2540" strokeWidth="1" strokeDasharray="3 4"
                  opacity="0.7"
                />
              );
            })}

            {/* Country nodes */}
            {COUNTRIES.map((country) => {
              const s = STATUS[country.status];
              const isActive = hovered === country.id || selected === country.id;
              return (
                <g
                  key={country.id}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setSelected(selected === country.id ? null : country.id)
                  }
                  onMouseEnter={() => setHovered(country.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Pulse ring */}
                  {isActive && (
                    <circle
                      cx={country.x}
                      cy={country.y}
                      r={country.r + 10}
                      fill="none"
                      stroke={s.color}
                      strokeWidth="1.5"
                      opacity="0.4"
                    />
                  )}
                  {/* Outer glow ring */}
                  <circle
                    cx={country.x}
                    cy={country.y}
                    r={country.r + 4}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="0.8"
                    opacity={isActive ? 0.6 : 0.2}
                  />
                  {/* Main dot */}
                  <circle
                    cx={country.x}
                    cy={country.y}
                    r={country.r}
                    fill={isActive ? s.color + "cc" : s.color + "55"}
                    stroke={s.color}
                    strokeWidth={isActive ? 2 : 1.5}
                    filter={isActive ? "url(#strongGlow)" : "url(#glow)"}
                  />
                  {/* Inner highlight */}
                  <circle
                    cx={country.x - country.r * 0.25}
                    cy={country.y - country.r * 0.25}
                    r={country.r * 0.3}
                    fill="white"
                    opacity={isActive ? 0.3 : 0.1}
                  />
                  {/* Label */}
                  <text
                    x={country.x}
                    y={country.y + country.r + 13}
                    textAnchor="middle"
                    fill={isActive ? s.color : "#94A3B8"}
                    fontSize={country.r > 14 ? 10 : 8.5}
                    fontFamily="'Courier New', monospace"
                    fontWeight={isActive ? "bold" : "normal"}
                    style={{ transition: "fill 0.2s" }}
                  >
                    {country.name}
                  </text>
                </g>
              );
            })}

            {/* Region labels */}
            <text x="200" y="30" fill="#0d2540" fontSize="12" fontFamily="monospace" letterSpacing="3">GULF OF MEXICO</text>
            <text x="350" y="180" fill="#0c2038" fontSize="10" fontFamily="monospace" letterSpacing="2">CARIBBEAN SEA</text>
            <text x="620" y="120" fill="#0c2038" fontSize="10" fontFamily="monospace" letterSpacing="2">ATLANTIC OCEAN</text>
            <text x="840" y="280" fill="#0c2038" fontSize="9" fontFamily="monospace" letterSpacing="1" textAnchor="middle"
              transform="rotate(90 840 280)">LESSER ANTILLES</text>
          </svg>
        </div>

        {/* Right panel */}
        <div style={{
          flex: "0 1 300px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          minWidth: 260,
        }}>
          {/* Legend */}
          <div style={{
            background: "#040f1e",
            border: "1px solid #0f2d50",
            borderRadius: 16,
            padding: "20px",
            boxShadow: "0 4px 24px #00000040",
          }}>
            <p style={{ 
              fontFamily: "'Courier New', monospace",
              fontSize: 10, letterSpacing: "0.3em",
              color: "#38BDF8", textTransform: "uppercase",
              marginBottom: 16,
            }}>
              ▸ Regulatory Status
            </p>
            {Object.entries(STATUS).map(([key, s]) => (
              <div key={key} style={{ 
                display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14,
              }}>
                <div style={{
                  width: 12, height: 12, borderRadius: "50%",
                  background: s.color,
                  boxShadow: s.glow,
                  flexShrink: 0,
                  marginTop: 2,
                }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.color, marginBottom: 2 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.5, fontFamily: "sans-serif" }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Country detail card */}
          <div style={{
            background: "#040f1e",
            border: `1px solid ${activeCountry ? STATUS[activeCountry.status].border + "60" : "#0f2d50"}`,
            borderRadius: 16,
            padding: "20px",
            minHeight: 180,
            transition: "border-color 0.3s",
            boxShadow: activeCountry
              ? `0 0 30px ${STATUS[activeCountry.status].color}18`
              : "0 4px 24px #00000040",
          }}>
            {activeCountry ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 28 }}>{activeCountry.flag}</span>
                  <div>
                    <div style={{ 
                      fontWeight: 700, fontSize: 16,
                      color: STATUS[activeCountry.status].color,
                    }}>
                      {activeCountry.name}
                    </div>
                    <div style={{ 
                      fontSize: 10, fontFamily: "'Courier New', monospace",
                      color: STATUS[activeCountry.status].color + "aa",
                      letterSpacing: "0.2em",
                    }}>
                      {STATUS[activeCountry.status].label}
                    </div>
                  </div>
                </div>
                <div style={{
                  background: STATUS[activeCountry.status].bg,
                  border: `1px solid ${STATUS[activeCountry.status].border}33`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginBottom: 12,
                }}>
                  <span style={{ 
                    fontSize: 9, fontFamily: "monospace", 
                    color: STATUS[activeCountry.status].color + "bb",
                    letterSpacing: "0.15em",
                    display: "block", marginBottom: 4,
                  }}>KEY LEGISLATION</span>
                  <span style={{ fontSize: 11, color: "#CBD5E1", fontFamily: "sans-serif" }}>
                    {activeCountry.law}
                  </span>
                </div>
                <p style={{ 
                  fontSize: 12, color: "#94A3B8", lineHeight: 1.7, 
                  fontFamily: "sans-serif", margin: 0,
                }}>
                  {activeCountry.details}
                </p>
              </>
            ) : (
              <div style={{ 
                display: "flex", flexDirection: "column", 
                alignItems: "center", justifyContent: "center",
                height: "100%", minHeight: 160, gap: 10,
              }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: "50%",
                  border: "1px dashed #0d2540",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 18, opacity: 0.4 }}>🗺</span>
                </div>
                <p style={{ 
                  color: "#1e3a5f", fontSize: 12, textAlign: "center",
                  fontFamily: "monospace", letterSpacing: "0.1em", margin: 0,
                }}>
                  Hover or click a country<br />to explore its framework
                </p>
              </div>
            )}
          </div>

          {/* Stats summary */}
          <div style={{
            background: "#040f1e",
            border: "1px solid #0f2d50",
            borderRadius: 16,
            padding: "16px 20px",
            boxShadow: "0 4px 24px #00000040",
          }}>
            <p style={{ 
              fontFamily: "'Courier New', monospace", fontSize: 10,
              letterSpacing: "0.3em", color: "#38BDF8",
              textTransform: "uppercase", marginBottom: 12,
            }}>▸ Quick Stats</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Dedicated Law", count: COUNTRIES.filter(c=>c.status==="DEDICATED").length, color: "#00E5A0" },
                { label: "ECCU Framework", count: COUNTRIES.filter(c=>c.status==="ECCU").length, color: "#38BDF8" },
                { label: "CBDC/Partial", count: COUNTRIES.filter(c=>c.status==="PARTIAL").length, color: "#FACC15" },
                { label: "Permitted", count: COUNTRIES.filter(c=>c.status==="PERMITTED").length, color: "#FB923C" },
              ].map((stat) => (
                <div key={stat.label} style={{
                  background: stat.color + "10",
                  border: `1px solid ${stat.color}30`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                    {stat.count}
                  </div>
                  <div style={{ fontSize: 9, color: "#475569", marginTop: 4, fontFamily: "monospace", letterSpacing: "0.1em" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p style={{
        marginTop: 24, fontSize: 10, color: "#1e3a5f",
        fontFamily: "monospace", letterSpacing: "0.2em",
        zIndex: 1,
      }}>
        Sources: ECCB · Atlantic Council · CoinTelegraph · Bolder Group · 2025
      </p>
    </div>
  );
}
