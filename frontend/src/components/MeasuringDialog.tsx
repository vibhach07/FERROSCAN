import React from 'react';
import { LatLng } from '../types/mission';
import { calculatePolygonAreaM2 } from '../map/geoUtils';
import { X, Ruler, Square, Milestone, Clock } from 'lucide-react';

interface MeasuringDialogProps {
  isOpen: boolean;
  onClose: () => void;
  aoiBoundary: LatLng[];
  totalDistanceMeters: number;
  waypointCount: number;
  speedMps: number;
}

export const MeasuringDialog: React.FC<MeasuringDialogProps> = ({
  isOpen,
  onClose,
  aoiBoundary,
  totalDistanceMeters,
  waypointCount,
  speedMps,
}) => {
  if (!isOpen) return null;

  const areaM2 = calculatePolygonAreaM2(aoiBoundary);
  const areaHectares = (areaM2 / 10000).toFixed(2);
  const totalKm = (totalDistanceMeters / 1000).toFixed(2);
  const estMinutes = speedMps > 0 ? (totalDistanceMeters / speedMps / 60).toFixed(1) : '0';

  return (
    <div className="absolute top-16 left-16 z-30 w-72 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E2E8F0] shadow-xl p-4 text-[#172B4D] select-none animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Ruler className="w-4 h-4 text-[#1976D2]" />
          <h3 className="text-xs font-bold text-[#172B4D]">Survey Spatial Geometry</h3>
        </div>
        <button
          onClick={onClose}
          className="text-[#5E6C84] hover:text-[#172B4D] p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="text-[10px] text-[#5E6C84] uppercase font-semibold flex items-center space-x-1">
            <Square className="w-3 h-3" />
            <span>Survey Footprint Area</span>
          </div>
          <div className="font-mono text-sm font-bold text-[#172B4D] mt-0.5">
            {areaHectares} ha{' '}
            <span className="text-[11px] font-normal text-[#5E6C84]">
              ({Math.round(areaM2).toLocaleString()} m²)
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="text-[10px] text-[#5E6C84] uppercase font-semibold flex items-center space-x-1">
            <Milestone className="w-3 h-3" />
            <span>Total Flight Distance</span>
          </div>
          <div className="font-mono text-sm font-bold text-[#172B4D] mt-0.5">
            {totalKm} km{' '}
            <span className="text-[11px] font-normal text-[#5E6C84]">
              ({Math.round(totalDistanceMeters)} m)
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="text-[10px] text-[#5E6C84] uppercase font-semibold flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Nominal Duration</span>
          </div>
          <div className="font-mono text-sm font-bold text-[#172B4D] mt-0.5">
            ~{estMinutes} minutes{' '}
            <span className="text-[11px] font-normal text-[#5E6C84]">
              (@ {speedMps} m/s)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
