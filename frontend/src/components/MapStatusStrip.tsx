import React from 'react';
import { TelemetrySample } from '../types/telemetry';
import { LatLng } from '../types/mission';
import { Navigation, Gauge, Wifi, MapPin, Milestone } from 'lucide-react';

interface MapStatusStripProps {
  telemetry: TelemetrySample | null;
  homeCoord: LatLng | null;
  totalWaypoints: number;
}

export const MapStatusStrip: React.FC<MapStatusStripProps> = ({
  telemetry,
  homeCoord,
  totalWaypoints,
}) => {
  const lat = telemetry
    ? telemetry.latitude.toFixed(6)
    : homeCoord
    ? homeCoord.lat.toFixed(6)
    : '—';
  const lng = telemetry
    ? telemetry.longitude.toFixed(6)
    : homeCoord
    ? homeCoord.lng.toFixed(6)
    : '—';

  const speed = telemetry ? telemetry.groundSpeedMps.toFixed(1) : '0.0';
  const linkQuality = telemetry ? telemetry.linkQualityPercent : 98;
  const distanceTravelled = telemetry ? telemetry.distanceTravelledM.toFixed(0) : '0';
  const currentWp = telemetry ? telemetry.waypointIndex + 1 : 0;

  return (
    <div className="h-9 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-4 flex items-center justify-between text-xs text-[#172B4D] select-none shadow-xs z-10">
      {/* Left: Aircraft identifier & Coordinates */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 font-semibold text-[#1976D2]">
          <Navigation className="w-3.5 h-3.5 fill-current" />
          <span>Survey UAV · simulated</span>
        </div>

        <div className="h-3.5 w-[1px] bg-slate-200" />

        <div className="flex items-center space-x-1.5 font-mono text-[11px] text-[#5E6C84]">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span>
            {lat}° N, {lng}° E
          </span>
        </div>
      </div>

      {/* Right: Key metrics */}
      <div className="flex items-center space-x-6 text-[11px] text-[#5E6C84]">
        <div className="flex items-center space-x-1">
          <Gauge className="w-3.5 h-3.5 text-slate-400" />
          <span>Speed:</span>
          <strong className="text-[#172B4D] font-mono">{speed} m/s</strong>
        </div>

        <div className="flex items-center space-x-1">
          <Milestone className="w-3.5 h-3.5 text-slate-400" />
          <span>Odometer:</span>
          <strong className="text-[#172B4D] font-mono">{distanceTravelled} m</strong>
        </div>

        <div className="flex items-center space-x-1">
          <Wifi className="w-3.5 h-3.5 text-emerald-500" />
          <span>Link:</span>
          <strong className="text-[#172B4D] font-mono">{linkQuality}%</strong>
        </div>

        <div className="flex items-center space-x-1 border-l border-slate-200 pl-4">
          <span>Waypoints:</span>
          <strong className="text-[#1976D2] font-mono">
            {currentWp} / {totalWaypoints}
          </strong>
        </div>
      </div>
    </div>
  );
};
