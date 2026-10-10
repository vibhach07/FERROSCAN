import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  Marker,
  Popup,
  CircleMarker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { LatLng, Waypoint } from '../types/mission';
import { TelemetrySample } from '../types/telemetry';
import { ProspectivityResult, CandidateHotspot } from '../types/processing';
import { BAILADILA_LANDMARKS, BailadilaLandmark } from '../simulation/bailadilaLandmarks';
import { getJetHex, ColormapType, getProbabilityTier } from '../utils/jetColorScale';

// Fix Leaflet standard marker icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Jet Engine Afterburner Shock Diamond Target Marker for hotspots
function createAfterburnerHotspotIcon(h: CandidateHotspot, isPeak: boolean) {
  if (isPeak) {
    return L.divIcon({
      className: 'jet-peak-hotspot',
      html: `
        <div style="position: relative; width: 0; height: 0; pointer-events: auto;">
          <!-- Concentric expanding afterburner shockwave rings -->
          <div class="afterburner-ring-1" style="position: absolute; width: 80px; height: 80px; border-radius: 50%; border: 2.5px solid #FF2200; box-shadow: 0 0 18px #FF2200; pointer-events: none;"></div>
          <div class="afterburner-ring-2" style="position: absolute; width: 56px; height: 56px; border-radius: 50%; border: 2px solid #FFD700; box-shadow: 0 0 14px #FFD700; pointer-events: none;"></div>
          
          <!-- Tactical reticle crosshairs -->
          <div style="position: absolute; transform: translate(-50%, -50%); width: 40px; height: 40px; border: 1.5px dashed rgba(255, 255, 255, 0.9); border-radius: 50%; pointer-events: none;"></div>
          <div style="position: absolute; transform: translate(-50%, -50%); width: 48px; height: 1px; background: rgba(255, 255, 255, 0.6); pointer-events: none;"></div>
          <div style="position: absolute; transform: translate(-50%, -50%); width: 1px; height: 48px; background: rgba(255, 255, 255, 0.6); pointer-events: none;"></div>

          <!-- Incandescent White-Hot Core -->
          <div class="shock-core-glow" style="position: absolute; width: 22px; height: 22px; background: radial-gradient(circle, #FFFFFF 45%, #FFEE55 75%, #FF2200 100%); border: 2px solid #FFFFFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px #FFFFFF, 0 0 28px #FF2200; cursor: pointer;">
            <div style="width: 6px; height: 6px; background: #FF0055; border-radius: 50%;"></div>
          </div>

          <!-- HUD Callout Badge -->
          <div style="position: absolute; top: 18px; left: 50%; transform: translateX(-50%); background: rgba(5, 7, 26, 0.94); color: #FFFFFF; padding: 2px 7px; border-radius: 6px; font-size: 9px; font-weight: 900; border: 1.5px solid #FF3B30; box-shadow: 0 4px 12px rgba(0,0,0,0.8); white-space: nowrap; letter-spacing: 0.5px;">
            <span style="color: #FF3B30;">🎯 PEAK TARGET #1</span> &bull; <span style="color: #FFE600;">${h.compositeIndex.toFixed(0)}% Fe</span>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }

  // Secondary candidate hotspots (#2 to #5)
  return L.divIcon({
    className: 'jet-secondary-hotspot',
    html: `
      <div style="position: relative; width: 0; height: 0; pointer-events: auto;">
        <div style="position: absolute; transform: translate(-50%, -50%); width: 28px; height: 28px; background: #FF5400; border: 2px solid #FFFFFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #FFFFFF; box-shadow: 0 2px 10px rgba(255, 84, 0, 0.7); cursor: pointer;">
          #${h.rank}
        </div>
        <div style="position: absolute; top: 16px; left: 50%; transform: translateX(-50%); background: rgba(8, 12, 28, 0.92); color: #FFFFFF; padding: 1px 5px; border-radius: 4px; font-size: 8px; font-weight: 700; border: 1px solid rgba(255,255,255,0.4); white-space: nowrap;">
          ${h.compositeIndex.toFixed(0)}% Fe
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// Custom landmark badge icon for Bailadila mining deposits
function createLandmarkIcon(category: string, name: string) {
  let bgColor = '#D97706'; // Amber for mine pit
  let iconSvg = '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />';
  if (category === 'processing_plant') {
    bgColor = '#2563EB'; // Blue
    iconSvg = '<path d="M2 20h20M7 20V10l5 5V6l7 7v7" />';
  } else if (category === 'peak') {
    bgColor = '#059669'; // Emerald
    iconSvg = '<path d="m8 3 4 8 5-5 5 14H2L8 3z" />';
  }

  return L.divIcon({
    className: 'landmark-pin',
    html: `
      <div style="background: ${bgColor}; color: #FFFFFF; padding: 3px 7px; border-radius: 6px; font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.5); border: 1.5px solid #FFFFFF; white-space: nowrap; pointer-events: auto; transform: translate(-50%, -100%);">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>
        <span>${name}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// Custom aircraft SVG icon rotated by heading
function createAircraftIcon(headingDeg: number) {
  return L.divIcon({
    className: 'aircraft-marker',
    html: `
      <div style="transform: rotate(${headingDeg}deg); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="#1976D2" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Custom waypoint numbered icon
function createWaypointIcon(index: number, isCurrent: boolean) {
  const bg = isCurrent ? '#1976D2' : '#FFFFFF';
  const text = isCurrent ? '#FFFFFF' : '#172B4D';
  const border = isCurrent ? '#FFFFFF' : '#1976D2';

  return L.divIcon({
    className: 'waypoint-marker',
    html: `
      <div style="background-color: ${bg}; color: ${text}; border: 2px solid ${border}; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.4);">
        ${index + 1}
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

// Map Event Handler for drawing
function MapClickHandler({
  isDrawingBoundary,
  isDrawingRoute,
  onMapClick,
}: {
  isDrawingBoundary: boolean;
  isDrawingRoute: boolean;
  onMapClick: (coord: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      if (isDrawingBoundary || isDrawingRoute) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

// Controller to fit bounds when requested
function MapViewController({
  bounds,
  triggerFit,
}: {
  bounds: LatLng[];
  triggerFit: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds.length > 1 && triggerFit > 0) {
      const leafletBounds = L.latLngBounds(bounds.map((p) => [p.lat, p.lng]));
      map.fitBounds(leafletBounds, { padding: [50, 50], animate: true });
    }
  }, [triggerFit, bounds, map]);
  return null;
}

interface MapWorkspaceProps {
  aoiBoundary: LatLng[];
  waypoints: Waypoint[];
  telemetry: TelemetrySample | null;
  telemetryHistory: TelemetrySample[];
  processedResult: ProspectivityResult | null;
  activeLayer: 'satellite' | 'osm' | 'terrain' | 'gee_rgb';
  activeGeeTileUrl?: string | null;
  showHeatmap: boolean;
  showFlownTrail: boolean;
  showWaypoints: boolean;
  showLabels?: boolean;
  showMineLandmarks?: boolean;
  colormap?: ColormapType;
  heatmapOpacity: number;
  isDrawingBoundary: boolean;
  isDrawingManualRoute: boolean;
  fitBoundsTrigger: number;
  onMapClick: (coord: LatLng) => void;
  onSelectLandmarkAoi?: (landmark: BailadilaLandmark) => void;
}

export const MapWorkspace: React.FC<MapWorkspaceProps> = ({
  aoiBoundary,
  waypoints,
  telemetry,
  telemetryHistory,
  processedResult,
  activeLayer,
  activeGeeTileUrl,
  showHeatmap,
  showFlownTrail,
  showWaypoints,
  showLabels = true,
  showMineLandmarks = true,
  colormap = 'jet_engine',
  heatmapOpacity,
  isDrawingBoundary,
  isDrawingManualRoute,
  fitBoundsTrigger,
  onMapClick,
  onSelectLandmarkAoi,
}) => {
  const center = useMemo(() => {
    if (waypoints.length > 0) return [waypoints[0].lat, waypoints[0].lng] as [number, number];
    if (aoiBoundary.length > 0) return [aoiBoundary[0].lat, aoiBoundary[0].lng] as [number, number];
    return [18.6080, 81.2275] as [number, number]; // Bailadila Deposit 14 open-cast pit default
  }, [waypoints, aoiBoundary]);

  const aircraftPos = useMemo(() => {
    if (telemetry) return [telemetry.latitude, telemetry.longitude] as [number, number];
    if (waypoints.length > 0) return [waypoints[0].lat, waypoints[0].lng] as [number, number];
    return null;
  }, [telemetry, waypoints]);

  const flownTrailCoords = useMemo(() => {
    return telemetryHistory.map((s) => [s.latitude, s.longitude] as [number, number]);
  }, [telemetryHistory]);

  const plannedRouteCoords = useMemo(() => {
    return waypoints.map((w) => [w.lat, w.lng] as [number, number]);
  }, [waypoints]);

  const aoiCoords = useMemo(() => {
    return aoiBoundary.map((p) => [p.lat, p.lng] as [number, number]);
  }, [aoiBoundary]);

  // Color generator for heat map cells
  const getCellColor = (index: number) => {
    // 0-100 index ramp: blue -> cyan -> green -> yellow -> red
    if (index < 25) return '#1E3A8A'; // Deep blue
    if (index < 45) return '#06B6D4'; // Cyan
    if (index < 65) return '#10B981'; // Green
    if (index < 85) return '#F59E0B'; // Amber / Yellow
    return '#EF4444';                // High Red / Hotspot
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900">
      <MapContainer
        center={center}
        zoom={16}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <MapClickHandler
          isDrawingBoundary={isDrawingBoundary}
          isDrawingRoute={isDrawingManualRoute}
          onMapClick={onMapClick}
        />
        <MapViewController
          bounds={aoiBoundary.length > 0 ? aoiBoundary : waypoints}
          triggerFit={fitBoundsTrigger}
        />

        {/* Base Tile Layers */}
        {activeLayer === 'satellite' ? (
          <TileLayer
            attribution="&copy; Google Satellite Imagery"
            url="https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            subdomains={['0', '1', '2', '3']}
            maxZoom={20}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {/* Live Google Earth Engine Tile Layer (when active) */}
        {activeGeeTileUrl && (
          <TileLayer
            key={activeGeeTileUrl}
            attribution="Google Earth Engine &copy; Copernicus Sentinel-2 / USGS"
            url={activeGeeTileUrl}
            maxZoom={19}
            opacity={0.9}
          />
        )}

        {/* Transparent Geographic Labels Layer (places, towns, roads, terrain names) */}
        {showLabels && (
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            maxZoom={19}
            zIndex={450}
          />
        )}

        {/* 1. Survey Area Polygon */}
        {aoiCoords.length > 2 && (
          <Polygon
            positions={aoiCoords}
            pathOptions={{
              color: '#3B82F6',
              weight: 2,
              dashArray: '6, 6',
              fillColor: '#3B82F6',
              fillOpacity: 0.1,
            }}
          />
        )}

        {/* 2. Planned Lawnmower / Polyline Route */}
        {plannedRouteCoords.length > 1 && (
          <Polyline
            positions={plannedRouteCoords}
            pathOptions={{
              color: '#F59E0B',
              weight: 2,
              opacity: 0.7,
              dashArray: '4, 4',
            }}
          />
        )}

        {/* 3. Flown Trail Path */}
        {showFlownTrail && flownTrailCoords.length > 1 && (
          <Polyline
            positions={flownTrailCoords}
            pathOptions={{
              color: '#10B981',
              weight: 3,
              opacity: 0.9,
            }}
          />
        )}

        {/* 4. Interpolated Prospectivity Heat Map (Jet Engine Exhaust Plume) */}
        {showHeatmap &&
          processedResult &&
          processedResult.cells.map((cell, idx) => {
            const hex = getJetHex(cell.compositeIndex / 100, colormap);
            const isWhiteHot = cell.compositeIndex >= 90;
            const isHighHeat = cell.compositeIndex >= 75;

            return (
              <CircleMarker
                key={`cell-${idx}`}
                center={[cell.lat, cell.lng]}
                radius={isWhiteHot ? 15 : isHighHeat ? 14 : 13}
                pathOptions={{
                  color: isWhiteHot ? '#FFFFFF' : isHighHeat ? '#FF8800' : 'transparent',
                  weight: isWhiteHot ? 2 : isHighHeat ? 1 : 0,
                  fillColor: hex,
                  fillOpacity: Math.min(1.0, heatmapOpacity + (isWhiteHot ? 0.2 : 0)),
                }}
              >
                <Popup>
                  <div className="text-xs p-1 min-w-[210px]">
                    <div className="font-black text-[#172B4D] flex items-center justify-between">
                      <span>Thermal Jet Prospectivity</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{
                          backgroundColor: hex,
                          color: cell.compositeIndex > 60 ? (cell.compositeIndex > 90 ? '#990000' : '#000000') : '#FFFFFF',
                        }}
                      >
                        {cell.compositeIndex.toFixed(1)}% Fe
                      </span>
                    </div>

                    <div className="text-[10px] text-rose-600 font-extrabold mt-1 uppercase tracking-wide">
                      {getProbabilityTier(cell.compositeIndex).label}
                    </div>

                    <div className="text-[11px] text-[#5E6C84] mt-1.5 space-y-1">
                      <div className="flex justify-between">
                        <span>Magnetic Anomaly:</span>
                        <strong className="text-slate-800">+{cell.anomalyNt.toFixed(1)} nT</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Relative Fe Probability:</span>
                        <strong className="text-slate-800">{cell.compositeIndex.toFixed(1)} / 100</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Nearest Flight Sample:</span>
                        <span>{cell.nearestSampleDistM.toFixed(0)}m</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                        {cell.lat.toFixed(5)}°N, {cell.lng.toFixed(5)}°E
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* 5. Top Candidate Hotspots (Afterburner Shock Diamonds) */}
        {showHeatmap &&
          processedResult &&
          processedResult.hotspots.map((h) => (
            <Marker
              key={h.id}
              position={[h.lat, h.lng]}
              icon={createAfterburnerHotspotIcon(h, h.rank === 1)}
              zIndexOffset={h.rank === 1 ? 800 : 700}
            >
              <Popup>
                <div className="text-xs p-1 min-w-[220px]">
                  <div className="font-bold text-rose-700 flex items-center justify-between">
                    <span>
                      {h.rank === 1 ? '🎯 Peak Iron Hotspot #1' : `Hotspot Candidate #${h.rank}`}
                    </span>
                    <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-black text-[10px]">
                      {h.compositeIndex.toFixed(1)}% Fe
                    </span>
                  </div>

                  <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                    {h.rank === 1 ? 'White-Hot Core Afterburner Epicenter' : 'High Susceptibility Anomaly'}
                  </div>

                  <div className="text-[11px] text-[#5E6C84] mt-1.5 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Planted Anomaly Peak:</span>
                      <strong className="text-rose-600">+{h.anomalyNt.toFixed(1)} nT</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Probability Score:</span>
                      <strong>{h.compositeIndex.toFixed(1)} / 100</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence Distance:</span>
                      <span>~{h.nearestSampleDistM.toFixed(0)}m</span>
                    </div>
                    <div className="text-[9px] text-amber-800 italic pt-1 border-t border-slate-100">
                      Planted synthetic exploration signal &bull; High Fe Ore Potential
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 6. Waypoint Numbered Markers */}
        {showWaypoints &&
          waypoints.map((wp, idx) => (
            <Marker
              key={wp.id}
              position={[wp.lat, wp.lng]}
              icon={createWaypointIcon(
                idx,
                telemetry?.waypointIndex === idx
              )}
            >
              <Popup>
                <div className="text-xs p-1">
                  <div className="font-bold text-[#172B4D]">{wp.id}</div>
                  <div className="text-[11px] text-[#5E6C84] mt-0.5">
                    {wp.lat.toFixed(6)}, {wp.lng.toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 6.5 Bailadila Mining Complex Landmark POIs & Mine Pits */}
        {showMineLandmarks &&
          BAILADILA_LANDMARKS.map((landmark) => (
            <React.Fragment key={landmark.id}>
              {landmark.pitBoundary && (
                <Polygon
                  positions={landmark.pitBoundary.map((p) => [p.lat, p.lng])}
                  pathOptions={{
                    color: '#F59E0B',
                    weight: 2,
                    dashArray: '5, 5',
                    fillColor: '#F59E0B',
                    fillOpacity: 0.12,
                  }}
                />
              )}
              <Marker
                position={[landmark.center.lat, landmark.center.lng]}
                icon={createLandmarkIcon(landmark.category, landmark.name)}
                zIndexOffset={600}
              >
                <Popup>
                  <div className="text-xs p-1 min-w-[210px] max-w-[260px]">
                    <div className="font-bold text-[#172B4D] leading-tight">{landmark.name}</div>
                    <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                      {landmark.category.toUpperCase().replace('_', ' ')} &bull; {landmark.elevationM}m MSL
                    </div>
                    <p className="text-[11px] text-[#5E6C84] mt-1.5 leading-relaxed">
                      {landmark.description}
                    </p>
                    <div className="text-[10px] bg-slate-50 p-1.5 rounded mt-1.5 text-slate-600 border border-slate-200 leading-snug">
                      {landmark.nmdcDetails}
                    </div>
                    {landmark.pitBoundary && onSelectLandmarkAoi && (
                      <button
                        onClick={() => onSelectLandmarkAoi(landmark)}
                        className="mt-2.5 w-full py-1.5 px-2 bg-[#1976D2] hover:bg-blue-700 text-white font-semibold rounded text-[11px] transition-colors cursor-pointer text-center shadow-xs"
                      >
                        Set Drone Survey Over This Pit
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

        {/* 7. Active Aircraft Drone Marker */}
        {aircraftPos && (
          <Marker
            position={aircraftPos}
            icon={createAircraftIcon(telemetry?.headingDeg ?? 0)}
            zIndexOffset={1000}
          />
        )}
      </MapContainer>

      {/* Drawing mode alert overlay */}
      {(isDrawingBoundary || isDrawingManualRoute) && (
        <div className="absolute top-4 inset-x-0 flex justify-center z-20 pointer-events-none">
          <div className="bg-[#172B4D]/90 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg backdrop-blur-xs flex items-center space-x-2 animate-pulse">
            <span>
              {isDrawingBoundary
                ? 'Click on the map to add survey boundary vertices'
                : 'Click on the map to place manual route waypoints'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
