import React from 'react';
import { X, AlertTriangle, ExternalLink, BookOpen, Compass, Shield } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-6 select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-[#E2E8F0] overflow-y-auto max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 text-[#172B4D]">
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1976D2] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172B4D]">
                Scientific Context & Operational Guide
              </h2>
              <div className="text-[11px] text-[#5E6C84]">
                ANVESHAA Airborne Geophysical Exploration Platform
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

        {/* Prototype limitation notice */}
        <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-300 text-xs text-amber-900 leading-relaxed mb-4">
          <div className="font-bold flex items-center space-x-1.5 text-amber-800 mb-1">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Mandatory Prototype Limitation</span>
          </div>
          The built-in flight and magnetometer readings are synthetic simulations. Earth Engine layers
          are genuine surface/terrain datasets, but the displayed prospectivity index is exploratory and
          unvalidated. It is <strong>not</strong> a confirmed mineral occurrence, an ore-grade estimate,
          or a probability of finding iron ore below ground.
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-[#5E6C84]">
          <div>
            <h3 className="font-bold text-[#172B4D] text-xs mb-1">
              1. Geophysical Magnetometry Principles
            </h3>
            <p>
              Airborne magnetometers measure variations in the Earth's geomagnetic field caused by differences
              in magnetic susceptibility of subsurface rocks. The total field B (total) is the sum of the
              regional Earth field (~45,000 nT in central India), regional gradients, and localized anomalies
              produced by magnetic minerals (such as magnetite in Banded Iron Formations).
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#172B4D] text-xs mb-1">
              2. Hematite vs Magnetite Sensitivity
            </h3>
            <p>
              Magnetite possesses strong magnetic susceptibility (kappa approx 0.1 to 1.0 SI) and generates
              conspicuous anomalies (+400 to +2000 nT). In contrast, hematite (Fe2O3), which is
              the dominant high-grade ore in Indian deposits such as Bailadila, possesses very low magnetic
              susceptibility. A magnetometer alone cannot reliably detect all hematitic ore bodies without
              corroborating geological mapping, gravity surveys, and drilling.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#172B4D] text-xs mb-1">
              3. Study Area Context: Bailadila Iron Ore Range
            </h3>
            <p>
              The default demonstrator map is centered near Bailadila Range / Kirandul, Dantewada district,
              Chhattisgarh, India (~18.615°N, 81.231°E). NMDC operates premier iron ore complexes here with
              world-class high-grade hematite deposits. The demo coordinates are for illustrative context only
              and do not represent official mine lease boundaries or confidential drill records.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#172B4D] text-xs mb-1">
              4. External References & Official Data
            </h3>
            <div className="space-y-1 text-[11px] text-[#1976D2]">
              <a
                href="https://www.nmdc.co.in/about-nmdc/operating-mines/bailadila-iron-ore-mine-bacheli-complex"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 hover:underline"
              >
                <span>NMDC Bailadila Iron Ore Mine, Bacheli Complex</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 hover:underline"
              >
                <span>Google Earth Engine — Sentinel-2 L2A Surface Reflectance</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-[#1565C0] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
