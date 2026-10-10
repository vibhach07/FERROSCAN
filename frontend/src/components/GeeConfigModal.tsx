import React, { useState } from 'react';
import {
  X,
  Globe,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Terminal,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';
import { BackendGeeStatus, getBackendGeeStatus } from '../services/apiClient';

interface GeeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: BackendGeeStatus | null;
  onStatusUpdated: (newStatus: BackendGeeStatus) => void;
}

export const GeeConfigModal: React.FC<GeeConfigModalProps> = ({
  isOpen,
  onClose,
  status,
  onStatusUpdated,
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await getBackendGeeStatus();
      if (res) {
        onStatusUpdated(res);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const authCommand = 'cd backend && .venv/bin/earthengine authenticate';

  const handleCopy = () => {
    navigator.clipboard.writeText(authCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const isLive = status?.initialized ?? false;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-6 select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-[#E2E8F0] overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 text-[#172B4D]">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-[#1976D2]'
            }`}>
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172B4D]">
                Google Earth Engine (GEE) Integration
              </h2>
              <div className="text-[11px] text-[#5E6C84]">
                Surface Optical & Digital Elevation Datasets
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Connection Status Box */}
        <div className={`p-4 rounded-xl border mb-4 ${
          isLive
            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
            : 'bg-amber-50/70 border-amber-300 text-amber-900'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 font-bold text-xs">
              {isLive ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Earth Engine Live & Connected</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Earth Engine Standby (Unauthenticated)</span>
                </>
              )}
            </div>
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-semibold text-[#172B4D] hover:bg-slate-50 flex items-center space-x-1 cursor-pointer shadow-2xs"
            >
              <RotateCcw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>

          <p className="text-[11px] leading-relaxed">
            {status?.message || 'Connecting to backend GEE service...'}
          </p>

          <div className="mt-2.5 pt-2 border-t border-black/10 flex items-center space-x-4 text-[10px] font-mono">
            <span>Project: <strong>{status?.project_id || 'Not configured'}</strong></span>
            <span>Auth Mode: <strong>{status?.auth_mode || 'adc'}</strong></span>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="space-y-3.5 text-xs">
          <div>
            <h3 className="font-bold text-[#172B4D] mb-1">
              How to enable live Google Earth Engine:
            </h3>
            <p className="text-[#5E6C84] text-[11px] leading-relaxed">
              Google Earth Engine requires a Google Cloud project with the Earth Engine API enabled.
              Follow these two quick steps to connect your credentials:
            </p>
          </div>

          {/* Step 1 */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="font-semibold text-xs text-[#172B4D] flex items-center space-x-1.5 mb-1.5">
              <span className="w-4 h-4 rounded-full bg-[#1976D2] text-white text-[10px] font-bold flex items-center justify-center">1</span>
              <span>Authenticate your Google Account via CLI</span>
            </div>
            <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] flex items-center justify-between">
              <code>{authCommand}</code>
              <button
                onClick={handleCopy}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                title="Copy command"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-[10px] text-[#5E6C84] mt-1.5">
              This opens Google's OAuth consent page in your browser and writes credentials to <code>~/.config/earthengine/credentials</code>.
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="font-semibold text-xs text-[#172B4D] flex items-center space-x-1.5 mb-1.5">
              <span className="w-4 h-4 rounded-full bg-[#1976D2] text-white text-[10px] font-bold flex items-center justify-center">2</span>
              <span>Set your Google Cloud Project ID in backend/.env</span>
            </div>
            <div className="bg-slate-100 p-2 rounded-lg font-mono text-[10px] text-slate-700">
              GEE_ENABLED=true<br />
              GEE_PROJECT_ID=your-google-cloud-project-id<br />
              GEE_AUTH_MODE=adc
            </div>
          </div>

          {/* Educational Note */}
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-[11px] text-[#172B4D] leading-relaxed">
            <div className="font-bold text-[#1976D2] mb-0.5 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Simulation Remains 100% Operational Without GEE</span>
            </div>
            When unauthenticated, the dashboard functions using high-resolution Esri satellite basemaps and OpenStreetMap.
            All autonomous flight navigation, 27-column CSV logging, and spatial magnetometer anomaly heat mapping operate fully offline.
          </div>

          {/* Links */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-[#1976D2]">
            <a
              href="https://earthengine.google.com/noncommercial/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 hover:underline"
            >
              <span>Noncommercial GEE Registration</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://developers.google.com/earth-engine/guides/access"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 hover:underline"
            >
              <span>GEE Cloud Guide</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-[#1565C0] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
