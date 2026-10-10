import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  LatLng,
  MissionSettings,
  MissionStatus,
  Waypoint,
} from './types/mission';
import { AircraftAttitude, TelemetrySample } from './types/telemetry';
import { ProspectivityResult } from './types/processing';
import { SurveySessionRecord } from './types/archive';
import { FlightSimulator } from './simulation/flightSimulator';
import {
  DEFAULT_MISSION_SETTINGS,
  buildDemoMission,
  DEMO_SURVEY_BOUNDARY,
} from './simulation/demoScenario';
import { generateLawnmowerRoute } from './map/routeGeneration';
import { calculateBounds, createBufferedBoundingPolygon } from './map/geoUtils';
import {
  createTelemetryCsvBlob,
  downloadCsvFile,
} from './services/csvService';
import { saveSurveySession } from './services/archiveService';
import { interpolateSurveyData } from './services/prospectivityService';

// UI Components
import { TopCommandBar } from './components/TopCommandBar';
import { LeftToolRail } from './components/LeftToolRail';
import { MapWorkspace } from './components/MapWorkspace';
import { TelemetryPanel } from './components/TelemetryPanel';
import { BatteryPanel } from './components/BatteryPanel';
import { PayloadStatusPanel } from './components/PayloadStatusPanel';
import { AttitudeIndicator } from './components/AttitudeIndicator';
import { MapStatusStrip } from './components/MapStatusStrip';
import { CurrentFlightPanel } from './components/CurrentFlightPanel';
import { SurveyDataLibraryDialog } from './components/SurveyDataLibraryDialog';
import { ProspectivityResultsPanel } from './components/ProspectivityResultsPanel';
import { WelcomeModal } from './components/WelcomeModal';
import { HelpModal } from './components/HelpModal';
import { LayerControl } from './components/LayerControl';
import { WaypointsDialog } from './components/WaypointsDialog';
import { MeasuringDialog } from './components/MeasuringDialog';
import { GeeConfigModal } from './components/GeeConfigModal';
import { JetEngineHeatmapLegend } from './components/JetEngineHeatmapLegend';
import { DroneSensorStatusTab } from './components/DroneSensorStatusTab';
import { SpectralFilterToolbar } from './components/SpectralFilterToolbar';
import { ColormapType } from './utils/jetColorScale';

import {
  checkBackendHealth,
  getBackendGeeStatus,
  fetchGeeLayers,
  BackendGeeStatus,
  BackendGeeLayerMetadata,
} from './services/apiClient';
import { BailadilaLandmark } from './simulation/bailadilaLandmarks';

