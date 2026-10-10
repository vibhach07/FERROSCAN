import React from 'react';
import { TelemetrySample } from '../types/telemetry';
import { MissionStatus } from '../types/mission';
import { Activity, Radio, Cpu, CheckCircle } from 'lucide-react';

interface PayloadStatusPanelProps {
  telemetry: TelemetrySample | null;
  status: MissionStatus;
}

export const PayloadStatusPanel: React.FC<PayloadStatusPanelProps> = ({
  telemetry,
  status,
}) => {
  const isCollecting = status === 'RUNNING' || status === 'RETURNING_HOME';
  const totalField = telemetry?.magTotalFieldNt ?? 45280.0;
  const anomaly = telemetry?.magneticAnomalyNt ?? 0.0;
  const noise = telemetry?.magnetometerNoiseNt ?? 0.0;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3.5 border border-[#E2E8F0] shadow-sm w-72 text-[#172B4D] select-none transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center space-x-1.5">
          <Activity className="w-4 h-4 text-[#1976D2]" />
          <span className="text-[11px] font-bold tracking-tight">
            Magnetometer (Simulated)
          </span>
        </div>
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
            isCollecting
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
              : 'bg-slate-50 text-[#5E6C84] border-slate-200'
          }`}
        >
          {isCollecting ? 'Acquiring' : 'Standby'}
        </span>
      </div>

      {/* Main Geophysical Channel Values */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-100">
          <div className="text-[9px] text-[#5E6C84] uppercase font-semibold">Total Field B</div>
          <div className="font-mono text-xs font-bold text-[#172B4D] mt-0.5">
            {totalField.toFixed(1)}{' '}
            <span className="text-[9px] font-normal text-[#5E6C84]">nT</span>
          </div>
        </div>

        <div className="bg-blue-50/60 p-2 rounded-lg border border-blue-100">
          <div className="text-[9px] text-[#1976D2] uppercase font-semibold">Local Anomaly ΔB</div>
          <div
            className={`font-mono text-xs font-bold mt-0.5 ${
              anomaly > 0 ? 'text-amber-700' : 'text-blue-700'
            }`}
          >
            {anomaly >= 0 ? `+${anomaly.toFixed(1)}` : anomaly.toFixed(1)}{' '}
            <span className="text-[9px] font-normal text-[#5E6C84]">nT</span>
          </div>
        </div>
      </div>

      {/* Status Indicators list */}
      <div className="space-y-1 text-[10px] text-[#5E6C84] bg-slate-50/50 p-2 rounded-lg border border-slate-100">
        <div className="flex justify-between items-center">
          <span className="flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-[#5E6C84]" />
            <span>Baseline Correction:</span>
          </span>
          <span className="font-semibold text-emerald-600">Active (Regional trend)</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="flex items-center space-x-1">
            <Radio className="w-3 h-3 text-[#5E6C84]" />
            <span>GPS Time Sync:</span>
          </span>
          <span className="font-semibold text-emerald-600">Locked (UTC)</span>
        </div>

        <div className="flex justify-between items-center">
          <span>Sensor Noise (RMS):</span>
          <span className="font-mono text-[#172B4D] font-medium">±{Math.abs(noise).toFixed(1)} nT</span>
        </div>
      </div>

      <div className="mt-2 text-[9px] text-[#5E6C84] text-center italic">
        Scalar magnetometer synthetic model
      </div>
    </div>
  );
};
