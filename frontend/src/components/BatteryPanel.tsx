import React from 'react';
import { Battery, Zap, Clock, ShieldCheck } from 'lucide-react';

interface BatteryPanelProps {
  batteryPercent: number;
  nominalEnduranceMinutes: number;
  elapsedSeconds: number;
}

export const BatteryPanel: React.FC<BatteryPanelProps> = ({
  batteryPercent,
  nominalEnduranceMinutes,
  elapsedSeconds,
}) => {
  const simulatedMainVoltage = (22.2 + (batteryPercent / 100) * 3.0).toFixed(1);
  const remainingSeconds = Math.max(0, nominalEnduranceMinutes * 60 * (batteryPercent / 100));
  const remainingMinutes = (remainingSeconds / 60).toFixed(1);

  // Status color evaluation
  const isHealthy = batteryPercent > 35;
  const isWarning = batteryPercent <= 35 && batteryPercent > 15;
  const isCritical = batteryPercent <= 15;

  const barColor = isHealthy
    ? 'bg-emerald-500'
    : isWarning
    ? 'bg-amber-500'
    : 'bg-rose-500 animate-pulse';

  const badgeColor = isHealthy
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : isWarning
    ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-rose-700 bg-rose-50 border-rose-200';

  return (
    <div
      className="bg-white/95 backdrop-blur-sm rounded-xl p-3.5 border border-[#E2E8F0] shadow-sm w-72 text-[#172B4D] select-none transition-all"
      title="Simulated avionics power bus and LiPo battery pack"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center space-x-1.5">
          <Battery className={`w-4 h-4 ${isHealthy ? 'text-emerald-600' : isWarning ? 'text-amber-600' : 'text-rose-600'}`} />
          <span className="text-[11px] font-bold tracking-tight">Main Power Bus</span>
        </div>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}>
          {isHealthy ? 'Nominal' : isWarning ? 'Caution' : 'Critical'}
        </span>
      </div>

      {/* Main Battery Gauge */}
      <div className="mb-2.5">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xl font-bold font-mono tracking-tight text-[#172B4D]">
            {batteryPercent.toFixed(0)}%
          </span>
          <span className="text-xs font-mono font-medium text-[#5E6C84]">
            {simulatedMainVoltage} V (6S LiPo)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.max(2, Math.min(100, batteryPercent))}%` }}
          />
        </div>
      </div>

      {/* Grid of secondary battery metrics */}
      <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2 rounded-lg border border-slate-100 text-[11px]">
        <div>
          <div className="text-[9px] text-[#5E6C84] uppercase font-semibold flex items-center space-x-1">
            <Clock className="w-2.5 h-2.5" />
            <span>Flight Endurance</span>
          </div>
          <div className="font-mono font-bold text-[#172B4D] mt-0.5">
            ~{remainingMinutes} min
          </div>
        </div>
        <div>
          <div className="text-[9px] text-[#5E6C84] uppercase font-semibold flex items-center space-x-1">
            <Zap className="w-2.5 h-2.5" />
            <span>Payload Avionics</span>
          </div>
          <div className="font-mono font-bold text-[#172B4D] mt-0.5">
            12.1 V · 100%
          </div>
        </div>
      </div>

      <div className="mt-2 text-[10px] text-[#5E6C84] text-center italic">
        Simulated battery depletion curve
      </div>
    </div>
  );
};
