export type ColormapType = 'jet_engine' | 'turbo_afterburner' | 'magma_infrared';

interface ColorStop {
  pos: number; // 0.0 to 1.0
  r: number;
  g: number;
  b: number;
}

/**
 * 1. Classic Jet Engine / Turbojet Exhaust Colormap:
 * Deep Midnight Navy (0% cold background) -> Cobalt Blue -> Electric Cyan ->
 * Thermal Lime Green -> Solar Flare Yellow -> Afterburner Orange ->
 * Neon Crimson -> White-Hot Core (100% peak iron probability).
 */
export const JET_ENGINE_STOPS: ColorStop[] = [
  { pos: 0.00, r: 2,   g: 6,   b: 36  }, // Deep dark void blue
  { pos: 0.12, r: 0,   g: 32,  b: 140 }, // Deep royal navy
  { pos: 0.28, r: 0,   g: 140, b: 245 }, // Electric cyan-blue
  { pos: 0.42, r: 0,   g: 225, b: 215 }, // Vivid turquoise plume
  { pos: 0.56, r: 35,  g: 225, b: 55  }, // Thermal green transition
  { pos: 0.70, r: 255, g: 235, b: 15  }, // Intense electric yellow
  { pos: 0.82, r: 255, g: 110, b: 0   }, // Jet afterburner flame orange
  { pos: 0.92, r: 235, g: 25,  b: 35  }, // Magma flame crimson
  { pos: 0.97, r: 255, g: 90,  b: 165 }, // Superheated plasma violet-pink
  { pos: 1.00, r: 255, g: 255, b: 255 }, // Incandescent white-hot peak core!
];

/**
 * 2. Turbo Afterburner: High-contrast aerodynamic FLIR exhaust plume.
 */
export const TURBO_AFTERBURNER_STOPS: ColorStop[] = [
  { pos: 0.00, r: 15,  g: 10,  b: 30  },
  { pos: 0.15, r: 40,  g: 35,  b: 150 },
  { pos: 0.32, r: 0,   g: 175, b: 240 },
  { pos: 0.50, r: 40,  g: 220, b: 110 },
  { pos: 0.68, r: 255, g: 215, b: 10  },
  { pos: 0.84, r: 255, g: 85,  b: 0   },
  { pos: 0.94, r: 235, g: 15,  b: 55  },
  { pos: 1.00, r: 255, g: 255, b: 255 },
];

/**
 * 3. Magma Infrared Thermal: Deep crustal heat absorption.
 */
export const MAGMA_INFRARED_STOPS: ColorStop[] = [
  { pos: 0.00, r: 4,   g: 2,   b: 10  },
  { pos: 0.20, r: 55,  g: 15,  b: 105 },
  { pos: 0.40, r: 135, g: 30,  b: 120 },
  { pos: 0.60, r: 215, g: 70,  b: 65  },
  { pos: 0.80, r: 250, g: 160, b: 40  },
  { pos: 0.92, r: 252, g: 230, b: 120 },
  { pos: 1.00, r: 255, g: 255, b: 255 },
];

function getStops(mode: ColormapType): ColorStop[] {
  if (mode === 'turbo_afterburner') return TURBO_AFTERBURNER_STOPS;
  if (mode === 'magma_infrared') return MAGMA_INFRARED_STOPS;
  return JET_ENGINE_STOPS;
}

/**
 * Smooth continuous RGB interpolation along the jet thermal colormap
 */
export function getJetRgb(value0to1: number, mode: ColormapType = 'jet_engine'): [number, number, number] {
  const t = Math.max(0, Math.min(1, value0to1));
  const stops = getStops(mode);

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];

    if (t >= s1.pos && t <= s2.pos) {
      const localT = (t - s1.pos) / Math.max(1e-5, s2.pos - s1.pos);
      const r = Math.round(s1.r + (s2.r - s1.r) * localT);
      const g = Math.round(s1.g + (s2.g - s1.g) * localT);
      const b = Math.round(s1.b + (s2.b - s1.b) * localT);
      return [r, g, b];
    }
  }

  const last = stops[stops.length - 1];
  return [last.r, last.g, last.b];
}

/**
 * Returns hex color string (#RRGGBB)
 */
export function getJetHex(value0to1: number, mode: ColormapType = 'jet_engine'): string {
  const [r, g, b] = getJetRgb(value0to1, mode);
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Returns CSS color string (rgb() or rgba())
 */
export function getJetCss(value0to1: number, opacity: number = 1.0, mode: ColormapType = 'jet_engine'): string {
  const [r, g, b] = getJetRgb(value0to1, mode);
  if (opacity >= 0.99) {
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(2)})`;
}

/**
 * Probability classification label for a given 0-100 index
 */
export function getProbabilityTier(compositeIndex: number): {
  label: string;
  badgeBg: string;
  badgeText: string;
  isHotspot: boolean;
} {
  if (compositeIndex >= 90) {
    return {
      label: 'MAXIMUM PROBABILITY (WHITE-HOT CORE)',
      badgeBg: 'bg-white border-rose-500 shadow-rose-500/50',
      badgeText: 'text-rose-950 font-black',
      isHotspot: true,
    };
  }
  if (compositeIndex >= 75) {
    return {
      label: 'HIGH IRON PROBABILITY (AFTERBURNER FLAME)',
      badgeBg: 'bg-rose-600 border-orange-400 shadow-orange-500/40',
      badgeText: 'text-white font-bold',
      isHotspot: true,
    };
  }
  if (compositeIndex >= 55) {
    return {
      label: 'MODERATE SUSCEPTIBILITY (SOLAR YELLOW)',
      badgeBg: 'bg-amber-500 border-yellow-300 shadow-yellow-500/30',
      badgeText: 'text-amber-950 font-bold',
      isHotspot: false,
    };
  }
  if (compositeIndex >= 35) {
    return {
      label: 'PERIPHERAL ANOMALY (LIME / CYAN PLUME)',
      badgeBg: 'bg-emerald-600 border-teal-300',
      badgeText: 'text-white font-semibold',
      isHotspot: false,
    };
  }
  return {
    label: 'BACKGROUND FIELD (COLD PLUME)',
    badgeBg: 'bg-blue-900 border-blue-700',
    badgeText: 'text-blue-100 font-medium',
    isHotspot: false,
  };
}
