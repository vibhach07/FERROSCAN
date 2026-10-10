import React from 'react';
import { Sparkles, MapPin, Compass, Play, X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDemo: () => void;
  onPlanNew: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onLoadDemo,
  onPlanNew,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-6 select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1976D2] text-white flex items-center justify-center shadow-xs">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172B4D]">
                ANVESHAA Airborne Survey Simulator
              </h2>
              <div className="text-xs text-[#5E6C84]">
                Autonomous UAV Magnetometry & Iron-Ore Prospecting Console
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#5E6C84] leading-relaxed mb-5">
          Welcome to the ANVESHAA Airborne Survey Flight system. This operational dashboard simulates
          a magnetometer-equipped UAV flying automated boustrophedon transects, recording synthetic
          geophysical scalar data, and generating exploratory spatial prospectivity heat maps.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Choice 1: Demo Mission */}
          <div
            onClick={() => {
              onLoadDemo();
              onClose();
            }}
            className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#1976D2] text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[#172B4D]">Load Demo Mission</h3>
              <p className="text-[11px] text-[#5E6C84] mt-1 leading-normal">
                Bailadila Iron Range area, closed-loop lawnmower grid, and planted synthetic target anomaly.
              </p>
            </div>
            <div className="mt-3 text-xs font-bold text-[#1976D2] flex items-center space-x-1">
              <span>Launch Demo</span>
              <Play className="w-3 h-3 fill-current" />
            </div>
          </div>

          {/* Choice 2: Plan New Survey */}
          <div
            onClick={() => {
              onPlanNew();
              onClose();
            }}
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#172B4D] flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[#172B4D]">Plan Custom Survey</h3>
              <p className="text-[11px] text-[#5E6C84] mt-1 leading-normal">
                Draw your own survey boundary polygon anywhere on the globe and generate flight paths.
              </p>
            </div>
            <div className="mt-3 text-xs font-bold text-[#5E6C84] flex items-center space-x-1">
              <span>Start Planning</span>
            </div>
          </div>
        </div>

        {/* Prototype disclosure alert */}
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-[10px] text-amber-900 leading-normal">
          <strong>Scientific Notice:</strong> Flight telemetry and magnetometer channels in this
          demonstrator are synthetic. Surface satellite imagery is provided for geospatial context.
          The relative prospectivity index is an unvalidated exploratory model, not confirmed mineralisation.
        </div>
      </div>
    </div>
  );
};
