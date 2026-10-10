import React from 'react';
import {
  Layers,
  Sliders,
  X,
  Satellite,
  Map as MapIcon,
  Flame,
  Globe,
  MapPin,
  Tag,
} from 'lucide-react';
import { BackendGeeLayerMetadata } from '../services/apiClient';
import { BAILADILA_LANDMARKS, BailadilaLandmark } from '../simulation/bailadilaLandmarks';

interface LayerControlProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayer: 'satellite' | 'osm' | 'terrain' | 'gee_rgb';
  onSelectBaseLayer: (layer: 'satellite' | 'osm') => void;
  showHeatmap: boolean;
  onToggleHeatmap: (val: boolean) => void;
  showFlownTrail: boolean;
  onToggleFlownTrail: (val: boolean) => void;
  showWaypoints: boolean;
  onToggleWaypoints: (val: boolean) => void;
  showLabels?: boolean;
  onToggleLabels?: (val: boolean) => void;
  showMineLandmarks?: boolean;
  onToggleMineLandmarks?: (val: boolean) => void;
  onSelectLandmarkAoi?: (landmark: BailadilaLandmark) => void;
  heatmapOpacity: number;
  onOpacityChange: (val: number) => void;
  geeLayers: BackendGeeLayerMetadata[];
  activeGeeLayer: string | null;
  onSelectGeeLayer: (layerName: string | null) => void;
  onOpenGeeConfig: () => void;
  isGeeLive: boolean;
  areaDescription?: string;
  onRefreshGeeArea?: () => void;
}