export function App() {
  // Mission and geometry state
  const [missionStatus, setMissionStatus] = useState<MissionStatus>('READY');
  const [settings, setSettings] = useState<MissionSettings>({ ...DEFAULT_MISSION_SETTINGS });
  const [aoiBoundary, setAoiBoundary] = useState<LatLng[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [totalRouteDistanceMeters, setTotalRouteDistanceMeters] = useState<number>(0);

  // GEE status & layers
  const [geeStatus, setGeeStatus] = useState<BackendGeeStatus | null>(null);
  const [geeLayers, setGeeLayers] = useState<BackendGeeLayerMetadata[]>([]);
  const [activeGeeLayerName, setActiveGeeLayerName] = useState<string | null>(
    'Sentinel-2 False-Color NIR (B8/B4/B3)'
  );
  const [isRefreshingGee, setIsRefreshingGee] = useState<boolean>(false);

  // Live telemetry state
  const [currentTelemetry, setCurrentTelemetry] = useState<TelemetrySample | null>(null);
  const [attitude, setAttitude] = useState<AircraftAttitude>({ pitchDeg: 0, rollDeg: 0, yawDeg: 0 });
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetrySample[]>([]);
  const [isLoitering, setIsLoitering] = useState<boolean>(false);

  // Geospatial & Processing state
  const [processedResult, setProcessedResult] = useState<ProspectivityResult | null>(null);
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'osm' | 'terrain' | 'gee_rgb'>('satellite');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showFlownTrail, setShowFlownTrail] = useState<boolean>(true);
  const [showWaypoints, setShowWaypoints] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showMineLandmarks, setShowMineLandmarks] = useState<boolean>(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.75);
  const [colormap, setColormap] = useState<ColormapType>('jet_engine');

  // Interactive drawing modes
  const [isDrawingBoundary, setIsDrawingBoundary] = useState<boolean>(false);
  const [isDrawingManualRoute, setIsDrawingManualRoute] = useState<boolean>(false);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState<number>(0);

  // Modals & Drawers
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(true);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isGeeConfigOpen, setIsGeeConfigOpen] = useState<boolean>(false);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState<boolean>(false);
  const [isWaypointsListOpen, setIsWaypointsListOpen] = useState<boolean>(false);
  const [isMeasuringOpen, setIsMeasuringOpen] = useState<boolean>(false);

  // Flight simulator engine ref
  const simulatorRef = useRef<FlightSimulator | null>(null);
  const activeFlightIdRef = useRef<string>(`FLT-BAILADILA-${Date.now().toString(36).toUpperCase()}`);

  // Auto-save completed flight session to IndexedDB & trigger download
  const handleSaveFlightSession = useCallback(
    async (samples: TelemetrySample[], isAborted: boolean = false) => {
      if (samples.length === 0) return;

      const flightId = activeFlightIdRef.current;
      const csvBlob = createTelemetryCsvBlob(samples);
      const bounds = calculateBounds(samples.map((s) => ({ lat: s.latitude, lng: s.longitude })));

      const sessionRecord: SurveySessionRecord = {
        id: flightId,
        missionName: settings.missionName,
        createdAt: new Date().toISOString(),
        status: isAborted ? 'ABORTED' : 'COMPLETED',
        sampleCount: samples.length,
        durationSeconds: samples[samples.length - 1]?.simulationElapsedS || 0,
        distanceMeters: samples[samples.length - 1]?.distanceTravelledM || 0,
        bounds,
        aoiBoundary,
        waypoints: waypoints.map((w) => ({ lat: w.lat, lng: w.lng })),
        settings: { ...settings },
        dataOrigin: 'synthetic_simulation',
        csvBlob,
        csvFileName: `${settings.missionName}_${flightId}.csv`,
        manifest: {
          systemVersion: 'ANVESHAA 1.0',
          isSynthetic: true,
          seed: settings.randomSeed,
          sensorMode: settings.sensorMode,
          notice: 'Synthetic demonstration survey data.',
        },
      };

      try {
        await saveSurveySession(sessionRecord);
      } catch (err) {
        console.error('Failed to save survey to IndexedDB', err);
      }

      // Download CSV
      downloadCsvFile(csvBlob, settings.missionName, flightId, isAborted);
    },
    [settings, aoiBoundary, waypoints]
  );

  // Initialize flight simulator
  useEffect(() => {
    simulatorRef.current = new FlightSimulator(settings, {
      onTelemetryTick: (sample, att) => {
        setCurrentTelemetry(sample);
        setAttitude(att);
        setTelemetryHistory((prev) => [...prev, sample]);
      },
      onStateChange: (newStatus) => {
        setMissionStatus(newStatus);
      },
      onMissionCompleted: (samples) => {
        handleSaveFlightSession(samples, false);
      },
      onMissionAborted: (samples) => {
        handleSaveFlightSession(samples, true);
      },
    });

    // Load initial demo mission on mount
    handleLoadDemoMission();

    // Check GEE backend status & auto-fetch live GEE satellite layers
    getBackendGeeStatus().then(async (res) => {
      if (res) {
        setGeeStatus(res);
        if (res.initialized) {
          const layersRes = await fetchGeeLayers(DEMO_SURVEY_BOUNDARY);
          if (layersRes && layersRes.layers.length > 0) {
            setGeeLayers(layersRes.layers);
            setActiveGeeLayerName((prev) => prev || layersRes.layers[0].name);
          }
        }
      }
    });
  }, []);

  // Load Bailadila demo survey
  const handleLoadDemoMission = useCallback(() => {
    const demo = buildDemoMission();
    setAoiBoundary(demo.boundary);
    setWaypoints(demo.waypoints);
    setTotalRouteDistanceMeters(demo.totalDistanceMeters);
    setTelemetryHistory([]);
    setCurrentTelemetry(null);
    setProcessedResult(null);
    setIsDrawingBoundary(false);
    setIsDrawingManualRoute(false);

    activeFlightIdRef.current = `FLT-BAILADILA-${Date.now().toString(36).toUpperCase()}`;

    if (simulatorRef.current) {
      simulatorRef.current.setMission(demo.waypoints, settings, activeFlightIdRef.current);
    }
    setFitBoundsTrigger((prev) => prev + 1);

    // Refresh GEE layers for demo boundary
    if (geeStatus?.initialized) {
      fetchGeeLayers(demo.boundary).then((res) => {
        if (res && res.layers.length > 0) {
          setGeeLayers(res.layers);
        }
      });
    }
  }, [settings, geeStatus]);

  // Select landmark AOI preset
  const handleSelectLandmarkAoi = useCallback(
    (landmark: BailadilaLandmark) => {
      if (!landmark.pitBoundary) return;
      setAoiBoundary(landmark.pitBoundary);
      const result = generateLawnmowerRoute(
        landmark.pitBoundary,
        settings.surveyLineSpacingM,
        settings.closeLoop,
        settings.altitudeAglM
      );
      setWaypoints(result.waypoints);
      setTotalRouteDistanceMeters(result.totalDistanceMeters);
      setTelemetryHistory([]);
      setCurrentTelemetry(null);
      setProcessedResult(null);
      setIsDrawingBoundary(false);
      setIsDrawingManualRoute(false);

      activeFlightIdRef.current = `FLT-${landmark.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      if (simulatorRef.current) {
        simulatorRef.current.setMission(result.waypoints, settings, activeFlightIdRef.current);
      }
      setFitBoundsTrigger((prev) => prev + 1);

      // Refresh GEE layers for landmark boundary if live
      if (geeStatus?.initialized) {
        fetchGeeLayers(landmark.pitBoundary).then((res) => {
          if (res && res.layers.length > 0) {
            setGeeLayers(res.layers);
          }
        });
      }
    },
    [settings, geeStatus]
  );

  // Determine effective polygon for GEE layer clipping:
  // 1. If custom aoiBoundary has >= 3 points, clip to user-drawn boundary polygon
  // 2. If manual waypoints has >= 2 points, compute buffered corridor polygon enclosing dedicated flight path
  // 3. Otherwise, clip to pre-decided Bailadila demo survey boundary
  const getEffectiveAreaBoundary = useCallback((): LatLng[] => {
    if (aoiBoundary.length >= 3) {
      return aoiBoundary;
    }
    if (waypoints.length >= 2) {
      return createBufferedBoundingPolygon(waypoints.map((w) => ({ lat: w.lat, lng: w.lng })));
    }
    return DEMO_SURVEY_BOUNDARY;
  }, [aoiBoundary, waypoints]);

  const effectiveAreaDescription = useMemo(() => {
    if (aoiBoundary.length >= 3) {
      return `Custom Boundary (${aoiBoundary.length} pts)`;
    }
    if (waypoints.length >= 2) {
      return `Flight Path Corridor (${waypoints.length} WPs)`;
    }
    return 'Bailadila Deposit 14 (Demo)';
  }, [aoiBoundary, waypoints]);

  const refreshGeeLayersForArea = useCallback(
    async (customArea?: LatLng[]) => {
      if (!geeStatus?.initialized) return;
      setIsRefreshingGee(true);
      try {
        const area = customArea || getEffectiveAreaBoundary();
        const res = await fetchGeeLayers(area);
        if (res && res.layers.length > 0) {
          setGeeLayers(res.layers);
          setActiveGeeLayerName((prev) => {
            if (prev && res.layers.some((l) => l.name === prev)) return prev;
            return res.layers[0].name;
          });
        }
      } catch (err) {
        console.error('Failed to update GEE layers for custom area:', err);
      } finally {
        setIsRefreshingGee(false);
      }
    },
    [geeStatus, getEffectiveAreaBoundary]
  );

  // Auto-sync GEE layers when custom boundary or manual flight path points change
  useEffect(() => {
    if (!geeStatus?.initialized) return;
    if (aoiBoundary.length < 3 && waypoints.length < 2) return;

    const timer = setTimeout(() => {
      refreshGeeLayersForArea();
    }, 1200);

    return () => clearTimeout(timer);
  }, [aoiBoundary, waypoints, geeStatus?.initialized, refreshGeeLayersForArea]);

  // Regenerate lawnmower grid
  const handleGenerateGrid = useCallback(() => {
    if (aoiBoundary.length < 3) {
      alert('Please draw a closed survey boundary polygon first.');
      return;
    }
    const result = generateLawnmowerRoute(
      aoiBoundary,
      settings.surveyLineSpacingM,
      settings.closeLoop,
      settings.altitudeAglM
    );
    setWaypoints(result.waypoints);
    setTotalRouteDistanceMeters(result.totalDistanceMeters);
    setTelemetryHistory([]);
    setCurrentTelemetry(null);

    activeFlightIdRef.current = `FLT-${Date.now().toString(36).toUpperCase()}`;

    if (simulatorRef.current) {
      simulatorRef.current.setMission(result.waypoints, settings, activeFlightIdRef.current);
    }
    setFitBoundsTrigger((prev) => prev + 1);
    refreshGeeLayersForArea(aoiBoundary);
  }, [aoiBoundary, settings, refreshGeeLayersForArea]);

  // Handle map clicks in drawing modes
  const handleMapClick = useCallback(
    (coord: LatLng) => {
      if (isDrawingBoundary) {
        setAoiBoundary((prev) => [...prev, coord]);
      } else if (isDrawingManualRoute) {
        setWaypoints((prev) => {
          const nextIndex = prev.length;
          const newWp: Waypoint = {
            id: `WP-${(nextIndex + 1).toString().padStart(2, '0')}`,
            index: nextIndex,
            lat: coord.lat,
            lng: coord.lng,
            altitudeAglM: settings.altitudeAglM,
          };
          const updated = [...prev, newWp];
          if (simulatorRef.current) {
            simulatorRef.current.setMission(updated, settings, activeFlightIdRef.current);
          }
          return updated;
        });
      }
    },
    [isDrawingBoundary, isDrawingManualRoute, settings]
  );

  // Simulation controls
  const handleStartSimulation = () => {
    if (waypoints.length < 2) {
      alert('Cannot start flight: please generate or plan at least 2 waypoints.');
      return;
    }
    simulatorRef.current?.startSimulation();
  };

  const handlePauseSimulation = () => {
    simulatorRef.current?.pauseSimulation();
  };

  const handleResumeSimulation = () => {
    simulatorRef.current?.resumeSimulation();
  };

  const handleReturnHome = () => {
    simulatorRef.current?.returnToHome();
  };

  const handleCompleteMission = () => {
    simulatorRef.current?.completeMission();
  };

  const handleAbortSimulation = () => {
    simulatorRef.current?.abortSimulation();
  };

  const handleResetMission = () => {
    simulatorRef.current?.setMission(waypoints, settings, activeFlightIdRef.current);
    setTelemetryHistory([]);
    setCurrentTelemetry(null);
  };

  const handleToggleLoiter = (loiter: boolean) => {
    setIsLoitering(loiter);
    simulatorRef.current?.setLoiter(loiter);
  };

  const handleTargetAltitudeChange = (alt: number) => {
    simulatorRef.current?.setTargetAltitude(alt);
    setSettings((prev) => ({ ...prev, altitudeAglM: alt }));
  };

  const handleTimeScaleChange = (scale: 1 | 2 | 5) => {
    simulatorRef.current?.setTimeScale(scale);
    setSettings((prev) => ({ ...prev, simulationTimeScale: scale }));
  };

  // Process data from archive session or current completed flight
  const handleProcessSession = useCallback(
    (session: SurveySessionRecord) => {
      try {
        // Read CSV from blob
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          // Dynamically process
          import('./services/csvService').then(({ parseAndValidateCsv }) => {
            const { samples } = parseAndValidateCsv(text);
            if (samples.length === 0) {
              alert('No valid samples to process in this file.');
              return;
            }
            const result = interpolateSurveyData(
              samples,
              session.aoiBoundary,
              undefined,
              session.id,
              session.missionName
            );
            setProcessedResult(result);
            setShowHeatmap(true);
            setFitBoundsTrigger((prev) => prev + 1);
          });
        };
        reader.readAsText(session.csvBlob);
      } catch (err) {
        console.error('Error processing session', err);
      }
    },
    []
  );

  const activeGeeTileUrl = activeGeeLayerName
    ? geeLayers.find((l) => l.name === activeGeeLayerName)?.tile_url_template || null
    : null;

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#F5F7FA]">
      {/* 1. Top Fixed Command Bar */}
      <TopCommandBar
        status={missionStatus}
        currentTelemetry={currentTelemetry}
        geeStatus={geeStatus}
        onStart={handleStartSimulation}
        onPause={handlePauseSimulation}
        onResume={handleResumeSimulation}
        onComplete={handleCompleteMission}
        onAbort={handleAbortSimulation}
        onReset={handleResetMission}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenGeeConfig={() => setIsGeeConfigOpen(true)}
      />

      {/* 2. Main Workspace Body (Tool Rail + Map Area + Right Control Panel) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left vertical tool rail */}
        <LeftToolRail
          isDrawingBoundary={isDrawingBoundary}
          isDrawingManualRoute={isDrawingManualRoute}
          isLayersPanelOpen={isLayersPanelOpen}
          isWaypointsListOpen={isWaypointsListOpen}
          isMeasuringOpen={isMeasuringOpen}
          onToggleDrawingBoundary={() => {
            setIsDrawingBoundary((prev) => {
              const next = !prev;
              if (!next && aoiBoundary.length >= 3) {
                refreshGeeLayersForArea(aoiBoundary);
              }
              return next;
            });
            setIsDrawingManualRoute(false);
          }}
          onToggleDrawingManualRoute={() => {
            setIsDrawingManualRoute((prev) => {
              const next = !prev;
              if (!next && waypoints.length >= 2) {
                refreshGeeLayersForArea();
              }
              return next;
            });
            setIsDrawingBoundary(false);
          }}
          onGenerateGrid={handleGenerateGrid}
          onToggleLayersPanel={() => setIsLayersPanelOpen((prev) => !prev)}
          onToggleWaypointsList={() => setIsWaypointsListOpen((prev) => !prev)}
          onToggleMeasuring={() => setIsMeasuringOpen((prev) => !prev)}
          onFitMapBounds={() => setFitBoundsTrigger((prev) => prev + 1)}
          onLoadDemoMission={handleLoadDemoMission}
        />

        {/* Center: Map Canvas Workspace */}
        <main className="flex-1 relative h-full overflow-hidden">
          <MapWorkspace
            aoiBoundary={aoiBoundary}
            waypoints={waypoints}
            telemetry={currentTelemetry}
            telemetryHistory={telemetryHistory}
            processedResult={processedResult}
            activeLayer={activeLayer}
            activeGeeTileUrl={activeGeeTileUrl}
            showHeatmap={showHeatmap}
            showFlownTrail={showFlownTrail}
            showWaypoints={showWaypoints}
            showLabels={showLabels}
            showMineLandmarks={showMineLandmarks}
            colormap={colormap}
            heatmapOpacity={heatmapOpacity}
            isDrawingBoundary={isDrawingBoundary}
            isDrawingManualRoute={isDrawingManualRoute}
            fitBoundsTrigger={fitBoundsTrigger}
            onMapClick={handleMapClick}
            onSelectLandmarkAoi={handleSelectLandmarkAoi}
          />

          {/* Floating Upper-Left Telemetry Cards */}
          <div className="absolute top-4 left-4 z-10 flex flex-col md:flex-row gap-3 pointer-events-auto">
            <TelemetryPanel
              telemetry={currentTelemetry}
              status={missionStatus}
              elapsedSeconds={currentTelemetry?.simulationElapsedS ?? 0}
              totalWaypoints={waypoints.length}
            />
            <BatteryPanel
              batteryPercent={currentTelemetry?.batteryPercent ?? 100}
              nominalEnduranceMinutes={settings.nominalEnduranceMinutes}
              elapsedSeconds={currentTelemetry?.simulationElapsedS ?? 0}
            />
            <PayloadStatusPanel
              telemetry={currentTelemetry}
              status={missionStatus}
            />
          </div>

          {/* Floating Upper-Right Spectral Vegetation & Mineral Filter Toolbar */}
          <SpectralFilterToolbar
            geeLayers={geeLayers}
            activeGeeLayer={activeGeeLayerName}
            onSelectGeeLayer={setActiveGeeLayerName}
            areaDescription={effectiveAreaDescription}
            onRefreshArea={() => refreshGeeLayersForArea()}
            isRefreshing={isRefreshingGee}
            isGeeLive={geeStatus?.initialized ?? false}
            onOpenLayersPanel={() => setIsLayersPanelOpen(true)}
          />

          {/* Floating Bottom-Left Attitude Gyro Instrument */}
          <div className="absolute bottom-12 left-4 z-10 pointer-events-auto">
            <AttitudeIndicator
              attitude={attitude}
              headingDeg={currentTelemetry?.headingDeg ?? 0}
            />
          </div>

          {/* Floating Prospectivity Results Panel (when processed) */}
          {processedResult && (
            <ProspectivityResultsPanel
              result={processedResult}
              opacity={heatmapOpacity}
              onOpacityChange={setHeatmapOpacity}
              onClose={() => setProcessedResult(null)}
            />
          )}

          {/* Floating Jet Engine Thermal Heatmap HUD Legend */}
          <JetEngineHeatmapLegend
            result={processedResult}
            isVisible={showHeatmap && !!processedResult}
            opacity={heatmapOpacity}
            onOpacityChange={setHeatmapOpacity}
            colormap={colormap}
            onColormapChange={setColormap}
            onFocusPeakHotspot={() => setFitBoundsTrigger((prev) => prev + 1)}
          />

          {/* Bottom-Right Small Tab: Live Drone Sensor Diagnostics Sidebar */}
          <DroneSensorStatusTab
            telemetry={currentTelemetry}
            attitude={attitude}
            status={missionStatus}
            settings={settings}
            isGeeLive={geeStatus?.initialized ?? false}
            activeGeeLayerName={activeGeeLayerName}
          />

          {/* Floating Tool Drawers */}
          <LayerControl
            isOpen={isLayersPanelOpen}
            onClose={() => setIsLayersPanelOpen(false)}
            activeLayer={activeLayer}
            onSelectBaseLayer={setActiveLayer}
            showHeatmap={showHeatmap}
            onToggleHeatmap={setShowHeatmap}
            showFlownTrail={showFlownTrail}
            onToggleFlownTrail={setShowFlownTrail}
            showWaypoints={showWaypoints}
            onToggleWaypoints={setShowWaypoints}
            showLabels={showLabels}
            onToggleLabels={setShowLabels}
            showMineLandmarks={showMineLandmarks}
            onToggleMineLandmarks={setShowMineLandmarks}
            onSelectLandmarkAoi={handleSelectLandmarkAoi}
            heatmapOpacity={heatmapOpacity}
            onOpacityChange={setHeatmapOpacity}
            geeLayers={geeLayers}
            activeGeeLayer={activeGeeLayerName}
            onSelectGeeLayer={setActiveGeeLayerName}
            onOpenGeeConfig={() => setIsGeeConfigOpen(true)}
            isGeeLive={geeStatus?.initialized ?? false}
            areaDescription={effectiveAreaDescription}
            onRefreshGeeArea={() => refreshGeeLayersForArea()}
          />

          <WaypointsDialog
            isOpen={isWaypointsListOpen}
            onClose={() => setIsWaypointsListOpen(false)}
            waypoints={waypoints}
            currentWaypointIndex={currentTelemetry?.waypointIndex ?? 0}
          />

          <MeasuringDialog
            isOpen={isMeasuringOpen}
            onClose={() => setIsMeasuringOpen(false)}
            aoiBoundary={aoiBoundary}
            totalDistanceMeters={totalRouteDistanceMeters}
            waypointCount={waypoints.length}
            speedMps={settings.speedMps}
          />

          {/* Bottom Map Status Strip */}
          <div className="absolute bottom-0 inset-x-0 z-10 pointer-events-auto">
            <MapStatusStrip
              telemetry={currentTelemetry}
              homeCoord={waypoints[0] || null}
              totalWaypoints={waypoints.length}
            />
          </div>
        </main>

        {/* Right: Current Flight Panel */}
        <CurrentFlightPanel
          status={missionStatus}
          settings={settings}
          waypoints={waypoints}
          totalDistanceMeters={totalRouteDistanceMeters}
          telemetry={currentTelemetry}
          isLoitering={isLoitering}
          onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
          onStart={handleStartSimulation}
          onPause={handlePauseSimulation}
          onResume={handleResumeSimulation}
          onReturnHome={handleReturnHome}
          onComplete={handleCompleteMission}
          onTargetAltitudeChange={handleTargetAltitudeChange}
          onToggleLoiter={handleToggleLoiter}
          onTimeScaleChange={handleTimeScaleChange}
        />
      </div>

      {/* Modals */}
      <SurveyDataLibraryDialog
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onProcessSession={handleProcessSession}
      />

      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        onLoadDemo={handleLoadDemoMission}
        onPlanNew={() => {
          setAoiBoundary([]);
          setWaypoints([]);
          setIsDrawingBoundary(true);
        }}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <GeeConfigModal
        isOpen={isGeeConfigOpen}
        onClose={() => setIsGeeConfigOpen(false)}
        status={geeStatus}
        onStatusUpdated={(s) => setGeeStatus(s)}
      />
    </div>
  );
}

export default App;
