import React, { useState, useEffect, useRef } from 'react';
import { SurveySessionRecord } from '../types/archive';
import {
  getAllSurveySessions,
  deleteSurveySession,
  saveSurveySession,
} from '../services/archiveService';
import { parseAndValidateCsv, downloadCsvFile } from '../services/csvService';
import { CsvValidationReport } from '../types/processing';
import {
  X,
  Search,
  Upload,
  Download,
  Trash2,
  Play,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Database,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface SurveyDataLibraryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessSession: (session: SurveySessionRecord) => void;
}

export const SurveyDataLibraryDialog: React.FC<SurveyDataLibraryDialogProps> = ({
  isOpen,
  onClose,
  onProcessSession,
}) => {
  const [sessions, setSessions] = useState<SurveySessionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'synthetic_simulation' | 'uploaded_csv'>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadReport, setUploadReport] = useState<CsvValidationReport | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSessions = async () => {
    try {
      const records = await getAllSurveySessions();
      setSessions(records);
      if (records.length > 0 && !selectedSessionId) {
        setSelectedSessionId(records[0].id);
      }
    } catch (err) {
      console.error('Failed to load survey sessions', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.missionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource =
      filterSource === 'all' || s.dataOrigin === filterSource;
    return matchesSearch && matchesSource;
  });

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  const handleDeleteSession = async (id: string) => {
    if (confirm('Are you sure you want to delete this archived survey flight?')) {
      await deleteSurveySession(id);
      await loadSessions();
      if (selectedSessionId === id) {
        setSelectedSessionId(null);
      }
    }
  };

  const handleDownloadCsv = (session: SurveySessionRecord) => {
    downloadCsvFile(session.csvBlob, session.missionName, session.id, session.status === 'ABORTED');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      const text = await file.text();
      const { report, samples } = parseAndValidateCsv(text);
      setUploadReport(report);

      if (!report.isValid) {
        setUploadError(`CSV validation failed: ${report.errors.join('; ')}`);
        setIsUploading(false);
        return;
      }

      // Create new session record from uploaded CSV
      const newSession: SurveySessionRecord = {
        id: `UPL-${Date.now().toString(36).toUpperCase()}`,
        missionName: file.name.replace(/\.[^/.]+$/, ''),
        createdAt: new Date().toISOString(),
        status: 'COMPLETED',
        sampleCount: samples.length,
        durationSeconds: samples.length,
        distanceMeters: 0,
        bounds: report.bounds || { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 },
        aoiBoundary: [],
        waypoints: [],
        settings: {
          missionName: file.name,
          simulatedStartTimeUtc: report.dateRange?.start || new Date().toISOString(),
          altitudeAglM: 60,
          speedMps: 8,
          surveyLineSpacingM: 25,
          sampleRateHz: 1,
          nominalEnduranceMinutes: 30,
          closeLoop: false,
          simulationTimeScale: 1,
          sensorMode: 'mixed',
          randomSeed: 100,
        },
        dataOrigin: 'uploaded_csv',
        csvBlob: file,
        csvFileName: file.name,
        manifest: {
          systemVersion: 'ANVESHAA 1.0',
          isSynthetic: false,
          seed: 0,
          sensorMode: 'Uploaded External Survey Data',
          notice: 'Uploaded external dataset.',
        },
      };

      await saveSurveySession(newSession);
      await loadSessions();
      setSelectedSessionId(newSession.id);
      setIsUploading(false);
    } catch (err: any) {
      setUploadError(err.message || 'Error processing uploaded CSV');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[620px] flex flex-col border border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-14 border-b border-[#E2E8F0] px-6 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1976D2] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172B4D]">
                Survey Data Library & CSV Explorer
              </h2>
              <div className="text-[11px] text-[#5E6C84]">
                IndexedDB Local Repository · Browse and process airborne magnetometry flights
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1976D2] hover:bg-[#1565C0] text-white flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#5E6C84] hover:text-[#172B4D] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left File List + Right Detail Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Search, Filter, Session Table */}
          <div className="w-7/12 border-r border-[#E2E8F0] flex flex-col p-4 bg-white">
            {/* Search and Filters */}
            <div className="flex space-x-2 mb-3">
              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search flight ID or mission name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#1976D2]"
                />
              </div>

              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value as any)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-[#172B4D] bg-white"
              >
                <option value="all">All Sources</option>
                <option value="synthetic_simulation">Synthetic Demo</option>
                <option value="uploaded_csv">Uploaded CSV</option>
              </select>
            </div>

            {/* Session Items List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredSessions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#5E6C84]">
                  <FileSpreadsheet className="w-10 h-10 text-slate-300 mb-2" />
                  <div className="text-xs font-semibold text-[#172B4D]">No survey flights found</div>
                  <p className="text-[11px] mt-1 max-w-xs">
                    Run and complete a simulation flight on the map or click "Upload CSV" to import an external dataset.
                  </p>
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const isSelected = session.id === selectedSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            session.dataOrigin === 'synthetic_simulation'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-[#172B4D] truncate">
                            {session.missionName}
                          </div>
                          <div className="text-[10px] text-[#5E6C84] flex items-center space-x-2 mt-0.5">
                            <span>{session.id}</span>
                            <span>·</span>
                            <span>{session.sampleCount} samples</span>
                            <span>·</span>
                            <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            session.dataOrigin === 'synthetic_simulation'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {session.dataOrigin === 'synthetic_simulation' ? 'Synthetic' : 'Uploaded'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Selected Session Detail & Process CTA */}
          <div className="w-5/12 bg-slate-50/50 p-6 flex flex-col justify-between overflow-y-auto">
            {selectedSession ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold text-[#5E6C84] tracking-wider">
                      Selected Flight Record
                    </span>
                    <span className="text-[10px] font-mono text-[#1976D2] font-semibold">
                      {selectedSession.id}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#172B4D] mt-0.5">
                    {selectedSession.missionName}
                  </h3>
                </div>

                {/* Metadata summary cards */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-[#5E6C84] uppercase font-semibold">
                      Sample Count
                    </div>
                    <div className="text-sm font-bold font-mono text-[#172B4D] mt-0.5">
                      {selectedSession.sampleCount}
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-[#5E6C84] uppercase font-semibold">
                      Flight Duration
                    </div>
                    <div className="text-sm font-bold font-mono text-[#172B4D] mt-0.5">
                      {(selectedSession.durationSeconds / 60).toFixed(1)} min
                    </div>
                  </div>
                </div>

                {/* Science notice */}
                <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 text-xs text-[#172B4D] leading-relaxed">
                  <div className="font-bold text-[#1976D2] flex items-center space-x-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Spatial Processing Ready</span>
                  </div>
                  Clicking <strong>Process Data</strong> will run spatial Inverse Distance
                  Weighting (IDW) interpolation over the survey coordinates to produce an
                  exploratory relative magnetic anomaly heat map and identify high-response targets.
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => handleDownloadCsv(selectedSession)}
                    className="flex-1 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[#172B4D] flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSession(selectedSession.id)}
                    className="p-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#5E6C84]">
                Select a flight to view details
              </div>
            )}

            {/* Big Action Button */}
            {selectedSession && (
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    onProcessSession(selectedSession);
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#1976D2] hover:bg-[#1565C0] text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md cursor-pointer active:scale-98 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Process Data & Build Heat Map</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
