// SVG Asset Generators for Suzuki Genuine Parts & Motorcycles
// Guarantees 100% relevant, high-resolution visual representations without cars or irrelevant photos.

const encodeSvg = (svgString: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

export const MOTORCYCLE_SVGS = {
  'gixxer-150-fi': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
      <rect width="800" height="500" fill="#0f172a"/>
      <!-- Grid Lines -->
      <path d="M0 100 H800 M0 200 H800 M0 300 H800 M0 400 H800 M100 0 V500 M200 0 V500 M300 0 V500 M400 0 V500 M500 0 V500 M600 0 V500 M700 0 V500" stroke="#1e293b" stroke-width="1"/>
      
      <!-- Ground Shadow -->
      <ellipse cx="400" cy="420" rx="280" ry="20" fill="#020617" opacity="0.8"/>
      
      <!-- Wheels -->
      <g>
        <!-- Rear Wheel -->
        <circle cx="220" cy="350" r="75" fill="none" stroke="#334155" stroke-width="12"/>
        <circle cx="220" cy="350" r="62" fill="none" stroke="#64748b" stroke-width="3"/>
        <circle cx="220" cy="350" r="35" fill="#1e293b" stroke="#e2e8f0" stroke-width="2"/>
        <!-- Spokes -->
        <path d="M220 275 V425 M145 350 H295 M167 297 L273 403 M167 403 L273 297" stroke="#e60012" stroke-width="3"/>
        <!-- Rear Brake Disc -->
        <circle cx="220" cy="350" r="45" fill="none" stroke="#94a3b8" stroke-width="4" stroke-dasharray="8 4"/>

        <!-- Front Wheel -->
        <circle cx="580" cy="350" r="75" fill="none" stroke="#334155" stroke-width="12"/>
        <circle cx="580" cy="350" r="62" fill="none" stroke="#64748b" stroke-width="3"/>
        <circle cx="580" cy="350" r="35" fill="#1e293b" stroke="#e2e8f0" stroke-width="2"/>
        <!-- Spokes -->
        <path d="M580 275 V425 M505 350 H655 M527 297 L633 403 M527 403 L633 297" stroke="#e60012" stroke-width="3"/>
        <!-- Front Brake Disc -->
        <circle cx="580" cy="350" r="50" fill="none" stroke="#cbd5e1" stroke-width="6" stroke-dasharray="10 4"/>
      </g>

      <!-- Frame & Engine -->
      <path d="M220 350 L340 340 L420 360 L480 320 L580 350" fill="none" stroke="#334155" stroke-width="16" stroke-linecap="round"/>
      <!-- Engine Block -->
      <rect x="320" y="300" width="120" height="90" rx="15" fill="#1e293b" stroke="#475569" stroke-width="4"/>
      <path d="M340 320 H420 M340 340 H420 M340 360 H420" stroke="#64748b" stroke-width="3"/>
      
      <!-- Bodywork Fairing (Suzuki Blue) -->
      <path d="M260 260 L340 240 L450 210 L520 220 L550 180 L480 180 L380 200 L300 240 Z" fill="#2563eb" stroke="#1d4ed8" stroke-width="4"/>
      <!-- Tank Accent -->
      <path d="M380 200 Q 430 190 470 215 L 430 250 Z" fill="#e60012"/>
      <path d="M300 240 L380 200 L440 210 L380 260 Z" fill="#1e40af"/>

      <!-- Seat -->
      <path d="M240 260 Q 300 250 350 250 L 330 270 L 260 270 Z" fill="#0f172a" stroke="#334155" stroke-width="2"/>

      <!-- Handlebars & Front Fork -->
      <path d="M580 350 L530 190 L510 160" fill="none" stroke="#64748b" stroke-width="10" stroke-linecap="round"/>
      <circle cx="510" cy="160" r="12" fill="#e60012"/>
      
      <!-- Headlight Fairing -->
      <polygon points="530,170 570,180 550,210 520,200" fill="#2563eb" stroke="#1d4ed8" stroke-width="2"/>
      <polygon points="550,180 565,185 558,198 545,195" fill="#fef08a"/>

      <!-- Exhaust Pipe -->
      <path d="M360 370 Q 400 400 480 390 L 510 370" fill="none" stroke="#94a3b8" stroke-width="8" stroke-linecap="round"/>
      <rect x="470" y="360" width="70" height="25" rx="8" transform="rotate(-15 470 360)" fill="#334155" stroke="#cbd5e1" stroke-width="2"/>

      <!-- Suzuki Logo Branding -->
      <text x="390" y="235" font-family="sans-serif" font-weight="900" font-size="22" fill="#ffffff" font-style="italic">SUZUKI</text>
      <text x="400" y="470" font-family="sans-serif" font-weight="800" font-size="16" fill="#64748b" text-anchor="middle">GIXXER 150 FI - SPECIFICATION PROFILE</text>
    </svg>
  `),

  'gixxer-250': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
      <rect width="800" height="500" fill="#020617"/>
      <path d="M0 100 H800 M0 200 H800 M0 300 H800 M0 400 H800 M100 0 V500 M200 0 V500 M300 0 V500 M400 0 V500 M500 0 V500 M600 0 V500 M700 0 V500" stroke="#1e293b" stroke-width="1"/>
      <ellipse cx="400" cy="420" rx="290" ry="22" fill="#000000" opacity="0.9"/>
      
      <!-- Wheels -->
      <circle cx="210" cy="340" r="78" fill="none" stroke="#1e293b" stroke-width="14"/>
      <circle cx="210" cy="340" r="64" fill="none" stroke="#3b82f6" stroke-width="4"/>
      <circle cx="210" cy="340" r="30" fill="#0f172a" stroke="#94a3b8" stroke-width="3"/>
      <path d="M210 262 V418 M132 340 H288 M155 285 L265 395 M155 395 L265 285" stroke="#3b82f6" stroke-width="4"/>

      <circle cx="590" cy="340" r="78" fill="none" stroke="#1e293b" stroke-width="14"/>
      <circle cx="590" cy="340" r="64" fill="none" stroke="#3b82f6" stroke-width="4"/>
      <circle cx="590" cy="340" r="30" fill="#0f172a" stroke="#94a3b8" stroke-width="3"/>
      <path d="M590 262 V418 M512 340 H668 M535 285 L645 395 M535 395 L645 285" stroke="#3b82f6" stroke-width="4"/>

      <!-- Full Sport Fairing -->
      <path d="M230 250 L310 230 L450 190 L560 210 L600 240 L530 330 L400 350 L300 320 Z" fill="#1d4ed8" stroke="#2563eb" stroke-width="3"/>
      <path d="M380 190 L480 190 L540 260 L450 330 L370 280 Z" fill="#1e3a8a"/>
      <path d="M420 220 L520 240 L490 290 Z" fill="#e60012"/>

      <!-- Front Fork & Handlebar -->
      <path d="M590 340 L530 170 L500 150" stroke="#94a3b8" stroke-width="10" stroke-linecap="round"/>
      <polygon points="520,150 560,165 540,195 500,180" fill="#1d4ed8"/>

      <!-- Exhaust -->
      <path d="M360 360 L480 375 L520 345" stroke="#64748b" stroke-width="10" stroke-linecap="round"/>
      <rect x="480" y="335" width="80" height="30" rx="10" transform="rotate(-20 480 335)" fill="#334155" stroke="#e2e8f0" stroke-width="2"/>

      <text x="380" y="230" font-family="sans-serif" font-weight="900" font-size="24" fill="#ffffff" font-style="italic">SUZUKI</text>
      <text x="390" y="260" font-family="sans-serif" font-weight="800" font-size="14" fill="#60a5fa">GIXXER SF 250</text>
      <text x="400" y="470" font-family="sans-serif" font-weight="800" font-size="16" fill="#64748b" text-anchor="middle">GIXXER SF 250 - SPORT FAIRING PROFILE</text>
    </svg>
  `),

  'gsx-r1000': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
      <rect width="800" height="500" fill="#090d16"/>
      <path d="M0 100 H800 M0 200 H800 M0 300 H800 M0 400 H800 M100 0 V500 M200 0 V500 M300 0 V500 M400 0 V500 M500 0 V500 M600 0 V500 M700 0 V500" stroke="#1e293b" stroke-width="1"/>
      <ellipse cx="400" cy="425" rx="300" ry="20" fill="#000000"/>

      <!-- Wheels & Brembo Brakes -->
      <circle cx="200" cy="340" r="80" fill="none" stroke="#0f172a" stroke-width="16"/>
      <circle cx="200" cy="340" r="66" fill="none" stroke="#2563eb" stroke-width="4"/>
      <circle cx="200" cy="340" r="50" fill="none" stroke="#e60012" stroke-width="3" stroke-dasharray="6 3"/>

      <circle cx="600" cy="340" r="80" fill="none" stroke="#0f172a" stroke-width="16"/>
      <circle cx="600" cy="340" r="66" fill="none" stroke="#2563eb" stroke-width="4"/>
      <circle cx="600" cy="340" r="55" fill="none" stroke="#e60012" stroke-width="4" stroke-dasharray="8 3"/>

      <!-- Racing Bodywork -->
      <path d="M210 240 L310 210 L450 170 L580 190 L610 220 L520 330 L380 340 L280 300 Z" fill="#2563eb" stroke="#3b82f6" stroke-width="3"/>
      <path d="M340 190 L480 180 L560 250 L430 320 L320 260 Z" fill="#0284c7"/>
      <path d="M430 200 L530 210 L500 270 Z" fill="#e60012"/>

      <!-- Gold Front Forks -->
      <path d="M600 340 L530 160 L500 135" stroke="#eab308" stroke-width="12" stroke-linecap="round"/>

      <!-- Akrapovic Exhaust -->
      <path d="M370 350 L490 365 L550 330" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
      <rect x="500" y="315" width="90" height="32" rx="8" transform="rotate(-22 500 315)" fill="#1e293b" stroke="#eab308" stroke-width="2"/>

      <text x="360" y="215" font-family="sans-serif" font-weight="900" font-size="28" fill="#ffffff" font-style="italic">GSX-R</text>
      <text x="460" y="215" font-family="sans-serif" font-weight="900" font-size="28" fill="#e60012" font-style="italic">1000</text>
      <text x="400" y="470" font-family="sans-serif" font-weight="800" font-size="16" fill="#64748b" text-anchor="middle">SUZUKI GSX-R1000R SUPERBIKE - SPECIFICATION</text>
    </svg>
  `),

  'vstrom-650': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
      <rect width="800" height="500" fill="#0b1329"/>
      <path d="M0 100 H800 M0 200 H800 M0 300 H800 M0 400 H800 M100 0 V500 M200 0 V500 M300 0 V500 M400 0 V500 M500 0 V500 M600 0 V500 M700 0 V500" stroke="#1e293b" stroke-width="1"/>
      <ellipse cx="400" cy="425" rx="300" ry="20" fill="#000000"/>

      <!-- Spoke Wheels Adventure -->
      <circle cx="200" cy="330" r="82" fill="none" stroke="#1e293b" stroke-width="12"/>
      <circle cx="200" cy="330" r="68" fill="none" stroke="#eab308" stroke-width="3"/>
      <path d="M200 248 V412 M118 330 H282 M142 272 L258 388 M142 388 L258 272" stroke="#cbd5e1" stroke-width="2"/>

      <circle cx="600" cy="320" r="90" fill="none" stroke="#1e293b" stroke-width="12"/>
      <circle cx="600" cy="320" r="76" fill="none" stroke="#eab308" stroke-width="3"/>
      <path d="M600 230 V410 M510 320 H690 M536 256 L664 384 M536 384 L664 256" stroke="#cbd5e1" stroke-width="2"/>

      <!-- Adventure Tank & Beak (Yellow & Black) -->
      <path d="M250 250 L340 220 L450 170 L550 190 L620 220 L520 250 L420 330 L320 310 Z" fill="#facc15" stroke="#eab308" stroke-width="3"/>
      <path d="M380 180 L480 170 L520 230 L400 300 Z" fill="#0f172a"/>

      <!-- Tall Windshield -->
      <polygon points="530,190 560,110 520,105 510,170" fill="#93c5fd" opacity="0.6" stroke="#3b82f6"/>

      <!-- Engine Crash Bars -->
      <path d="M360 280 L440 270 L460 340 L380 350 Z" fill="none" stroke="#e2e8f0" stroke-width="5"/>

      <text x="360" y="215" font-family="sans-serif" font-weight="900" font-size="24" fill="#0f172a">V-STROM</text>
      <text x="480" y="215" font-family="sans-serif" font-weight="900" font-size="24" fill="#e60012">650 XT</text>
      <text x="400" y="470" font-family="sans-serif" font-weight="800" font-size="16" fill="#64748b" text-anchor="middle">SUZUKI V-STROM 650 XT ADVENTURE PROFILE</text>
    </svg>
  `),

  'dr-650': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
      <rect width="800" height="500" fill="#0f172a"/>
      <path d="M0 100 H800 M0 200 H800 M0 300 H800 M0 400 H800 M100 0 V500 M200 0 V500 M300 0 V500 M400 0 V500 M500 0 V500 M600 0 V500 M700 0 V500" stroke="#1e293b" stroke-width="1"/>
      
      <!-- Knobby Tires Enduro -->
      <circle cx="190" cy="320" r="85" fill="none" stroke="#334155" stroke-width="18" stroke-dasharray="12 6"/>
      <circle cx="190" cy="320" r="68" fill="none" stroke="#2563eb" stroke-width="3"/>

      <circle cx="610" cy="310" r="92" fill="none" stroke="#334155" stroke-width="18" stroke-dasharray="12 6"/>
      <circle cx="610" cy="310" r="75" fill="none" stroke="#2563eb" stroke-width="3"/>

      <!-- Enduro Chassis (White / Blue) -->
      <path d="M220 230 L320 210 L430 180 L520 210 L580 200 L480 320 L340 320 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
      <path d="M340 190 L440 185 L460 240 L360 250 Z" fill="#1d4ed8"/>

      <text x="360" y="225" font-family="sans-serif" font-weight="900" font-size="26" fill="#1d4ed8">DR 650 SE</text>
      <text x="400" y="470" font-family="sans-serif" font-weight="800" font-size="16" fill="#64748b" text-anchor="middle">SUZUKI DR 650 SE DUAL SPORT ENDURO</text>
    </svg>
  `),

  'gn-125': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
      <rect width="800" height="500" fill="#020617"/>
      <path d="M0 100 H800 M0 200 H800 M0 300 H800 M0 400 H800 M100 0 V500 M200 0 V500 M300 0 V500 M400 0 V500 M500 0 V500 M600 0 V500 M700 0 V500" stroke="#1e293b" stroke-width="1"/>
      
      <!-- Classic Spoke Wheels & Chrome -->
      <circle cx="210" cy="340" r="75" fill="none" stroke="#334155" stroke-width="12"/>
      <circle cx="210" cy="340" r="62" fill="none" stroke="#e2e8f0" stroke-width="3"/>
      <path d="M210 265 V415 M135 340 H285" stroke="#cbd5e1" stroke-width="2"/>

      <circle cx="580" cy="340" r="75" fill="none" stroke="#334155" stroke-width="12"/>
      <circle cx="580" cy="340" r="62" fill="none" stroke="#e2e8f0" stroke-width="3"/>
      <path d="M580 265 V415 M505 340 H655" stroke="#cbd5e1" stroke-width="2"/>

      <!-- Tear-Drop Tank (Metallic Red / Black) -->
      <path d="M250 260 L330 250 Q 420 200 480 230 L 460 280 L 320 290 Z" fill="#dc2626" stroke="#991b1b" stroke-width="3"/>
      <circle cx="520" cy="180" r="22" fill="#e2e8f0" stroke="#64748b" stroke-width="3"/>

      <!-- Long Chrome Exhaust -->
      <path d="M340 360 L540 370" stroke="#e2e8f0" stroke-width="12" stroke-linecap="round"/>

      <text x="360" y="260" font-family="sans-serif" font-weight="900" font-size="24" fill="#ffffff">GN 125</text>
      <text x="400" y="470" font-family="sans-serif" font-weight="800" font-size="16" fill="#64748b" text-anchor="middle">SUZUKI GN 125 COMMUTER PROFILE</text>
    </svg>
  `)
};

