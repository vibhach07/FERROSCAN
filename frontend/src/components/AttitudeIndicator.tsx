import React from 'react';
import { AircraftAttitude } from '../types/telemetry';

interface AttitudeIndicatorProps {
  attitude: AircraftAttitude;
  headingDeg: number;
}

export const AttitudeIndicator: React.FC<AttitudeIndicatorProps> = ({
  attitude,
  headingDeg,
}) => {
  const { pitchDeg, rollDeg } = attitude;

  // Pitch shift: 1 degree of pitch = 1.6 pixels vertical translation
  const pitchPixelShift = pitchDeg * 1.6;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 border border-[#E2E8F0] shadow-md flex flex-col items-center select-none w-48 transition-all">
      <div className="text-[10px] uppercase font-bold text-[#5E6C84] tracking-wider mb-1.5 flex justify-between w-full px-1">
        <span>Attitude Gyro</span>
        <span className="font-mono text-[#1976D2] font-semibold">
          {Math.round(headingDeg)}°
        </span>
      </div>

      {/* Circular Instrument Bezel */}
      <div className="relative w-36 h-36 rounded-full overflow-hidden border-3 border-slate-700 bg-slate-900 shadow-inner">
        {/* Dynamic Pitch & Roll Horizon Sphere */}
        <div
          className="absolute inset-0 transition-transform duration-100 ease-out origin-center"
          style={{
            transform: `rotate(${-rollDeg}deg)`,
          }}
        >
          {/* Horizon Background: Sky (Blue) / Ground (Brown) */}
          <div
            className="absolute -inset-10 flex flex-col transition-transform duration-100 ease-out origin-center"
            style={{
              transform: `translateY(${pitchPixelShift}px)`,
            }}
          >
            {/* Sky */}
            <div className="h-1/2 bg-sky-600 border-b-2 border-white flex flex-col justify-end items-center pb-1">
              {/* Sky pitch lines */}
              <div className="w-12 h-[1px] bg-white/70 mb-2" />
              <div className="w-8 h-[1px] bg-white/70 mb-2" />
              <div className="w-16 h-[1.5px] bg-white mb-2" />
            </div>

            {/* Ground */}
            <div className="h-1/2 bg-amber-800 flex flex-col justify-start items-center pt-1">
              {/* Ground pitch lines */}
              <div className="w-16 h-[1.5px] bg-white/80 mt-2" />
              <div className="w-8 h-[1px] bg-white/60 mt-2" />
              <div className="w-12 h-[1px] bg-white/60 mt-2" />
            </div>
          </div>
        </div>

        {/* Fixed Roll Pointer Scale (Top of instrument) */}
        <div className="absolute top-1 inset-x-0 flex justify-center pointer-events-none z-10">
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-amber-400" />
        </div>

        {/* Fixed Aircraft Reference Symbol (Wings & Dot in center) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative flex items-center">
            {/* Left wing */}
            <div className="w-8 h-[3px] bg-amber-400 border border-black/40 rounded-l" />
            {/* Center dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-black/60 mx-1.5" />
            {/* Right wing */}
            <div className="w-8 h-[3px] bg-amber-400 border border-black/40 rounded-r" />
          </div>
        </div>

        {/* Glass reflection sheen */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
      </div>

      {/* Digital Numeric Attitude Readouts */}
      <div className="flex justify-between w-full mt-2 pt-1 border-t border-slate-100 text-[10px] font-mono text-[#5E6C84]">
        <span>
          P: <strong className="text-[#172B4D]">{pitchDeg > 0 ? `+${pitchDeg.toFixed(1)}` : pitchDeg.toFixed(1)}°</strong>
        </span>
        <span>
          R: <strong className="text-[#172B4D]">{rollDeg > 0 ? `+${rollDeg.toFixed(1)}` : rollDeg.toFixed(1)}°</strong>
        </span>
        <span>
          H: <strong className="text-[#172B4D]">{Math.round(headingDeg)}°</strong>
        </span>
      </div>
    </div>
  );
};
