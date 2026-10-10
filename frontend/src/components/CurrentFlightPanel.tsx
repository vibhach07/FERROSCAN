import React, { useState } from 'react';
import {
  MissionSettings,
  MissionStatus,
  SensorMode,
  Waypoint,
} from '../types/mission';
import { TelemetrySample } from '../types/telemetry';
import {
  Sliders,
  Plane,
  Home,
  Pause,
  Play,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Compass,
  ArrowUp,
  ArrowDown,
  Anchor,
  Clock,
  Layers,
} from 'lucide-react';

interface CurrentFlightPanelProps {
  status: MissionStatus;
  settings: MissionSettings;
  waypoints: Waypoint[];
  totalDistanceMeters: number;
  telemetry: TelemetrySample | null;
  isLoitering: boolean;
  onUpdateSettings: (newSettings: Partial<MissionSettings>) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReturnHome: () => void;
  onComplete: () => void;
  onTargetAltitudeChange: (alt: number) => void;
  onToggleLoiter: (loiter: boolean) => void;
  onTimeScaleChange: (scale: 1 | 2 | 5) => void;
}

export const CurrentFlightPanel: React.FC<CurrentFlightPanelProps> = ({
  status,
  settings,
  waypoints,
  totalDistanceMeters,
  telemetry,
  isLoitering,
  onUpdateSettings,
  onStart,
  onPause,
  onResume,
  onReturnHome,
  onComplete,
  onTargetAltitudeChange,
  onToggleLoiter,
  onTimeScaleChange,
}) => {
  const [targetAltInput, setTargetAltInput] = useState<number>(settings.altitudeAglM);

  const currentAgl = telemetry ? telemetry.altitudeAglM : settings.altitudeAglM;
  const currentMsl = telemetry ? telemetry.altitudeMslM : 685 + settings.altitudeAglM;
  const estimatedFlightTimeMinutes =
    settings.speedMps > 0 ? (totalDistanceMeters / settings.speedMps / 60).toFixed(1) : '0';

  const isClosedLoop =
    waypoints.length > 2 &&
    Math.abs(waypoints[0].lat - waypoints[waypoints.length - 1].lat) < 1e-6 &&
    Math.abs(waypoints[0].lng - waypoints[waypoints.length - 1].lng) < 1e-6;

  const handleApplyAltitude = () => {
    onTargetAltitudeChange(targetAltInput);
  };

  return (
    <aside className="w-80 bg-white border-l border-[#E2E8F0] h-full overflow-y-auto flex flex-col p-4 space-y-4 select-none shrink-0 shadow-xs text-[#172B4D]">
      {/* 1. Header: Current Flight Details */}
      <div className="pb-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-[#5E6C84] tracking-wider">
            Flight Operation
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              status === 'RUNNING'
                ? 'bg-emerald-100 text-emerald-800'
                : status === 'PAUSED'
                ? 'bg-amber-100 text-amber-800'
                : status === 'COMPLETED'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {status}
          </span>
        </div>
        <h2 className="text-sm font-bold text-[#172B4D] mt-1 truncate">
          {settings.missionName}
        </h2>
        <div className="text-[11px] text-[#5E6C84] mt-0.5 flex items-center space-x-1.5">
          <Plane className="w-3 h-3 text-[#1976D2]" />
          <span>Survey UAV · Magnetometer Payload</span>
        </div>
      </div>

      {/* 2. Primary Flight Controls Shortcuts */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
        <div className="text-[10px] uppercase font-bold text-[#5E6C84] tracking-wider">
          Flight Automation
        </div>
        <div className="grid grid-cols-2 gap-2">
          {status === 'READY' || status === 'PLANNED' ? (
            <button
              onClick={onStart}
              className="col-span-2 py-2 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer active:scale-98 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Mission</span>
            </button>
          ) : status === 'RUNNING' ? (
            <button
              onClick={onPause}
              className="py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer transition-all"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          ) : status === 'PAUSED' ? (
            <button
              onClick={onResume}
              className="py-2 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          ) : null}

          {(status === 'RUNNING' || status === 'PAUSED') && (
            <button
              onClick={onReturnHome}
              className="py-2 bg-slate-200 hover:bg-slate-300 text-[#172B4D] rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return Home</span>
            </button>
          )}

          {/* Loiter / Hold Button */}
          {(status === 'RUNNING' || status === 'PAUSED') && (
            <button
              onClick={() => onToggleLoiter(!isLoitering)}
              className={`col-span-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all cursor-pointer ${
                isLoitering
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-[#5E6C84] border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Anchor className="w-3.5 h-3.5" />
              <span>{isLoitering ? 'Holding Position (Loiter)' : 'Hold at Current Position'}</span>
            </button>
          )}
        </div>

        {/* Playback speed multiplier */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#5E6C84] flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Sim Speed:</span>
          </span>
          <div className="flex space-x-1 bg-white p-0.5 rounded border border-slate-200">
            {([1, 2, 5] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => onTimeScaleChange(spd)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                  settings.simulationTimeScale === spd
                    ? 'bg-[#1976D2] text-white'
                    : 'text-[#5E6C84] hover:bg-slate-100'
                }`}
              >
                {spd}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Altitude Adjustment Section */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[#5E6C84] tracking-wider">
          <span>Altitude Control</span>
          <span className="font-mono text-[#1976D2] font-semibold">
            AGL {currentAgl.toFixed(0)}m / MSL {currentMsl?.toFixed(0)}m
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#5E6C84]">Target AGL:</span>
            <span className="font-mono font-bold text-[#172B4D]">{targetAltInput} m</span>
          </div>

          <input
            type="range"
            min={20}
            max={150}
            step={5}
            value={targetAltInput}
            onChange={(e) => setTargetAltInput(Number(e.target.value))}
            className="w-full accent-[#1976D2] cursor-pointer"
          />

          <div className="flex space-x-1.5 pt-1">
            <button
              onClick={() => setTargetAltInput((prev) => Math.max(20, prev - 10))}
              className="flex-1 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-[#5E6C84] hover:bg-slate-100 flex items-center justify-center space-x-1 cursor-pointer"
            >
              <ArrowDown className="w-3 h-3" />
              <span>-10m</span>
            </button>
            <button
              onClick={() => setTargetAltInput((prev) => Math.min(150, prev + 10))}
              className="flex-1 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-[#5E6C84] hover:bg-slate-100 flex items-center justify-center space-x-1 cursor-pointer"
            >
              <ArrowUp className="w-3 h-3" />
              <span>+10m</span>
            </button>
            <button
              onClick={handleApplyAltitude}
              className="px-3 py-1 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded text-xs font-semibold cursor-pointer transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* 4. Mission Settings Configuration */}
      <div className="space-y-2.5">
        <div className="text-[10px] uppercase font-bold text-[#5E6C84] tracking-wider flex items-center space-x-1">
          <Sliders className="w-3 h-3" />
          <span>Mission Parameters</span>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <label className="text-[11px] text-[#5E6C84] block mb-0.5">
              Survey Flight Speed (m/s)
            </label>
            <input
              type="number"
              min={2}
              max={20}
              value={settings.speedMps}
              onChange={(e) => onUpdateSettings({ speedMps: Number(e.target.value) })}
              disabled={status === 'RUNNING'}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-1 focus:ring-[#1976D2] outline-hidden disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#5E6C84] block mb-0.5">
              Survey Line Spacing (meters)
            </label>
            <input
              type="number"
              min={10}
              max={100}
              value={settings.surveyLineSpacingM}
              onChange={(e) => onUpdateSettings({ surveyLineSpacingM: Number(e.target.value) })}
              disabled={status === 'RUNNING'}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-1 focus:ring-[#1976D2] outline-hidden disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#5E6C84] block mb-0.5">
              Synthetic Sensor Mineralogy Mode
            </label>
            <select
              value={settings.sensorMode}
              onChange={(e) => onUpdateSettings({ sensorMode: e.target.value as SensorMode })}
              disabled={status === 'RUNNING'}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-[#1976D2] outline-hidden disabled:bg-slate-100"
            >
              <option value="mixed">Mixed BIF / Hematite-Magnetite</option>
              <option value="magnetite_like_strong">Strong Magnetite-Like (+800 nT)</option>
              <option value="hematite_like_weak">Weak Hematite-Like (+120 nT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Mission Summary & Closed Loop Validation */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
        <div className="text-[10px] uppercase font-bold text-[#5E6C84] tracking-wider mb-1">
          Route Validation
        </div>
        <div className="flex justify-between">
          <span className="text-[#5E6C84]">Planned Distance:</span>
          <span className="font-mono font-semibold text-[#172B4D]">
            {(totalDistanceMeters / 1000).toFixed(2)} km
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#5E6C84]">Total Waypoints:</span>
          <span className="font-mono font-semibold text-[#172B4D]">{waypoints.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#5E6C84]">Est. Flight Duration:</span>
          <span className="font-mono font-semibold text-[#172B4D]">
            ~{estimatedFlightTimeMinutes} min
          </span>
        </div>

        <div className="pt-2 border-t border-slate-200 flex items-center space-x-1.5 text-[11px]">
          {isClosedLoop ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-emerald-700 font-medium">
                Closed-loop verified (Origin = Destination)
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-amber-700 font-medium">Open route (Manual Waypoints)</span>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
