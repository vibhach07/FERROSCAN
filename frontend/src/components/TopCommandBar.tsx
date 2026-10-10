import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  CheckCircle2,
  FolderOpen,
  Wifi,
  BatteryCharging,
  Settings,
  HelpCircle,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { MissionStatus } from '../types/mission';
import { TelemetrySample } from '../types/telemetry';

import { BackendGeeStatus } from '../services/apiClient';

interface TopCommandBarProps {
  status: MissionStatus;
  currentTelemetry: TelemetrySample | null;
  geeStatus?: BackendGeeStatus | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onAbort: () => void;
  onReset: () => void;
  onOpenLibrary: () => void;
  onOpenHelp: () => void;
  onOpenGeeConfig?: () => void;
}

export const TopCommandBar: React.FC<TopCommandBarProps> = ({
  status,
  currentTelemetry,
  geeStatus,
  onStart,
  onPause,
  onResume,
  onComplete,
  onAbort,
  onReset,
  onOpenLibrary,
  onOpenHelp,
  onOpenGeeConfig,
}) => {
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);

  const batteryPercent = currentTelemetry?.batteryPercent ?? 100;
  const linkQuality = currentTelemetry?.linkQualityPercent ?? 98;
  const simulatedVoltage = (22.2 + (batteryPercent / 100) * 3.0).toFixed(1);

  return (
    <>
      <header className="h-14 bg-white border-b border-[#E2E8F0] px-4 flex items-center justify-between shadow-xs select-none z-30 shrink-0">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1976D2] flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="font-bold text-[#172B4D] tracking-tight text-sm">
                Aerial Survey Flight
              </span>
              <div className="text-[10px] text-[#5E6C84] tracking-wider uppercase font-medium">
                ANVESHAA · Airborne Magnetometry
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1 border-l border-[#E2E8F0] pl-4 text-xs font-medium">
            <button
              onClick={onReset}
              className="px-3 py-1.5 rounded-md text-[#5E6C84] hover:text-[#172B4D] hover:bg-slate-100 transition-colors"
            >
              Mission Plan
            </button>
            <button className="px-3 py-1.5 rounded-md text-[#1976D2] bg-blue-50 font-semibold transition-colors">
              Live Survey
            </button>
            <button
              onClick={onOpenLibrary}
              className="px-3 py-1.5 rounded-md text-[#5E6C84] hover:text-[#172B4D] hover:bg-slate-100 flex items-center space-x-1.5 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Survey Data Library</span>
            </button>
          </nav>
        </div>

        {/* Center: Mission Control Buttons */}
        <div className="flex items-center space-x-2">
          {status === 'READY' || status === 'PLANNED' || status === 'IDLE' ? (
            <button
              onClick={onStart}
              disabled={status === 'IDLE'}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-all ${
                status === 'IDLE'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-[#1976D2] hover:bg-[#1565C0] text-white cursor-pointer active:scale-95'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Simulation</span>
            </button>
          ) : null}

          {status === 'RUNNING' && (
            <button
              onClick={onPause}
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white flex items-center space-x-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          {status === 'PAUSED' && (
            <button
              onClick={onResume}
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[#1976D2] hover:bg-[#1565C0] text-white flex items-center space-x-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          )}

          {(status === 'RUNNING' || status === 'PAUSED' || status === 'RETURNING_HOME') && (
            <>
              <button
                onClick={onComplete}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center space-x-1.5 cursor-pointer transition-colors"
                title="Complete survey and generate CSV"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete / Land</span>
              </button>

              <button
                onClick={() => setShowAbortConfirm(true)}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 flex items-center space-x-1.5 cursor-pointer transition-colors"
                title="Emergency abort simulation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Abort</span>
              </button>
            </>
          )}

          {status === 'COMPLETED' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mission Completed</span>
              </span>
              <button
                onClick={onReset}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-[#172B4D] flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Plan New</span>
              </button>
            </div>
          )}

          {status === 'ABORTED' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-md flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Mission Aborted</span>
              </span>
              <button
                onClick={onReset}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-[#172B4D] flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Route</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Telemetry & Radio Status */}
        <div className="flex items-center space-x-4">
          {/* Radio Link Status */}
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-[#5E6C84]">
            <Wifi className={`w-3.5 h-3.5 ${linkQuality > 50 ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span className="font-medium text-[#172B4D]">RC Online</span>
            <span className="text-[11px] text-[#5E6C84]">({linkQuality}%)</span>
          </div>

          {/* Battery Status */}
          <div className="flex items-center space-x-1.5 text-xs">
            <BatteryCharging
              className={`w-4 h-4 ${
                batteryPercent > 35
                  ? 'text-emerald-500'
                  : batteryPercent > 15
                  ? 'text-amber-500'
                  : 'text-rose-500 animate-pulse'
              }`}
            />
            <span className="font-bold text-[#172B4D]">{batteryPercent}%</span>
            <span className="text-[11px] text-[#5E6C84] hidden sm:inline">
              ({simulatedVoltage}V)
            </span>
          </div>

          {/* GEE status badge */}
          {geeStatus?.initialized ? (
            <button
              onClick={onOpenGeeConfig}
              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block cursor-pointer transition-colors"
              title={`Google Earth Engine connected (${geeStatus.project_id || 'ADC'}). Real Sentinel-2 & DEM available.`}
            >
              GEE Live
            </button>
          ) : (
            <button
              onClick={onOpenGeeConfig}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block cursor-pointer transition-colors"
              title={geeStatus?.message || 'GEE credentials not configured. Click to configure.'}
            >
              GEE Standby
            </button>
          )}

          {/* Synthetic disclosure badge */}
          <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">
            Simulation
          </span>

          <div className="flex items-center space-x-1 border-l border-[#E2E8F0] pl-3">
            <button
              onClick={onOpenHelp}
              className="p-1.5 text-[#5E6C84] hover:text-[#172B4D] hover:bg-slate-100 rounded-md transition-colors"
              title="Help & Scientific Limitations"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Abort Confirmation Dialog */}
      {showAbortConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-[#E2E8F0] animate-in fade-in duration-150">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-[#172B4D]">Abort Flight Mission?</h3>
            </div>
            <p className="text-xs text-[#5E6C84] mb-4 leading-relaxed">
              This will immediately stop aircraft propulsion and finalize partial flight telemetry.
              The mission will be recorded in the local archive as <strong>ABORTED</strong> with partial
              synthetic survey data.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAbortConfirm(false)}
                className="px-4 py-2 rounded-md text-xs font-semibold text-[#5E6C84] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Continue Flight
              </button>
              <button
                onClick={() => {
                  setShowAbortConfirm(false);
                  onAbort();
                }}
                className="px-4 py-2 rounded-md text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer transition-colors"
              >
                Confirm Emergency Abort
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
