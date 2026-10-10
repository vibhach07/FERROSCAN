import React, { useState } from 'react';
import {
  Activity,
  Compass,
  Navigation2,
  Gauge,
  Radio,
  Zap,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  Satellite,
  ShieldCheck,
} from 'lucide-react';
import { TelemetrySample, AircraftAttitude } from '../types/telemetry';
import { MissionStatus, MissionSettings } from '../types/mission';

interface DroneSensorStatusTabProps {
  telemetry: TelemetrySample | null;
  attitude: AircraftAttitude;
  status: MissionStatus;
  settings: MissionSettings;
  isGeeLive: boolean;
  activeGeeLayerName: string | null;
}

export const DroneSensorStatusTab: React.FC<DroneSensorStatusTabProps> = ({
  telemetry,
  attitude,
  status,
  settings,
  isGeeLive,
  activeGeeLayerName,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const isAirborne = status === 'RUNNING' || status === 'PAUSED' || status === 'RETURNING_HOME';
  const batteryPct = telemetry?.batteryPercent ?? 100;
  const totalField = telemetry?.magTotalFieldNt ?? 48250.0;
  const anomaly = telemetry?.magneticAnomalyNt ?? 0.0;
  const gradient = (anomaly / Math.max(1, telemetry?.altitudeAglM ?? settings.altitudeAglM)) * 0.15;
  const agl = telemetry?.altitudeAglM ?? settings.altitudeAglM;
  const speed = telemetry?.groundSpeedMps ?? (isAirborne ? settings.speedMps : 0);
  const heading = telemetry?.headingDeg ?? attitude.yawDeg ?? 0;

  return (
    <div className="absolute bottom-11 right-3 z-30 select-none font-sans pointer-events-auto">
      {/* 1. COLLAPSED TAB BUTTON */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex items-center space-x-2.5 bg-slate-950/90 hover:bg-slate-900 backdrop-blur-md text-white px-3.5 py-2 rounded-xl border border-cyan-500/40 shadow-xl hover:border-cyan-400 transition-all cursor-pointer hover:shadow-cyan-500/20"
          title="Click to expand Drone Sensor Telemetry Sidebar"
        >
          {/* Status Indicator Dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>

          <div className="flex flex-col text-left">
            <div className="flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-bold tracking-wider text-slate-100 uppercase">
                Drone Sensors
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 rounded-full font-bold">
                6/6 LOCK
              </span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono flex items-center space-x-2 mt-0.5">
              <span>MAG: {totalField.toFixed(0)} nT</span>
              <span>&bull;</span>
              <span>RTK FIX</span>
              <span>&bull;</span>
              <span>AGL: {agl.toFixed(0)}m</span>
            </div>
          </div>

          <div className="pl-1 text-cyan-400 group-hover:text-cyan-300">
            <ChevronUp className="w-4 h-4" />
          </div>
        </button>
      ) : (
        /* 2. EXPANDED SENSOR STATUS SIDEBAR DRAWER */
        <div className="w-[390px] bg-slate-950/95 backdrop-blur-xl rounded-2xl border border-cyan-500/40 shadow-2xl p-4 text-slate-100 max-h-[82vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-3 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-xs">
                <Cpu className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-black tracking-wider uppercase text-cyan-300">
                    Avionics & Sensor Suite
                  </h3>
                  <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                    ONLINE
                  </span>
                </div>
                <p className="text-[9px] text-slate-400">
                  Real-Time Drone Subsystem Health & Diagnostics
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Minimize Sensor Sidebar"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* 1. Quantum Cesium Magnetometer */}
            <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold text-[11px] text-slate-200">
                    Cesium Magnetometer
                  </span>
                </div>
                <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
                  10 Hz SYNC
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">Total Field (B₀)</div>
                  <div className="font-bold text-cyan-300">{totalField.toFixed(1)} nT</div>
                </div>
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">Anomaly (ΔB)</div>
                  <div
                    className={`font-bold ${
                      Math.abs(anomaly) > 200 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {anomaly >= 0 ? `+${anomaly.toFixed(1)}` : anomaly.toFixed(1)} nT
                  </div>
                </div>
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">Vert. Grad</div>
                  <div className="font-bold text-amber-300">
                    {gradient >= 0 ? `+${gradient.toFixed(2)}` : gradient.toFixed(2)} nT/m
                  </div>
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>Noise: ±0.4 nT RMS</span>
                <span className="text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-2.5 h-2.5 inline" />
                  <span>AOA Compensated</span>
                </span>
              </div>
            </div>

            {/* 2. RTK GNSS Receiver */}
            <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Navigation2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-bold text-[11px] text-slate-200">
                    Dual RTK GNSS Receiver
                  </span>
                </div>
                <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800 font-bold">
                  RTK FIXED (28 SVs)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">Precision</div>
                  <div className="font-bold text-emerald-300">±1.8 cm</div>
                </div>
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">HDOP</div>
                  <div className="font-bold text-slate-200">0.72</div>
                </div>
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">Ground Speed</div>
                  <div className="font-bold text-cyan-300">{speed.toFixed(1)} m/s</div>
                </div>
              </div>
              <div className="mt-1.5 text-[9px] text-slate-400 font-mono flex justify-between">
                <span>Constellations: GPS + GAL + BDS</span>
                <span className="text-slate-300 font-semibold">{(speed * 3.6).toFixed(1)} km/h</span>
              </div>
            </div>

            {/* 3. Tactical IMU & AHRS */}
            <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-[11px] text-slate-200">
                    Tactical IMU & AHRS
                  </span>
                </div>
                <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                  FOG CLASS
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">Pitch</div>
                  <div className="font-bold text-slate-200">{attitude.pitchDeg.toFixed(1)}°</div>
                </div>
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">Roll</div>
                  <div className="font-bold text-slate-200">{attitude.rollDeg.toFixed(1)}°</div>
                </div>
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">Yaw / True Hdg</div>
                  <div className="font-bold text-amber-300">{heading.toFixed(1)}°</div>
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>Vibration Index: 0.08 g</span>
                <span className="text-emerald-400">Drift &lt; 0.02°/h</span>
              </div>
            </div>

            {/* 4. LiDAR & Radar Altimeter */}
            <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-[11px] text-slate-200">
                    LiDAR / Radar Altimeter
                  </span>
                </div>
                <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">
                  AGL LOCKED
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">AGL Clearance</div>
                  <div className="font-bold text-emerald-400">{agl.toFixed(1)} m</div>
                </div>
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">Target AGL</div>
                  <div className="font-bold text-slate-200">{settings.altitudeAglM} m</div>
                </div>
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">Vert. Rate</div>
                  <div className="font-bold text-cyan-300">
                    {(telemetry?.verticalSpeedMps ?? 0).toFixed(2)} m/s
                  </div>
                </div>
              </div>
              <div className="mt-1.5 text-[9px] text-slate-400 font-mono flex justify-between">
                <span>Terrain Tracking: Active</span>
                <span className="text-emerald-400 font-semibold">Envelope: Safe</span>
              </div>
            </div>

            {/* 5. GEE Multispectral Link */}
            <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Satellite className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-bold text-[11px] text-slate-200">
                    GEE Multispectral Link
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold ${
                    isGeeLive
                      ? 'bg-purple-950 text-purple-300 border-purple-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isGeeLive ? 'GEE CLOUD SYNC' : 'LOCAL SPECTRAL'}
                </span>
              </div>

              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-[10px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400 text-[8px] uppercase font-sans">Active Filter</span>
                  <span className="font-mono text-cyan-300 font-semibold truncate max-w-[200px]">
                    {activeGeeLayerName || 'Basemap Default'}
                  </span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>Bands: NIR (B8), Red (B4), SWIR2 (B12)</span>
                  <span className="text-emerald-400">Cloud: &lt;20%</span>
                </div>
              </div>
            </div>

            {/* 6. Power Bus & Failsafe */}
            <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-[11px] text-slate-200">
                    Avionics Power & Battery Bus
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    batteryPct > 25
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {batteryPct.toFixed(0)}% REMAINING
                </span>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-1.5 mb-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    batteryPct > 40
                      ? 'bg-emerald-500'
                      : batteryPct > 20
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, batteryPct))}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">Pack Voltage</div>
                  <div className="font-bold text-slate-200">25.2 V</div>
                </div>
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">Current Draw</div>
                  <div className="font-bold text-amber-300">14.2 A</div>
                </div>
                <div>
                  <div className="text-[8px] text-slate-400 uppercase font-sans">Core Temp</div>
                  <div className="font-bold text-emerald-300">38.2 °C</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Avionics Heartbeat: 100 Hz</span>
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
            >
              Minimize Tab &darr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default DroneSensorStatusTab;
