import React from 'react';
import {
  MousePointer,
  Layers,
  Hexagon,
  Route,
  Grid,
  Ruler,
  ListOrdered,
  Maximize2,
  Sparkles,
} from 'lucide-react';

interface LeftToolRailProps {
  isDrawingBoundary: boolean;
  isDrawingManualRoute: boolean;
  isLayersPanelOpen: boolean;
  isWaypointsListOpen: boolean;
  isMeasuringOpen: boolean;
  onToggleDrawingBoundary: () => void;
  onToggleDrawingManualRoute: () => void;
  onGenerateGrid: () => void;
  onToggleLayersPanel: () => void;
  onToggleWaypointsList: () => void;
  onToggleMeasuring: () => void;
  onFitMapBounds: () => void;
  onLoadDemoMission: () => void;
}

export const LeftToolRail: React.FC<LeftToolRailProps> = ({
  isDrawingBoundary,
  isDrawingManualRoute,
  isLayersPanelOpen,
  isWaypointsListOpen,
  isMeasuringOpen,
  onToggleDrawingBoundary,
  onToggleDrawingManualRoute,
  onGenerateGrid,
  onToggleLayersPanel,
  onToggleWaypointsList,
  onToggleMeasuring,
  onFitMapBounds,
  onLoadDemoMission,
}) => {
  return (
    <aside className="w-12 bg-white border-r border-[#E2E8F0] flex flex-col items-center py-3 space-y-2 shadow-xs z-20 shrink-0 select-none">
      {/* Select / Default Cursor */}
      <button
        onClick={() => {
          if (isDrawingBoundary) onToggleDrawingBoundary();
          if (isDrawingManualRoute) onToggleDrawingManualRoute();
        }}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          !isDrawingBoundary && !isDrawingManualRoute
            ? 'bg-blue-50 text-[#1976D2] font-semibold'
            : 'text-[#5E6C84] hover:bg-slate-100 hover:text-[#172B4D]'
        }`}
        title="Select / Inspect Tool"
      >
        <MousePointer className="w-4 h-4" />
      </button>

      {/* Layer selector toggle */}
      <button
        onClick={onToggleLayersPanel}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          isLayersPanelOpen
            ? 'bg-blue-50 text-[#1976D2]'
            : 'text-[#5E6C84] hover:bg-slate-100 hover:text-[#172B4D]'
        }`}
        title="Map Layers & Overlays"
      >
        <Layers className="w-4 h-4" />
      </button>

      <div className="w-6 h-[1px] bg-[#E2E8F0] my-1" />

      {/* Draw Survey Boundary (Polygon) */}
      <button
        onClick={onToggleDrawingBoundary}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          isDrawingBoundary
            ? 'bg-[#1976D2] text-white shadow-xs'
            : 'text-[#5E6C84] hover:bg-slate-100 hover:text-[#172B4D]'
        }`}
        title="Draw Survey Boundary Polygon"
      >
        <Hexagon className="w-4 h-4" />
      </button>

      {/* Draw Manual Route */}
      <button
        onClick={onToggleDrawingManualRoute}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          isDrawingManualRoute
            ? 'bg-[#1976D2] text-white shadow-xs'
            : 'text-[#5E6C84] hover:bg-slate-100 hover:text-[#172B4D]'
        }`}
        title="Draw Manual Waypoints Route"
      >
        <Route className="w-4 h-4" />
      </button>

      {/* Generate Survey Grid (Lawnmower) */}
      <button
        onClick={onGenerateGrid}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5E6C84] hover:bg-slate-100 hover:text-[#172B4D] transition-all cursor-pointer"
        title="Generate Lawnmower Survey Grid inside Area"
      >
        <Grid className="w-4 h-4" />
      </button>

      {/* Measure Distance / Area */}
      <button
        onClick={onToggleMeasuring}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          isMeasuringOpen
            ? 'bg-blue-50 text-[#1976D2]'
            : 'text-[#5E6C84] hover:bg-slate-100 hover:text-[#172B4D]'
        }`}
        title="Survey Area & Route Statistics"
      >
        <Ruler className="w-4 h-4" />
      </button>

      {/* Waypoint List Drawer */}
      <button
        onClick={onToggleWaypointsList}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          isWaypointsListOpen
            ? 'bg-blue-50 text-[#1976D2]'
            : 'text-[#5E6C84] hover:bg-slate-100 hover:text-[#172B4D]'
        }`}
        title="Mission Waypoints Table"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-6 h-[1px] bg-[#E2E8F0] my-1" />

      {/* Load Bailadila Demo Mission */}
      <button
        onClick={onLoadDemoMission}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
        title="Load Bailadila Demo Mission"
      >
        <Sparkles className="w-4 h-4" />
      </button>

      {/* Fit Map to Route */}
      <button
        onClick={onFitMapBounds}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5E6C84] hover:bg-slate-100 hover:text-[#172B4D] transition-all cursor-pointer"
        title="Fit Map View to Survey Bounds"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </aside>
  );
};
