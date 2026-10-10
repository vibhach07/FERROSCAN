import React from 'react';
import { ProspectivityResult } from '../types/processing';
import {
  exportProcessedGridCsv,
  exportProspectivityGeoJson,
} from '../services/prospectivityService';
import {
  X,
  Download,
  AlertTriangle,
  Flame,
  Layers,
  MapPin,
  Sliders,
  FileSpreadsheet,
  Globe,
} from 'lucide-react';

interface ProspectivityResultsPanelProps {
  result: ProspectivityResult | null;
  opacity: number;
  onOpacityChange: (val: number) => void;
  onClose: () => void;
}

export const ProspectivityResultsPanel: React.FC<ProspectivityResultsPanelProps> = ({
  result,
  opacity,
  onOpacityChange,
  onClose,
}) => {
  if (!result) return null;

  const handleDownloadGridCsv = () => {
    const csvStr = exportProcessedGridCsv(result);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.sourceDatasetName}_PROCESSED_GRID_IDW.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadGeoJson = () => {
    const geoJsonStr = exportProspectivityGeoJson(result);
    const blob = new Blob([geoJsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.sourceDatasetName}_HOTSPOTS.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute top-4 right-4 z-20 w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E2E8F0] shadow-xl p-4 text-[#172B4D] select-none max-h-[calc(100vh-120px)] overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#172B4D]">Exploratory Prospectivity</h3>
            <div className="text-[10px] text-[#5E6C84]">
              Inverse Distance Weighting (IDW)
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#5E6C84] hover:text-[#172B4D] p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Jet Engine Thermal Plume Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-rose-950 p-2.5 rounded-xl border border-rose-500/40 text-white mb-3 shadow-inner">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-mono text-rose-300 font-black uppercase tracking-wider flex items-center gap-1.5">
            <span>🚀 Jet Engine Exhaust Spectrum</span>
          </span>
          <span className="px-1.5 py-0.5 rounded text-[8px] bg-rose-600 text-white font-black tracking-wide">
            {result.stats.maxCompositeIndex >= 90 ? 'WHITE-HOT CORE' : 'AFTERBURNER ZONE'}
          </span>
        </div>
        <div className="h-2.5 rounded-full mt-1.5 bg-gradient-to-r from-[#020624] via-[#008cf5] via-[#23e137] via-[#ffeb0f] via-[#ff6e00] via-[#eb1923] to-[#ffffff] border border-white/40 shadow-xs" />
        <div className="flex justify-between text-[8px] font-mono text-slate-400 mt-1">
          <span className="text-blue-400">0% Cold Plume</span>
          <span className="text-lime-300">50% Fe</span>
          <span className="text-white font-extrabold">100% Core Target</span>
        </div>
      </div>

      {/* Summary Score Badges */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-200">
          <div className="text-[9px] uppercase font-bold text-rose-700">Peak Anomaly</div>
          <div className="font-mono text-base font-bold text-rose-800 mt-0.5">
            +{result.stats.maxAnomalyNt.toFixed(1)}{' '}
            <span className="text-[10px] font-normal">nT</span>
          </div>
        </div>

        <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
          <div className="text-[9px] uppercase font-bold text-amber-800">Max Rel. Index</div>
          <div className="font-mono text-base font-bold text-amber-900 mt-0.5">
            {result.stats.maxCompositeIndex.toFixed(1)}{' '}
            <span className="text-[10px] font-normal">/ 100</span>
          </div>
        </div>
      </div>

      {/* Candidate Hotspots List */}
      <div className="space-y-1.5 mb-3">
        <div className="text-[10px] uppercase font-bold text-[#5E6C84] tracking-wider flex items-center justify-between">
          <span>Top Candidate Hotspots</span>
          <span className="text-[10px] text-slate-400 font-normal">
            ({result.hotspots.length} identified)
          </span>
        </div>

        <div className="space-y-1">
          {result.hotspots.map((h) => (
            <div
              key={h.id}
              className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  {h.rank}
                </span>
                <div>
                  <div className="font-mono text-[11px] font-semibold text-[#172B4D]">
                    {h.lat.toFixed(5)}, {h.lng.toFixed(5)}
                  </div>
                  <div className="text-[9px] text-[#5E6C84]">
                    Confidence: ~{h.nearestSampleDistM.toFixed(0)}m to sample
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-rose-600 text-[11px]">
                  +{h.anomalyNt.toFixed(1)} nT
                </div>
                <div className="text-[9px] text-slate-400 font-semibold">
                  Idx {h.compositeIndex.toFixed(0)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Opacity Slider */}
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-3 space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-[#5E6C84] font-medium flex items-center space-x-1">
            <Sliders className="w-3 h-3" />
            <span>Layer Opacity</span>
          </span>
          <span className="font-mono font-bold text-[#172B4D]">
            {Math.round(opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0.1}
          max={1.0}
          step={0.05}
          value={opacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="w-full accent-[#1976D2] cursor-pointer"
        />
      </div>

      {/* Scientific Caveat / Prototype Disclaimer */}
      <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[10px] text-amber-900 leading-relaxed mb-3">
        <div className="font-bold flex items-center space-x-1 text-amber-800 mb-0.5">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>Scientific Boundary Notice</span>
        </div>
        {result.disclaimer}
      </div>

      {/* Export Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleDownloadGridCsv}
          className="py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-[#172B4D] flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export Grid CSV</span>
        </button>

        <button
          onClick={handleDownloadGeoJson}
          className="py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-[#172B4D] flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>GeoJSON Points</span>
        </button>
      </div>
    </div>
  );
};
