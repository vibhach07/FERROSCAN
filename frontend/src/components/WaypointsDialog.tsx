import React from 'react';
import { Waypoint } from '../types/mission';
import { X, ListOrdered, MapPin } from 'lucide-react';

interface WaypointsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  waypoints: Waypoint[];
  currentWaypointIndex: number;
}

export const WaypointsDialog: React.FC<WaypointsDialogProps> = ({
  isOpen,
  onClose,
  waypoints,
  currentWaypointIndex,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 left-16 z-30 w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E2E8F0] shadow-xl p-4 text-[#172B4D] select-none max-h-[70vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <ListOrdered className="w-4 h-4 text-[#1976D2]" />
          <div>
            <h3 className="text-xs font-bold text-[#172B4D]">Mission Waypoints</h3>
            <div className="text-[10px] text-[#5E6C84]">
              {waypoints.length} survey path coordinates
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

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {waypoints.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#5E6C84]">
            No waypoints planned yet.
          </div>
        ) : (
          waypoints.map((wp, idx) => {
            const isCurrent = idx === currentWaypointIndex;
            return (
              <div
                key={wp.id}
                className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                  isCurrent
                    ? 'bg-blue-50 border-blue-300 font-semibold'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-[#1976D2] text-white'
                        : 'bg-white border border-slate-300 text-[#5E6C84]'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="font-mono text-[11px] text-[#172B4D]">
                    {wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-[#5E6C84]">
                  {wp.altitudeAglM ?? 60}m AGL
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