export const PARTS_SVGS = {
  'part-01': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
      <rect width="600" height="450" fill="#0f172a"/>
      <rect x="100" y="80" width="400" height="290" rx="20" fill="#1e293b" stroke="#e60012" stroke-width="6"/>
      <rect x="125" y="105" width="350" height="240" rx="12" fill="#d97706" stroke="#b45309" stroke-width="4"/>
      <!-- Pleated Filter Elements -->
      <path d="M140 120 V330 M165 120 V330 M190 120 V330 M215 120 V330 M240 120 V330 M265 120 V330 M290 120 V330 M315 120 V330 M340 120 V330 M365 120 V330 M390 120 V330 M415 120 V330 M440 120 V330 M460 120 V330" stroke="#78350f" stroke-width="8"/>
      <rect x="220" y="180" width="160" height="90" rx="10" fill="#0f172a" opacity="0.85"/>
      <text x="300" y="220" font-family="sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">SUZUKI OEM</text>
      <text x="300" y="245" font-family="monospace" font-weight="700" font-size="14" fill="#e60012" text-anchor="middle">REF: 13780-06G00</text>
    </svg>
  `),

  'part-02': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
      <rect width="600" height="450" fill="#0f172a"/>
      <g transform="translate(150, 50)">
        <!-- Spin on canister -->
        <rect x="50" y="60" width="200" height="260" rx="30" fill="#1e3a8a" stroke="#3b82f6" stroke-width="6"/>
        <ellipse cx="150" cy="60" rx="100" ry="25" fill="#3b82f6"/>
        <rect x="70" y="300" width="160" height="40" rx="8" fill="#94a3b8" stroke="#cbd5e1" stroke-width="4"/>
        <circle cx="150" cy="320" r="15" fill="#0f172a"/>
        <text x="150" y="160" font-family="sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle">GENUINE</text>
        <text x="150" y="195" font-family="sans-serif" font-weight="900" font-size="26" fill="#e60012" text-anchor="middle">SUZUKI</text>
        <text x="150" y="230" font-family="monospace" font-weight="700" font-size="14" fill="#93c5fd" text-anchor="middle">OIL FILTER</text>
      </g>
    </svg>
  `),

  'part-03': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
      <rect width="600" height="450" fill="#0f172a"/>
      <!-- Tokico Sintered Brake Pad Pair -->
      <path d="M120 120 H480 Q 520 120 500 180 L 460 320 Q 440 350 380 350 H 220 Q 160 350 140 320 L 100 180 Q 80 120 120 120 Z" fill="#b45309" stroke="#d97706" stroke-width="6"/>
      <rect x="160" y="160" width="280" height="140" rx="15" fill="#78350f" stroke="#f59e0b" stroke-width="4"/>
      <circle cx="160" cy="150" r="16" fill="#0f172a" stroke="#cbd5e1" stroke-width="4"/>
      <circle cx="440" cy="150" r="16" fill="#0f172a" stroke="#cbd5e1" stroke-width="4"/>
      <text x="300" y="225" font-family="sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle">TOKICO SINTERED</text>
      <text x="300" y="260" font-family="monospace" font-weight="700" font-size="16" fill="#fef08a" text-anchor="middle">59300-33820-000</text>
    </svg>
  `),

  'part-04': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
      <rect width="600" height="450" fill="#0f172a"/>
      <!-- Sprocket Tooth Pattern -->
      <circle cx="260" cy="225" r="150" fill="none" stroke="#64748b" stroke-width="24" stroke-dasharray="18 10"/>
      <circle cx="260" cy="225" r="120" fill="#1e293b" stroke="#cbd5e1" stroke-width="4"/>
      <circle cx="260" cy="225" r="50" fill="#0f172a" stroke="#64748b" stroke-width="4"/>
      <!-- Mounting Holes -->
      <circle cx="210" cy="180" r="12" fill="#64748b"/>
      <circle cx="310" cy="180" r="12" fill="#64748b"/>
      <circle cx="210" cy="270" r="12" fill="#64748b"/>
      <circle cx="310" cy="270" r="12" fill="#64748b"/>
      <!-- Drive Chain Loop -->
      <rect x="420" y="120" width="130" height="210" rx="20" fill="none" stroke="#eab308" stroke-width="12" stroke-dasharray="15 6"/>
      <text x="260" y="232" font-family="sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">520 HD</text>
    </svg>
  `),

  'part-05': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
      <rect width="600" height="450" fill="#0f172a"/>
      <!-- Fuel Pump Module -->
      <rect x="220" y="80" width="160" height="240" rx="20" fill="#334155" stroke="#94a3b8" stroke-width="6"/>
      <rect x="240" y="320" width="120" height="60" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
      <path d="M200 120 L220 140 H380 L400 120" stroke="#e60012" stroke-width="6" fill="none"/>
      <text x="300" y="190" font-family="sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle">DENSO EFI</text>
      <text x="300" y="220" font-family="monospace" font-weight="700" font-size="16" fill="#38bdf8" text-anchor="middle">3.5 BAR PUMP</text>
    </svg>
  `),

  'part-06': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
      <rect width="600" height="450" fill="#0f172a"/>
      <!-- Spark Plug Body -->
      <rect x="270" y="40" width="60" height="120" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
      <!-- Ribs -->
      <line x1="260" y1="60" x2="340" y2="60" stroke="#94a3b8" stroke-width="4"/>
      <line x1="260" y1="80" x2="340" y2="80" stroke="#94a3b8" stroke-width="4"/>
      <line x1="260" y1="100" x2="340" y2="100" stroke="#94a3b8" stroke-width="4"/>
      <!-- Hex Nut -->
      <polygon points="250,160 350,160 360,200 240,200" fill="#475569" stroke="#94a3b8" stroke-width="4"/>
      <!-- Thread Body -->
      <rect x="260" y="200" width="80" height="140" fill="#334155" stroke="#cbd5e1" stroke-width="4"/>
      <path d="M260 220 H340 M260 240 H340 M260 260 H340 M260 280 H340 M260 300 H340 M260 320 H340" stroke="#94a3b8" stroke-width="6"/>
      <!-- Iridium Tip -->
      <rect x="295" y="340" width="10" height="30" fill="#eab308"/>
      <path d="M280 380 H320 V365" stroke="#eab308" stroke-width="4" fill="none"/>
      <text x="430" y="100" font-family="sans-serif" font-weight="900" font-size="22" fill="#ffffff">NGK IRIDIUM</text>
      <text x="430" y="130" font-family="monospace" font-weight="700" font-size="16" fill="#e60012">CPR8EA-9</text>
    </svg>
  `),

  'part-07': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
      <rect width="600" height="450" fill="#0f172a"/>
      <rect x="180" y="100" width="240" height="220" rx="20" fill="#1e293b" stroke="#475569" stroke-width="6"/>
      <!-- Terminal Caps -->
      <circle cx="230" cy="150" r="30" fill="#dc2626" stroke="#f8fafc" stroke-width="4"/>
      <circle cx="370" cy="150" r="30" fill="#dc2626" stroke="#f8fafc" stroke-width="4"/>
      <!-- Fuse Slot -->
      <rect x="260" y="230" width="80" height="40" rx="8" fill="#eab308" stroke="#fef08a" stroke-width="3"/>
      <text x="300" y="255" font-family="sans-serif" font-weight="900" font-size="18" fill="#0f172a" text-anchor="middle">30A</text>
      <text x="300" y="360" font-family="sans-serif" font-weight="800" font-size="18" fill="#ffffff" text-anchor="middle">STARTER SOLENOID RELAY</text>
    </svg>
  `),

  'part-08': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
      <rect width="600" height="450" fill="#0f172a"/>
      <!-- Piston Crown & Skirt -->
      <rect x="160" y="100" width="280" height="220" rx="30" fill="#e2e8f0" stroke="#94a3b8" stroke-width="6"/>
      <!-- Ring Grooves -->
      <line x1="150" y1="130" x2="450" y2="130" stroke="#334155" stroke-width="6"/>
      <line x1="150" y1="150" x2="450" y2="150" stroke="#334155" stroke-width="6"/>
      <line x1="150" y1="170" x2="450" y2="170" stroke="#334155" stroke-width="6"/>
      <!-- Wrist Pin Hole -->
      <circle cx="300" cy="230" r="35" fill="#334155" stroke="#cbd5e1" stroke-width="6"/>
      <text x="300" y="370" font-family="sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle">PISTON KIT STD 62.0mm</text>
    </svg>
  `),

  'part-09': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
      <rect width="600" height="450" fill="#0f172a"/>
      <!-- Throttle Body housing -->
      <rect x="140" y="120" width="320" height="180" rx="20" fill="#475569" stroke="#94a3b8" stroke-width="6"/>
      <!-- Throttle Bore -->
      <circle cx="300" cy="210" r="70" fill="#0f172a" stroke="#cbd5e1" stroke-width="5"/>
      <circle cx="300" cy="210" r="55" fill="#1e293b" stroke="#64748b" stroke-width="3"/>
      <!-- Butterfly Valve plates -->
      <path d="M250 180 Q300 215 250 240" stroke="#eab308" stroke-width="6" fill="none"/>
      <path d="M350 180 Q300 215 350 240" stroke="#eab308" stroke-width="6" fill="none"/>
      <!-- TPS sensor housing -->
      <rect x="440" y="160" width="60" height="100" rx="8" fill="#1e3a8a" stroke="#3b82f6" stroke-width="4"/>
      <circle cx="470" cy="195" r="10" fill="#0f172a" stroke="#93c5fd" stroke-width="2"/>
      <circle cx="470" cy="225" r="10" fill="#0f172a" stroke="#93c5fd" stroke-width="2"/>
      <!-- Inlet bell -->
      <path d="M100 160 H140 M100 260 H140" stroke="#94a3b8" stroke-width="8" fill="none"/>
      <!-- Labels -->
      <text x="300" y="100" font-family="sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle">THROTTLE BODY ASSY</text>
      <text x="300" y="350" font-family="monospace" font-weight="700" font-size="16" fill="#e60012" text-anchor="middle">13400-27G10 EFI</text>
    </svg>
  `),

  'part-10': encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
      <rect width="600" height="450" fill="#0f172a"/>
      <!-- Radiator core -->
      <rect x="100" y="100" width="400" height="240" rx="10" fill="#1e3a8a" stroke="#3b82f6" stroke-width="6"/>
      <!-- Fins -->
      ${Array.from({ length: 28 }, (_, i) => `<line x1="${110 + i * 14}" y1="110" x2="${110 + i * 14}" y2="330" stroke="#60a5fa" stroke-width="1.5" opacity="0.55"/>`).join('')}
      ${Array.from({ length: 12 }, (_, i) => `<line x1="110" y1="${110 + i * 20}" x2="490" y2="${110 + i * 20}" stroke="#1e40af" stroke-width="1" opacity="0.4"/>`).join('')}
      <!-- Top tank -->
      <rect x="100" y="80" width="400" height="40" rx="8" fill="#334155" stroke="#94a3b8" stroke-width="3"/>
      <!-- Bottom tank -->
      <rect x="100" y="320" width="400" height="40" rx="8" fill="#334155" stroke="#94a3b8" stroke-width="3"/>
      <!-- Filler cap -->
      <circle cx="300" cy="100" r="22" fill="#0f172a" stroke="#e60012" stroke-width="4"/>
      <text x="300" y="106" font-family="monospace" font-weight="900" font-size="14" fill="#e60012" text-anchor="middle">1.1</text>
      <!-- Hose connections -->
      <rect x="80" y="160" width="30" height="20" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
      <rect x="80" y="270" width="30" height="20" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
      <!-- Fan -->
      <circle cx="550" cy="220" r="60" fill="none" stroke="#64748b" stroke-width="3" opacity="0.5"/>
      <path d="M550 180 Q565 220 550 260" stroke="#94a3b8" stroke-width="3" fill="none"/>
      <path d="M515 200 Q540 220 515 240" stroke="#94a3b8" stroke-width="3" fill="none"/>
      <path d="M585 200 Q560 220 585 240" stroke="#94a3b8" stroke-width="3" fill="none"/>
      <!-- Labels -->
      <text x="300" y="60" font-family="sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">RADIADOR</text>
      <text x="300" y="400" font-family="monospace" font-weight="700" font-size="14" fill="#e60012" text-anchor="middle">17710-14G00</text>
    </svg>
  `)
};

export const DIAGRAM_SVGS = {
  'diag-gixxer-engine': '/diagrams/gixxer-engine.jpg',
  'diag-vstrom-intake': '/diagrams/vstrom-intake.jpg',
  'diag-gsxr-brake': '/diagrams/gsxr-brake.jpg',
  'diag-transmission': '/diagrams/transmission.jpg'
};
