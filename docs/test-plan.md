# Acceptance Test Plan & Verification Record

This document records verification of the acceptance criteria defined in Section 22 of `implementation.md`.

---

## 1. Visual & Layout Criteria

- [x] **Desktop 16:9 engineering console composition**: Clean light theme (`#F5F7FA`) with top command bar, central map canvas, left tool rail, upper-left floating telemetry cards, bottom-left circular attitude gyro, bottom status strip, and right flight control panel.
- [x] **Light theme aesthetics**: Clean white control panels, subtle cool-gray borders, dark navy typography (`#172B4D`), and blue action buttons (`#1976D2`).
- [x] **Unobstructed workspace**: Telemetry cards float in the upper-left corner with semi-transparent backdrops without hiding the primary aircraft marker or survey polygon.
- [x] **Responsive behavior**: Panels scroll internally; responsive layout supports standard viewports.

---

## 2. Mission Planning & Simulation Criteria

- [x] **Survey AOI Drawing**: User can draw arbitrary closed polygons on the map using the left tool rail boundary tool.
- [x] **Lawnmower Transect Generation**: Boustrophedon sweep lines generated with configurable line spacing (10–100m).
- [x] **Exact Loop Closure**: When loop closure is enabled, the final waypoint coordinate equals the starting origin coordinate ($p_{\text{start}} = p_{\text{end}}$), verified by automated test.
- [x] **Deterministic Flight Progression**: Aircraft marker moves along planned segments with smooth heading rotation and waypoint highlight tracking.
- [x] **Synchronous Telemetry**: Latitude, longitude, altitude AGL, heading, ground speed, battery, and magnetometer readings advance monotonically.
- [x] **Pause / Resume**: Freezes route progress and preserves position; resume continues from exact coordinate.
- [x] **Emergency Abort**: Stops propulsion, prompts confirmation, tags dataset as `ABORTED`, and prevents fake completed status.

---

## 3. CSV & Local Survey Archive Criteria

- [x] **Full 27-Column Schema**: CSV exporter produces all 27 columns in exact specified sequence.
- [x] **Monotonic Timestamps**: Simulation elapsed seconds and ISO-8601 UTC timestamps advance monotonically.
- [x] **IndexedDB Persistence**: Completed and aborted flights persist locally across browser reloads using `idb`.
- [x] **Survey Data Library Modal**: File-explorer interface with search, filter (Synthetic / Uploaded), download, delete, and process actions.
- [x] **External CSV Upload**: Drag-and-drop file upload with column alias normalization (`lat`, `lon`, `total_field_nt`) and validation report.

---

## 4. Geophysical Heat Map & Prospectivity Criteria

- [x] **Inverse Distance Weighting (IDW)**: Metric local projection interpolation with configurable resolution (25m) and search radius (150m).
- [x] **Synthetic Target Alignment**: Hotspots consistently align with the planted Bailadila anomaly body.
- [x] **Robust Normalization**: 2nd to 98th percentile scaling for relative index (0–100).
- [x] **Candidate Hotspots Ranking**: Top 5 candidate coordinates ranked with distance confidence indicators.
- [x] **Export Capabilities**: Exports processed grid as CSV, GeoJSON FeatureCollection, and metadata manifest.

---

## 5. Google Earth Engine Criteria

- [x] **Safe Backend Architecture**: Earth Engine initialized via FastAPI backend; zero secrets exposed to browser client.
- [x] **Sentinel-2 & DEM Integration**: Endpoints for True-Color RGB, False-Color NIR, Ferric-Iron Surface Proxy (B4/B2), and SRTM 30m DEM elevation.
- [x] **Graceful Offline Fallback**: When GEE credentials are not configured, backend returns clear status and dashboard functions in local simulation mode.
- [x] **Truthful Status Display**: Explicit `GEE Live` vs `GEE Standby` badges; no mock imagery is labeled as live Earth Engine data.

---

## 6. Automated Test Suites

- **Frontend Vitest (`frontend/src/tests/geophysics_and_simulation.test.ts`)**: 8 tests passing.
  - Route closure check
  - Lawnmower generation
  - Magnetometer determinism
  - Anomaly peak detection
  - CSV schema order
  - CSV round-trip
  - CSV alias mapping
  - IDW interpolation
- **Backend Pytest (`backend/tests/test_api.py`)**: 6 tests passing.
  - Root endpoint
  - Health check
  - Config schema
  - GEE status
  - GEE layer response
  - Multi-criteria prospectivity analysis
