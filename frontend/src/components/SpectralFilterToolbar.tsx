import React from 'react';
import {
  Satellite,
  Leaf,
  Layers,
  Sparkles,
  Mountain,
  RefreshCw,
  EyeOff,
  Flame,
  Check,
} from 'lucide-react';
import { BackendGeeLayerMetadata } from '../services/apiClient';

interface SpectralFilterToolbarProps {
  geeLayers: BackendGeeLayerMetadata[];
  activeGeeLayer: string | null;
  onSelectGeeLayer: (layerName: string | null) => void;
  areaDescription: string;
  onRefreshArea: () => void;
  isRefreshing?: boolean;
  isGeeLive: boolean;
  onOpenLayersPanel: () => void;
}

export const SpectralFilterToolbar: React.FC<SpectralFilterToolbarProps> = ({
  geeLayers,
  activeGeeLayer,
  onSelectGeeLayer,
  areaDescription,
  onRefreshArea,
  isRefreshing = false,
  isGeeLive,
  onOpenLayersPanel,
}) => {
  // Quick filter presets mapping
  const quickFilters = [
    {
      id: 'nir',
      label: 'NIR Vegetation',
      icon: Leaf,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-emerald-900/30',
      match: (name: string) => name.toLowerCase().includes('nir') || name.toLowerCase().includes('false-color'),
    },
    {
      id: 'ndvi',
      label: 'NDVI Index',
      icon: Sparkles,
      color: 'text-green-400',
      activeBg: 'bg-green-950/80 border-green-500 text-green-300 shadow-green-900/30',
      match: (name: string) => name.toLowerCase().includes('ndvi'),
    },
    {
      id: 'ferrous',
      label: 'Ferrous Iron',
      icon: Flame,
      color: 'text-rose-400',
      activeBg: 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-rose-900/30',
      match: (name: string) => name.toLowerCase().includes('ferrous'),
    },
    {
      id: 'rgb',
      label: 'True-Color',
      icon: Satellite,
      color: 'text-blue-400',
      activeBg: 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-blue-900/30',
      match: (name: string) => name.toLowerCase().includes('true-color') || name.toLowerCase().includes('natural'),
    },
    {
      id: 'dem',
      label: 'DEM Terrain',
      icon: Mountain,
      color: 'text-amber-400',
      activeBg: 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-amber-900/30',
      match: (name: string) => name.toLowerCase().includes('dem') || name.toLowerCase().includes('elevation'),
    },
  ];

  const handleQuickFilterClick = (matcher: (name: string) => boolean) => {
    const matched = geeLayers.find((l) => matcher(l.name));
    if (matched) {
      if (activeGeeLayer === matched.name) {
        onSelectGeeLayer(null);
      } else {
        onSelectGeeLayer(matched.name);
      }
    } else if (geeLayers.length > 0) {
      onSelectGeeLayer(geeLayers[0].name);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end space-y-1.5 select-none font-sans pointer-events-auto">
      {/* Quick Filter Pill Group */}
      <div className="flex items-center space-x-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-2xl border border-slate-700/60 shadow-xl">
        <div className="px-2 py-1 text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1 border-r border-slate-800 mr-0.5">
          <Layers className="w-3 h-3 text-[#1976D2]" />
          <span className="hidden sm:inline">Spectral Filters</span>
        </div>

        {quickFilters.map((qf) => {
          const matchedLayer = geeLayers.find((l) => qf.match(l.name));
          const isActive = matchedLayer && activeGeeLayer === matchedLayer.name;
          const Icon = qf.icon;

          return (
            <button
              key={qf.id}
              onClick={() => handleQuickFilterClick(qf.match)}
              disabled={!isGeeLive || !matchedLayer}
              title={
                matchedLayer
                  ? `Switch to ${matchedLayer.name}`
                  : `${qf.label} (Requires Earth Engine live connection)`
              }
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center space-x-1.5 transition-all border cursor-pointer ${
                isActive
                  ? `${qf.activeBg} shadow-sm font-bold`
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700'
              } ${!isGeeLive || !matchedLayer ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : qf.color}`} />
              <span>{qf.label}</span>
              {isActive && <Check className="w-2.5 h-2.5 ml-0.5" />}
            </button>
          );
        })}

        {/* Clear Filter / None */}
        <button
          onClick={() => onSelectGeeLayer(null)}
          title="Disable GEE overlays (Basemap only)"
          className={`p-1.5 rounded-xl text-[10px] font-medium transition-all border cursor-pointer ${
            activeGeeLayer === null
              ? 'bg-blue-900/40 border-blue-500 text-blue-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Area & Sync Context Badge */}
      <div className="flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-800 text-[10px] text-slate-300 shadow-md">
        <span className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-400 font-medium">Applied to:</span>
          <span className="font-semibold text-cyan-300 max-w-[200px] truncate">
            {areaDescription}
          </span>
        </span>

        <button
          onClick={onRefreshArea}
          disabled={isRefreshing}
          className="ml-1 text-slate-400 hover:text-cyan-300 p-0.5 rounded transition-colors cursor-pointer"
          title="Re-clip and refresh GEE spectral layers to this area"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        <span className="text-slate-700">|</span>

        <button
          onClick={onOpenLayersPanel}
          className="text-[9px] text-[#1976D2] hover:text-blue-400 font-semibold cursor-pointer"
        >
          All Layers &rarr;
        </button>
      </div>
    </div>
  );
};
export default SpectralFilterToolbar;
