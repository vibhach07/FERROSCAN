import React from 'react';
import { TelemetrySample } from '../types/telemetry';
import { MissionStatus } from '../types/mission';
import { Navigation, Clock, Gauge, ArrowUpRight } from 'lucide-react';

interface TelemetryPanelProps {
  telemetry: TelemetrySample | null;
  status: MissionStatus;
  elapsedSeconds: number;
  totalWaypoints: number;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  telemetry,
  status,
  elapsedSeconds,
  totalWaypoints,
}) => {
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentWpIndex = telemetry ? telemetry.waypointIndex + 1 : 0;
  const statusDisplay =
    status === 'RUNNING'
      ? `FLYING TO WP ${currentWpIndex.toString().padStart(2, '0')}`
      : status === 'RETURNING_HOME'
      ? 'RETURNING HOME'
      : status;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3.5 border border-[#E2E8F0] shadow-sm w-72 text-[#172B4D] select-none transition-all">
      {/* Header with RTK fix and SIMULATION badge */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-700 tracking-wide">
            {telemetry?.gpsFixStatus || 'Simulated RTK FIX'}
          </span>
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#1976D2] border border-blue-200 uppercase tracking-wider">
          Simulation
        </span>
      </div>

      {/* Flight status and Timer */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] text-[#5E6C84] uppercase font-semibold tracking-wider">
            Flight Status
          </div>
          <div className="text-xs font-bold text-[#172B4D] mt-0.5">
            {statusDisplay}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[#5E6C84] uppercase font-semibold tracking-wider flex items-center justify-end space-x-1">
            <Clock className="w-3 h-3" />
            <span>Mission Time</span>
          </div>
          <div className="font-mono text-sm font-bold text-[#1976D2]">
            {formatTime(elapsedSeconds)}
          </div>
        </div>
      </div>

      {/* Grid of flight parameters */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 text-center">
        <div>
          <div className="text-[9px] text-[#5E6C84] uppercase font-semibold">Speed</div>
          <div className="text-xs font-bold text-[#172B4D] mt-0.5 font-mono">
            {telemetry ? `${telemetry.groundSpeedMps.toFixed(1)}` : '0.0'}{' '}
            <span className="text-[9px] font-normal text-[#5E6C84]">m/s</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] text-[#5E6C84] uppercase font-semibold">Alt AGL</div>
          <div className="text-xs font-bold text-[#172B4D] mt-0.5 font-mono">
            {telemetry ? `${telemetry.altitudeAglM.toFixed(0)}` : '60'}{' '}
            <span className="text-[9px] font-normal text-[#5E6C84]">m</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] text-[#5E6C84] uppercase font-semibold">Heading</div>
          <div className="text-xs font-bold text-[#172B4D] mt-0.5 font-mono">
            {telemetry ? `${telemetry.headingDeg.toFixed(0)}°` : '0°'}
          </div>
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-[#5E6C84]">
        <span>
          Dist from Home:{' '}
          <strong className="text-[#172B4D] font-mono">
            {telemetry ? `${telemetry.distanceFromHomeM.toFixed(0)}m` : '0m'}
          </strong>
        </span>
        <span>
          Waypoints:{' '}
          <strong className="text-[#172B4D] font-mono">
            {currentWpIndex}/{totalWaypoints}
          </strong>
        </span>
      </div>
    </div>
  );
};
