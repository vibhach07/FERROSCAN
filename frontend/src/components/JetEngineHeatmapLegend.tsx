import React from 'react';
import { Flame, Target, Eye, Sliders, ChevronDown } from 'lucide-react';
import { ProspectivityResult } from '../types/processing';
import { ColormapType, getProbabilityTier } from '../utils/jetColorScale';

interface JetEngineHeatmapLegendProps {
  result: ProspectivityResult | null;
  isVisible: boolean;
  opacity: number;
  onOpacityChange: (val: number) => void;
  colormap: ColormapType;
  onColormapChange: (mode: ColormapType) => void;
  onFocusPeakHotspot: () => void;
}

export const JetEngineHeatmapLegend: React.FC<JetEngineHeatmapLegendProps> = ({
  result,
  isVisible,
  opacity,
  onOpacityChange,
  colormap,
  onColormapChange,
  onFocusPeakHotspot,
}) => {
  if (!isVisible || !result) return null;

  const topHotspot = result.hotspots[0];
  const peakIndex = result.stats.maxCompositeIndex;
  const peakTier = getProbabilityTier(peakIndex);

  // Gradient definitions
  const gradientStyles: Record<ColormapType, string> = {
    jet_engine:
      'linear-gradient(90deg, #020624 0%, #00208c 12%, #008cf5 28%, #00e1d7 42%, #23e137 56%, #ffeb0f 70%, #ff6e00 82%, #eb1923 92%, #ffffff 100%)',
    turbo_afterburner:
      'linear-gradient(90deg, #0f0a1e 0%, #282396 15%, #00afef 32%, #28dc6e 50%, #ffd70a 68%, #ff5500 84%, #eb0f37 94%, #ffffff 100%)',
    magma_infrared:
      'linear-gradient(90deg, #04020a 0%, #370f69 20%, #871e78 40%, #d74641 60%, #faa028 80%, #fce678 92%, #ffffff 100%)',
  };

  return (
    <div className="absolute bottom-23 right-3 z-20 w-[380px] bg-slate-950/92 backdrop-blur-md rounded-2xl border border-rose-500/40 shadow-2xl p-3.5 text-slate-100 select-none animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-400">
            <Flame className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-black tracking-wider text-rose-300 uppercase flex items-center gap-1.5">
              <span>Jet Engine Thermal Spectrum</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            </div>
            <div className="text-[9px] text-slate-400 font-mono">
              Iron-Ore Probability & Heatmap Radiance
            </div>
          </div>
        </div>

        {/* Colormap mode switcher */}
        <div className="relative">
          <select
            value={colormap}
            onChange={(e) => onColormapChange(e.target.value as ColormapType)}
            className="bg-slate-900 border border-slate-700 hover:border-rose-400 text-[10px] text-slate-200 font-semibold rounded-lg px-2 py-1 pr-5 appearance-none cursor-pointer focus:outline-hidden"
          >
            <option value="jet_engine">🚀 Jet Engine Plume</option>
            <option value="turbo_afterburner">🔥 Turbo Afterburner</option>
            <option value="magma_infrared">🌋 Magma Infrared</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Jet Thermal Gradient Ramp */}
      <div className="mb-2">
        <div className="h-5 rounded-md shadow-inner border border-white/20 relative overflow-hidden"
             style={{ background: gradientStyles[colormap] }}>
          {/* Subtle thermal scanline shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          {/* Peak marker indicator */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-black border-x border-white shadow-lg"
            style={{ left: `${Math.min(99, Math.max(1, peakIndex))}%` }}
            title={`Peak Target: ${peakIndex}% probability`}
          />
        </div>

        {/* Temperature / Probability Labels */}
        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mt-1 px-0.5">
          <span className="text-blue-400 font-bold">0% Cold Plume</span>
          <span className="text-cyan-300">25%</span>
          <span className="text-lime-400">50% Moderate</span>
          <span className="text-amber-400">75% Hot</span>
          <span className="text-white font-extrabold bg-rose-600/60 px-1 py-0.2 rounded border border-rose-400">
            100% White Core
          </span>
        </div>
      </div>

      {/* Peak Anomaly Detection Card */}
      {topHotspot && (
        <div className="bg-slate-900/80 rounded-xl p-2.5 border border-rose-500/30 mb-2 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>Peak Target Fe Epicenter</span>
              <span className="text-rose-400 font-bold">#{topHotspot.rank}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-sm font-black text-rose-400">
                +{topHotspot.anomalyNt.toFixed(1)} nT
              </span>
              <span className="text-[10px] font-bold text-amber-300">
                {topHotspot.compositeIndex.toFixed(1)}% Relative Fe
              </span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
              Coords: {topHotspot.lat.toFixed(5)}, {topHotspot.lng.toFixed(5)}
            </div>
          </div>

          <button
            onClick={onFocusPeakHotspot}
            className="py-1.5 px-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-md shadow-rose-950"
            title="Pan map directly to peak afterburner hotspot"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Target Peak</span>
          </button>
        </div>
      )}

      {/* Opacity Controller */}
      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
        <span className="text-slate-400 font-medium flex items-center space-x-1">
          <Sliders className="w-3 h-3 text-rose-400" />
          <span>Thermal Plume Opacity</span>
        </span>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min={0.2}
            max={1.0}
            step={0.05}
            value={opacity}
            onChange={(e) => onOpacityChange(Number(e.target.value))}
            className="w-24 accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="font-mono text-[10px] font-bold text-slate-300 w-8 text-right">
            {Math.round(opacity * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