export const LayerControl: React.FC<LayerControlProps> = ({
  isOpen,
  onClose,
  activeLayer,
  onSelectBaseLayer,
  showHeatmap,
  onToggleHeatmap,
  showFlownTrail,
  onToggleFlownTrail,
  showWaypoints,
  onToggleWaypoints,
  showLabels = true,
  onToggleLabels,
  showMineLandmarks = true,
  onToggleMineLandmarks,
  onSelectLandmarkAoi,
  heatmapOpacity,
  onOpacityChange,
  geeLayers,
  activeGeeLayer,
  onSelectGeeLayer,
  onOpenGeeConfig,
  isGeeLive,
  areaDescription,
  onRefreshGeeArea,
}) => {
  if (!isOpen) return null;

  const getLayerBadge = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('nir') || lower.includes('false-color')) {
      return { tag: 'NIR Vegetation', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
    if (lower.includes('ndvi')) {
      return { tag: 'NDVI Index', color: 'bg-green-100 text-green-800 border-green-300' };
    }
    if (lower.includes('ferrous')) {
      return { tag: 'Ferrous Iron', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    }
    if (lower.includes('ferric')) {
      return { tag: 'Ferric Surface', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    if (lower.includes('dem') || lower.includes('elevation')) {
      return { tag: 'Elevation DEM', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    }
    return { tag: 'Optical RGB', color: 'bg-blue-100 text-blue-800 border-blue-300' };
  };

  return (
    <div className="absolute top-16 left-16 z-30 w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E2E8F0] shadow-xl p-4 text-[#172B4D] select-none max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#1976D2]" />
          <h3 className="text-xs font-bold text-[#172B4D]">Map Layers & Overlays</h3>
        </div>
        <button
          onClick={onClose}
          className="text-[#5E6C84] hover:text-[#172B4D] p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Base Layer Switcher */}
      <div className="space-y-2 mb-4">
        <div className="text-[10px] uppercase font-bold text-[#5E6C84] tracking-wider">
          Basemap Imagery
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSelectBaseLayer('satellite')}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeLayer === 'satellite'
                ? 'bg-blue-50 border-[#1976D2] text-[#1976D2] shadow-xs'
                : 'border-slate-200 hover:bg-slate-50 text-[#5E6C84]'
            }`}
          >
            <Satellite className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div>Satellite</div>
              <div className="text-[9px] font-normal text-slate-400">Satellite / High-Res</div>
            </div>
          </button>

          <button
            onClick={() => onSelectBaseLayer('osm')}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeLayer === 'osm'
                ? 'bg-blue-50 border-[#1976D2] text-[#1976D2] shadow-xs'
                : 'border-slate-200 hover:bg-slate-50 text-[#5E6C84]'
            }`}
          >
            <MapIcon className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div>Vector Map</div>
              <div className="text-[9px] font-normal text-slate-400">OpenStreetMap</div>
            </div>
          </button>
        </div>
      </div>

      {/* Google Earth Engine Layers Section */}
      <div className="space-y-2 mb-4 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-[#5E6C84] tracking-wider flex items-center space-x-1">
            <Globe className="w-3 h-3 text-[#1976D2]" />
            <span>Google Earth Engine (GEE)</span>
          </span>
          <button
            onClick={onOpenGeeConfig}
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider cursor-pointer ${
              isGeeLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-100 text-[#5E6C84] border-slate-300 hover:bg-slate-200'
            }`}
          >
            {isGeeLive ? 'GEE Live' : 'Configure GEE'}
          </button>
        </div>

        {areaDescription && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] flex items-center justify-between">
            <span className="text-slate-500 truncate mr-1">
              Area: <strong className="text-slate-700">{areaDescription}</strong>
            </span>
            {onRefreshGeeArea && (
              <button
                onClick={onRefreshGeeArea}
                className="text-[#1976D2] hover:underline font-semibold shrink-0 cursor-pointer text-[9px]"
              >
                Re-clip
              </button>
            )}
          </div>
        )}

        {isGeeLive && geeLayers.length > 0 ? (
          <div className="space-y-1.5">
            <button
              onClick={() => onSelectGeeLayer(null)}
              className={`w-full p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                activeGeeLayer === null
                  ? 'bg-blue-50 border-blue-300 font-semibold text-[#1976D2]'
                  : 'bg-slate-50 border-slate-200 text-[#5E6C84]'
              }`}
            >
              None (Use Basemap Only)
            </button>
            {geeLayers.map((layer) => {
              const badge = getLayerBadge(layer.name);
              return (
                <button
                  key={layer.name}
                  onClick={() => onSelectGeeLayer(layer.name)}
                  className={`w-full p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                    activeGeeLayer === layer.name
                      ? 'bg-blue-50 border-blue-300 font-semibold text-[#1976D2]'
                      : 'bg-slate-50 border-slate-200 text-[#5E6C84] hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-[#172B4D] truncate mr-1">{layer.name}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${badge.color}`}>
                      {badge.tag}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#5E6C84] line-clamp-2">{layer.description}</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-[#5E6C84]">
            <p className="leading-relaxed">
              Live Sentinel-2 & DEM layers stream when Google Cloud credentials are authenticated.
            </p>
            <button
              onClick={onOpenGeeConfig}
              className="mt-1.5 text-xs text-[#1976D2] font-semibold hover:underline block"
            >
              Open GEE setup guide &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Overlay Toggles */}
      <div className="space-y-2.5 mb-4 text-xs pt-2 border-t border-slate-200">
        <div className="text-[10px] uppercase font-bold text-[#5E6C84] tracking-wider">
          Geospatial Overlays
        </div>

        <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
          <span className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>Prospectivity Heat Map</span>
          </span>
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(e) => onToggleHeatmap(e.target.checked)}
            className="rounded accent-[#1976D2]"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
          <span className="flex items-center space-x-2">
            <span className="w-3.5 h-1 bg-emerald-500 rounded" />
            <span>Flown Flight Trail</span>
          </span>
          <input
            type="checkbox"
            checked={showFlownTrail}
            onChange={(e) => onToggleFlownTrail(e.target.checked)}
            className="rounded accent-[#1976D2]"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
          <span className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full border border-blue-500 flex items-center justify-center text-[8px] font-bold text-blue-500">
              #
            </span>
            <span>Waypoint Pins</span>
          </span>
          <input
            type="checkbox"
            checked={showWaypoints}
            onChange={(e) => onToggleWaypoints(e.target.checked)}
            className="rounded accent-[#1976D2]"
          />
        </label>

        {onToggleLabels && (
          <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
            <span className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-sky-600" />
              <span>Place & Road Labels</span>
            </span>
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => onToggleLabels(e.target.checked)}
              className="rounded accent-[#1976D2]"
            />
          </label>
        )}

        {onToggleMineLandmarks && (
          <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
            <span className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>Bailadila Mine Pit Landmarks</span>
            </span>
            <input
              type="checkbox"
              checked={showMineLandmarks}
              onChange={(e) => onToggleMineLandmarks(e.target.checked)}
              className="rounded accent-[#1976D2]"
            />
          </label>
        )}
      </div>

      {/* Bailadila Mine Presets Quick Jumper */}
      {onSelectLandmarkAoi && (
        <div className="space-y-2 mb-4 pt-2 border-t border-slate-200">
          <div className="text-[10px] uppercase font-bold text-[#5E6C84] tracking-wider">
            Bailadila Mine Complexes
          </div>
          <div className="space-y-1">
            {BAILADILA_LANDMARKS.filter((l) => l.pitBoundary).map((landmark) => (
              <button
                key={landmark.id}
                onClick={() => onSelectLandmarkAoi(landmark)}
                className="w-full text-left p-2 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-semibold text-[#172B4D] group-hover:text-amber-800">
                    {landmark.name}
                  </div>
                  <div className="text-[10px] text-[#5E6C84]">
                    {landmark.elevationM}m MSL &bull; Open-cast pit
                  </div>
                </div>
                <span className="text-[10px] text-[#1976D2] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Set AOI &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap Opacity */}
      {showHeatmap && (
        <div className="space-y-1.5 pt-2 border-t border-slate-200">
          <div className="flex justify-between text-[11px]">
            <span className="text-[#5E6C84] font-medium flex items-center space-x-1">
              <Sliders className="w-3 h-3" />
              <span>Heat Map Opacity</span>
            </span>
            <span className="font-mono font-bold text-[#172B4D]">
              {Math.round(heatmapOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={heatmapOpacity}
            onChange={(e) => onOpacityChange(Number(e.target.value))}
            className="w-full accent-[#1976D2] cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};
