# ANVESHAA Airborne Iron-Ore Prospecting Simulator — Implementation Specification

> **Purpose:** A polished, light-theme, browser-based airborne survey command dashboard that visually follows the supplied “Aerial Survey Flight” screenshot, simulates a drone carrying a magnetometer, exports a realistic-looking synthetic flight CSV, keeps a local survey archive, and builds a transparent exploratory iron-prospectivity heat map using the CSV plus real Google Earth Engine (GEE) surface imagery/elevation layers when configured.
>
> **Project tags:** `#AerialSurvey` `#DroneSimulation` `#Magnetometry` `#IronOreProspecting` `#GoogleEarthEngine` `#GeospatialAI` `#SyntheticData` `#TelemetryDashboard` `#GIS` `#React` `#FastAPI`

---

## 1. Instructions to the coding agent

Build the complete working application described in this specification, not just a static mock-up or a landing page. Implement the frontend, backend, route simulator, downloadable CSV, local session archive, CSV import/validation, heat-map generation, and a real GEE integration path. Buttons must perform real actions within the simulation. The system must remain demonstrable even when GEE credentials are not configured, but it must never label mock satellite imagery as live Earth Engine data.

Use the uploaded screenshot as the main visual reference. Preserve its operational-dashboard composition: a narrow command bar at the top, a large satellite/geospatial map in the center, a slim vertical tool rail on the left, floating telemetry panels on the upper-left of the map, a circular attitude indicator near the lower-left, a compact status strip along the map bottom, and a right-side flight-control panel. Use a **light theme** with white/light-gray control panels, dark navy labels, blue primary actions, subtle borders and shadows, and a real geospatial view behind the controls.

Do not stop after scaffolding. Continue until every core acceptance criterion near the end of this file passes. If a dependency, Google Cloud credential, or API key is unavailable, implement the corresponding configuration screen, error state, and fully usable simulated/demo fallback. Do not hardcode secrets. Do not invent live sensor readings or call synthetic data “real”.

## 2. Product concept and scientific boundaries

### 2.1 What the product does

The application simulates an airborne geophysical survey over an illustrative area near the Bailadila iron-ore region, Kirandul/Dantewada, Chhattisgarh, India. The user can:

1. View an actual satellite/geospatial basemap and terrain context.
2. Draw a survey area or manually create a route on the map.
3. Generate a lawnmower/boustrophedon survey route inside a closed area, with configurable line spacing and altitude.
4. Start, pause, resume, abort, or complete a **software simulation** of a drone moving through the route.
5. Watch the aircraft position, coordinates, altitude, speed, heading, elapsed time, distance, battery, link status, attitude, and synthetic magnetometer readings update consistently as the simulated aircraft moves.
6. Finish a loop that returns to the starting coordinate and download the generated CSV.
7. Open a CSV archive/file-picker modal, choose a saved flight or upload a CSV, validate the data, and generate a spatial heat map over the survey area.
8. Toggle the magnetometer anomaly surface, GEE spectral proxy layers, true/false-colour imagery, elevation/terrain, flight route, waypoint labels, and survey samples.
9. Inspect high-scoring locations and export processed results with clear metadata and caveats.

### 2.2 Mandatory scientific distinction

The application is a simulation/prototype, not a proven mineral detector. Implement these distinctions in code, interface copy, the README, CSV metadata, and exported reports:

- **Magnetometer values in the built-in demo are synthetic.** GEE does not provide measurements from the simulated drone's magnetometer.
- **Sentinel-2 is surface optical imagery.** Its spectral bands can provide surface mineral/iron-oxide *proxies* in suitable exposed conditions, but vegetation, weathering, soils, shadows, mining disturbance, clouds, and mixed pixels affect them. A spectral proxy is not a direct measurement of buried iron ore.
- **A magnetic anomaly does not automatically mean iron ore.** Magnetic response depends on mineralogy, magnetic susceptibility, depth, geometry, remanent magnetisation, altitude and survey design. Magnetite can produce a strong response; hematite-dominant ore can produce weak or variable magnetic responses. Do not imply that a magnetometer alone reliably detects every hematite deposit.
- Scores must be labelled **“Relative prospectivity index”** or **“Exploratory index (0–100)”**, not “probability of iron” or “iron content”, unless the user later supplies a validated model and calibration data.
- The default target pattern and hot spots are deliberately planted synthetic signals for demonstrating the workflow. Put a persistent `SIMULATION`/`SYNTHETIC` badge over all built-in flight and heat-map screens.
- Real GEE imagery/elevation can be displayed and analysed, but real Earth observation layers do not turn simulated magnetometer readings into field measurements.
- No generated result should be presented as proof of subsurface mineralisation or a substitute for ground geophysics, geological mapping, sampling, drilling, and professional interpretation.

Show this concise notice in the processing pane and README:

> **Prototype limitation:** The built-in flight and magnetometer readings are synthetic. Earth Engine layers are real surface/terrain datasets, but the displayed prospectivity index is exploratory and unvalidated. It is not a confirmed mineral occurrence, an ore-grade estimate, or a probability of finding iron below ground.

## 3. Recommended study area and date handling

### 3.1 Default Indian iron-ore context: Bailadila

Set the default map view to an **illustrative area near Bailadila Range/Kirandul, Dantewada district, Chhattisgarh, India**, approximately centred around `latitude: 18.615`, `longitude: 81.231`. Treat this as a convenient initial map centre only; it is **not an official mine-lease polygon**. The user must be able to pan, zoom, and draw a new study area anywhere.

Why Bailadila: NMDC’s public website lists Bailadila Iron Ore Mine, Kirandul Complex and Bacheli Complex and describes average grade above 66% Fe for these operations. Use Bailadila as the demonstrator’s mineral-region context; do not seed the heat map from a claimed official ore-body boundary. If a mine/block boundary is ever shown, source the exact boundary from a suitable official public dataset and label its provenance rather than approximating it.

Useful official reference pages:

- NMDC — Bailadila Iron Ore Mine, Bacheli Complex: https://www.nmdc.co.in/about-nmdc/operating-mines/bailadila-iron-ore-mine-bacheli-complex
- NMDC home/project overview: https://www.nmdc.co.in/
- Government of India Ministry of Mines search result/document for Bailadila Deposit 01 blocks: https://mines.gov.in/admin/storage/ckeditor/All_states_PPTs_%281%29_1737545150.pdf

### 3.2 Display the screenshot’s date, but separate it from imagery dates

The reference screenshot shows `Position received: 2016-08-29 14:15:15`. Use **2016-08-29** as the default *simulated mission date* for visual fidelity, with a configurable simulated start time. This is a demo clock, not evidence that a real flight occurred at that time.

Satellite imagery dates must be separate from mission-simulation time. `COPERNICUS/S2_SR_HARMONIZED` begins on 2017-03-28, so if the user selects the screenshot’s 2016 date, do not pretend that the SR collection provides a scene for that date. In the imagery pane show the actual acquisition/composite period used by GEE. When historical imagery before March 2017 is requested, optionally query `COPERNICUS/S2_HARMONIZED` Level-1C (available from 2015) and label it TOA imagery; otherwise state that SR imagery is unavailable for that date and offer the earliest usable recent SR composite. Never silently backdate a current composite.

### 3.3 Default mission shape

On first launch, show a compact welcome overlay with two choices:

- **Load Demo Mission** — loads a closed, small illustrative survey boundary and a generated lawnmower route near the default map centre. A user can start the simulator without drawing anything.
- **Plan New Survey** — lets the user draw their own boundary or route.

The demo polygon and target anomalies must be generated in code from a documented deterministic seed, not fetched from a fictional “real survey” file. Mark the shape as `DEMO AOI — illustrative only`.

## 4. Technology and architecture

Use a maintainable stack with strict types and a clear separation between simulation, mapping, Earth Engine, file processing, and UI.

### 4.1 Frontend

- React + TypeScript + Vite.
- Tailwind CSS for layout/utility styling; use a consistent UI primitive system (shadcn/ui or a small internal component kit) for buttons, dropdowns, dialogs, cards, tabs, tooltips, sliders and badges.
- Leaflet + React-Leaflet for the central interactive map. Add Leaflet-Geoman or Leaflet Draw for geometry drawing/editing. Use `leaflet.heat` or a custom Leaflet Canvas/grid layer for the heat map. Use `leaflet-rotatedmarker` only if needed for an aircraft icon heading.
- Recharts for small timeline charts, e.g. magnetic anomaly vs time, altitude vs time, and battery over time.
- Zustand or a small typed React context/reducer for shared mission/simulation state. Avoid storing large CSV row arrays in localStorage.
- IndexedDB (prefer `idb`) for persistent local survey sessions and generated CSV blobs.
- Papa Parse for CSV parsing and generation/serialization, or a robust equivalent.
- `date-fns` for formatting timestamps.
- `lucide-react` for icons, with consistent line weight.

### 4.2 Backend

- Python 3.11+ and FastAPI.
- `earthengine-api` (`ee`) for Google Earth Engine calls.
- `numpy`, `scipy` (e.g. `scipy.spatial.cKDTree`), `pandas`, and `pydantic` for validation/interpolation/analytics.
- Optional `rasterio` only if the implementation chooses GeoTIFF handling; do not add a heavy geospatial stack unnecessarily for the first release.
- `pytest` for backend tests and the frontend’s test runner (Vitest) for core simulation/CSV processing tests.

### 4.3 Separation of concerns

Keep these modules independent:

- `missionPlanner`: editable AOI and route generation.
- `flightSimulator`: deterministic movement and telemetry.
- `syntheticMagnetometer`: synthetic magnetic-field/anomaly model.
- `csvService`: schema validation, serialization, import and export.
- `surveyArchive`: IndexedDB records and blobs.
- `prospectivityService`: interpolation and exploratory index.
- `earthEngineService`: live GEE layers, metadata and sampling.
- `mapLayerManager`: map base layers and overlay toggles.
- `uiState`: command states, dialogs, selected session, layer state, settings.

Never tightly couple a flight timer to a React component’s render lifecycle. The simulation must have a single source of truth and clean timer teardown on pause, abort, route reset, navigation, and unmount.

## 5. Design reproduction requirements

### 5.1 Overall layout

Target a desktop-first 16:9 command interface inspired by the uploaded 1600×900 screenshot. The map is the principal workspace and should occupy approximately 70–78% of the viewport width. The flight-control rail occupies roughly 280–320 px on desktop. At the 1600×900 reference size, controls should not cover the map excessively; floating cards must remain readable without hiding the current aircraft marker or the area of interest.

Use a restrained, engineering-console style:

- Main page background: very light gray/off-white (`#F5F7FA` range).
- Cards/panels: white with thin cool-gray borders, a subtle shadow, rounded corners of about 8–12 px.
- Primary action: saturated medium blue (for example `#1976D2`), with hover/pressed states and accessible contrast.
- Text: navy/charcoal (`#172B4D` / `#243247` family); secondary copy medium gray.
- Status colours: green for healthy/active, amber for warning/low battery, red for abort/error, neutral gray for standby.
- The map itself may remain satellite/terrain imagery while the surrounding application stays in a light theme.
- Avoid a dark theme. Do not build a generic admin template that ignores the screenshot’s aerial-survey feel.

### 5.2 Top command bar

Build a fixed-height white command bar across the top. Suggested controls, left to right:

1. Small circular/line icon and application title **Aerial Survey Flight**.
2. Navigation/action items: `Home`, `Aerial Survey Flight`, `Execute` (or mission status).
3. Main mission buttons: `Start Simulation` before the flight, `Pause` while active, `Resume` while paused, `Complete / Land` when finishing normally, and `Abort` as a separate danger action.
4. Right-aligned status: simulated radio bars, `RC Online` badge, battery voltage/percentage, settings gear, help, notifications (optional), and user/profile icon (optional).

All controls must be state aware. Do not present an enabled `Start` button while the route is invalid or the simulation is already running. `Abort` opens a confirmation dialog, stops the simulation and marks the flight `ABORTED`; it does not silently label an incomplete route as completed.

### 5.3 Left vertical tool rail

Place a compact tool rail flush against the left edge of the map below the top bar. Include icon buttons with visible active state and tooltips:

- Select / inspect.
- Layers.
- Draw survey boundary (polygon).
- Draw/edit manual route (polyline/waypoints).
- Generate survey grid.
- Measure distance/area.
- Waypoint list.
- Map reset / fit survey area.

The exact icons may differ, but provide the same operational density as the reference. Every icon must have a real handler; if a feature is not implemented, do not show an inert tool.

### 5.4 Upper-left floating telemetry cards

Use three floating white cards over the map, aligned horizontally where viewport space permits and arranged vertically on narrower screens.

**Card A — GPS/INS & Flight Status**

- GPS/INS state, positioning quality (`Simulated RTK FIX` / `3D FIX` / `NO FIX`), a clear `SIMULATION` badge.
- Flight state: `READY`, `FLYING TO WP 04`, `PAUSED`, `RETURNING HOME`, `COMPLETED`, or `ABORTED`.
- Large elapsed timer (`HH:MM:SS` or `MM:SS`).
- Distance from home/current route remaining.
- Position timestamp from the simulation clock.
- Airspeed, ground speed, vertical speed.
- Current flight mode, heading, current waypoint, and altitude.

**Card B — Battery Status**

- Main battery: percentage and simulated voltage.
- Aircraft battery/secondary pack: display only if its value is clearly marked as an illustrative subsystem.
- Ground-station battery/voltage can appear as a static/configurable demo reading.
- A coherent remaining-time estimate based on the configured nominal simulated endurance.
- A colour-coded threshold: green above 35%, amber 15–35%, red below 15%.

Do not let the voltage values fluctuate randomly without relation to charge state. State in the tooltip that these are simulated values.

**Card C — Magnetometer / Payload Status**

Adapt the screenshot’s `POS / LiDAR Control` panel to this project:

- `Magnetometer: Connected (simulated)`.
- `Sensor sampling: ON/OFF`.
- `Baseline correction: READY`.
- `GPS timestamp sync: OK`.
- `Calibration: DEMO / UNCALIBRATED`.
- A compact current `Total field` in nT and `Anomaly` in nT.
- Status steps for `Start sensor`, `Collecting`, `End collection`, `Standby`.

Never imply that a real POS, LiDAR or magnetometer device is connected. Name it “Simulated magnetometer” until physical-device support is separately implemented.

### 5.5 Bottom-left instrument

The circular widget in the screenshot’s bottom-left corner resembles an **artificial horizon / attitude indicator**, not an odometer. Recreate that style with:

- Pitch and roll horizon lines linked to simulated aircraft attitude.
- Heading/compass readout (e.g. `294°`).
- Level / inclinometer state.
- Small roll/pitch numbers.

Also add an explicit **Distance odometer** elsewhere in the lower map/status region. Show `Distance travelled`, `Distance to home`, and `Route distance` as distinct metrics. This satisfies the distance-indicator need while preserving the reference screenshot’s actual instrument.

### 5.6 Bottom status strip

Overlay a slim translucent/white strip along the bottom edge of the map, matching the screenshot’s layout. Include:

- `Latitude` and `Longitude` (updates with aircraft).
- Aircraft icon/model label, e.g. `Survey UAV · simulated`.
- Flight speed.
- Link quality.
- Flight distance.
- Current waypoint / total waypoints.

When no flight is active, coordinates should show the selected home/start point or an em dash—never stale prior values without a label.

### 5.7 Right-side “Current Flight” panel

Keep this as a fixed light panel at the right edge of the viewport with a subtle left border. It must scroll internally on smaller screens.

Sections:

1. **Current Flight:** aircraft model (`Survey UAV / Magnetometer payload`), mission status, mission date and ID.
2. **Flight Controls:** a small set of state-aware controls: start/pause/resume, return-to-home, land/complete, abort. Use a clear confirmation on abort.
3. **Mission Settings:** altitude AGL (metres), speed (m/s), survey-line spacing (m), sampling rate (Hz), home point, configured endurance, magnetometer mode (`weak/hematite-like`, `mixed`, `strong/magnetite-like` synthetic response).
4. **Altitude Adjustment:** slider/input for target altitude AGL, `Increase`/`Decrease` or explicit target altitude; `Apply` changes simulated target altitude gradually rather than teleporting the telemetry. Show both AGL and MSL.
5. **Loiter/hold simulation:** optional `Hold at current position` / `Resume route`. It should actually pause route progress while keeping telemetry updated, not call a real drone API.
6. **Battery ring/gauge:** current remaining percent, approximate simulated remaining minutes, and a clock/timer.
7. **Mission summary:** route distance, number of waypoints, expected duration, closed-loop verification.

Do not include dangerous real-flight claims. All control labels should say simulation where ambiguity is possible.

### 5.8 Map controls and auxiliary overlays

On the map’s upper-right side, include compact controls for compass/north reset, zoom in/out, basemap/layer selector, terrain/elevation display, fullscreen, and map-centre/fit-to-route. Implement attribution for data sources. A layer panel should support:

- Earth Engine satellite RGB composite (when available).
- OpenStreetMap or another documented fallback basemap.
- False-colour Sentinel-2 view.
- Ferric-iron/iron-oxide spectral proxy layer (label as experimental surface proxy).
- Elevation and slope/hillshade.
- Flight boundary, planned route, waypoint numbers and flown trail.
- Synthetic magnetic anomaly samples.
- Relative prospectivity heat map.
- Optional uncertainty/data-coverage layer.

The layer selector must indicate which layers are live GEE, local simulation, or fallback basemap. The application must not scrape Google Maps/Google Earth tiles. If Google Maps Platform satellite tiles are added, use the official API and required key/terms. A GEE-generated Sentinel-2 layer is the default live satellite layer.

## 6. Route planning and mission validation

### 6.1 Two planning modes

Implement two route-planning modes:

**A. Survey-area mode (recommended)**

1. User draws a polygon boundary.
2. App validates that the polygon is closed, has enough area, and does not self-intersect where practical.
3. User sets line spacing, orientation, starting corner, altitude AGL, speed, and desired path closure.
4. App generates a lawnmower/boustrophedon path clipped to the polygon.
5. Connect successive transects with turns that remain within or near the allowed survey boundary.
6. Add a final return segment that ends exactly at the original start coordinate, unless the user disables loop closure and explicitly confirms an open route.
7. Display route length, transect count, waypoint count, estimated flight time, and closure distance.

**B. Manual route mode**

- User clicks to place waypoints or draws a polyline.
- Waypoints can be dragged, deleted, reordered, and edited in a waypoint table.
- Provide a `Close Loop` action that adds a segment back to the start coordinate. Closure must use the exact same coordinates for first/last route sample, not merely a visually close point.
- Show an explicit warning when the route crosses outside the survey boundary or the loop closure creates a long connector.

### 6.2 Coordinate and distance calculations

- Store geographic coordinates as WGS84 latitude/longitude in decimal degrees.
- Calculate route lengths/distances in metres using a geodesic library or haversine locally; do not treat degree differences as metres.
- For grid generation, transform the survey polygon into a local metric projection appropriate to the site (or use a robust local tangent-plane approximation for a small AOI), generate transects in metres, then convert waypoints back to WGS84.
- Keep route generation reproducible for the same polygon/settings.
- Validate coordinate bounds and reject NaN/Infinity values.

### 6.3 Route readiness panel

Before allowing `Start Simulation`, show a mission-check list:

- Route exists and has at least two distinct positions.
- Route has the configured closed-loop condition when closure is required.
- Survey area and route length are nonzero.
- Speed and sampling frequency are in allowed UI bounds.
- Altitude AGL is positive and not an accidental extreme value.
- Target area/grid size is below processing limits.
- Simulation mode and synthetic-data disclosure are visible.

Default safe demo bounds: simulation speed 2–20 m/s, altitude AGL 20–150 m, line spacing 10–100 m, sample rate 1–10 Hz. Treat these as UI simulation constraints, not real aircraft flight recommendations.

## 7. Flight simulation engine

### 7.1 State machine

Use a finite-state machine with at least:

`IDLE → PLANNED → READY → RUNNING ↔ PAUSED → RETURNING_HOME → COMPLETED`

An `ABORTED` terminal state is accessible from active/paused states. If a route was completed normally, the final position must equal the start coordinate within numeric precision and the end timestamp must be recorded. Do not let `Pause`, `Resume`, `Complete`, or `Abort` create duplicated timers.

### 7.2 Deterministic movement

The aircraft marker must physically move along the planned polyline. At a minimum:

- Maintain `routeProgressMeters`, current segment index, distance along segment, current coordinates, heading, elapsed mission time and telemetry samples.
- Advance route progress using `speed_mps × delta_time_seconds`.
- Interpolate location along segments geodesically or use sufficiently accurate local projected coordinates for the small AOI.
- Derive heading from the active segment bearing.
- Derive ground speed from route settings plus small seeded noise; do not make the aircraft jump randomly around the map.
- Smooth the aircraft marker between data samples; render UI animation at display rate and log/export measurements at the configured sample rate.
- When pausing, preserve route progress and stop horizontal movement. Resume from the same location.
- When returning home, follow the precomputed return route to the exact first waypoint.
- Reaching the end must stop timers, finalise the last record, set mission state `COMPLETED`, save the CSV/archive record, and expose download controls.

Use a seeded pseudo-random generator (seeded by flight/session ID) for stable GPS noise, magnetometer noise, and small attitude changes. The same generated mission settings and seed should reproduce the same synthetic data to the extent feasible.

### 7.3 Simulated telemetry

Update the UI smoothly at approximately 4–10 times per second; record CSV samples at a configurable rate (default 1 Hz). Avoid excessive React rerenders by keeping fast telemetry updates in a dedicated store and memoising the map overlays.

Derive values, do not randomise them independently:

- `latitude`, `longitude`: current interpolated route position + small configurable GPS jitter in the displayed estimate. CSV should preserve measured-like reported coordinates, and also optionally include planned coordinates.
- `heading_deg`: active segment bearing, normalised to 0–359.99.
- `ground_speed_mps`: configured speed with bounded low-level noise; zero when paused/landed except while a brief descent is simulated.
- `vertical_speed_mps`: based on a smooth transition when altitude target changes; approximately zero on level legs.
- `altitude_agl_m`: selected mission altitude with small seeded noise.
- `elevation_m_msl`: sample from the active GEE terrain service when available, else use a clearly identified synthetic terrain approximation. Cache samples along the route.
- `altitude_m_msl`: `elevation_m_msl + altitude_agl_m` when vertical datum treatment is consistent. Add a tooltip that DEM datums and GPS altitude datums may differ in reality.
- `distance_from_home_m`, `distance_travelled_m`, `route_remaining_m`: calculated from actual simulated position/path progress.
- `elapsed_seconds`: based on simulation time; support a controllable simulation time scale (e.g. 1×, 2×, 5×) without corrupting exported timestamps.
- `battery_percent`: monotonically decreases according to configured nominal endurance and/or distance; it must not jump randomly. Voltage decreases smoothly as a demonstrative approximation.
- `link_quality_percent`: stable high value with modest seeded variation; use warning status thresholds.
- `roll_deg`, `pitch_deg`: small smooth turn/acceleration-linked attitude values, returning near level on straight segments. These drive the artificial-horizon widget.
- `mag_total_field_nt`, `magnetic_anomaly_nt`: generated by the synthetic field model below.

The displayed mission timestamp should advance using the user-selected simulated clock start. Store timestamps as ISO-8601 UTC in CSV, and display a timezone selector/label so UTC is not silently confused with local Indian Standard Time. Default visual clock can show `2016-08-29 14:15:15` when the seeded mission reaches the corresponding point; do not falsify current system time outside this simulation.

### 7.4 Artificial-horizon and compass display

- The centre horizon must respond to roll and pitch.
- Heading dial responds to route bearing.
- Do not allow the instrument to use a separate random orientation disconnected from the aircraft state.
- Show numeric heading and pitch/roll values for accessibility/debugging.
- Add a separate distance gauge/readout as described in Section 5.5.

## 8. Synthetic magnetometer and realistic demo readings

### 8.1 Model requirements

Create a documented, configurable **synthetic scalar magnetic-field model** in local projected metres. The model should produce a smooth background field plus a few spatial anomaly bodies, a regional trend, and small measurement noise. A simple mathematical model is preferable to random numbers because the resulting hotspot must remain spatially stable while the drone moves.

Suggested conceptual formula:

```text
background_nt(x, y) = base_field_nt + regional_gradient_nt_per_km · position_km
anomaly_nt(x, y) = Σ amplitude_i_nt × exp(-0.5 × mahalanobis_distance_i²)
noise_nt(t) = seeded_gaussian_noise(stddev_nt)
total_field_nt = background_nt + anomaly_nt + noise_nt
magnetic_anomaly_nt = total_field_nt - estimated_local_background_nt
```

Use elliptical Gaussian bodies with editable centre, orientation, width/length, and amplitude. Use at least one main synthetic target and one weaker background anomaly so the heat map does not look unnaturally perfect. Put the hidden/known synthetic target geometry in `demoScenario.ts` or equivalent; label it `Synthetic target truth` in the demo inspector only, and never represent it as an official Bailadila ore-body location.

### 8.2 Suggested demo parameter range

- Background scalar field: choose a plausible Earth-field-scale baseline such as approximately `45,000 nT` and allow a configuration range such as `25,000–65,000 nT`.
- Background drift: a small regional trend, for instance `5–50 nT/km` across the demo area.
- Anomaly amplitude: configurable by synthetic mineral response mode. Use weak/variable values for a hematite-like demonstration and stronger values for a magnetite-like scenario; keep all outputs within the explicitly synthetic model.
- Sensor noise: default approximately `5–15 nT` standard deviation with optional settings, seeded per session.
- Sampling: default 1 Hz, configurable 1–10 Hz.
- Keep raw total-field and detrended anomaly separate. Include the baseline/window/filter method in exported metadata.

The model should not assert that the above parameters represent a specific real ore body. Put them in a settings file with comments stating that they are simulation parameters that must be calibrated against known field measurements before any scientific use.

### 8.3 Baseline correction

Provide a basic demo baseline-removal operation, such as subtracting a rolling median/background trend from the total-field channel. Keep both the original simulated total field and the corrected anomaly field in the CSV. In the processing UI, allow `Raw field` vs `Corrected anomaly` to be selected and show which one feeds the current heat map.

### 8.4 Hardware extension point

Structure a `MagnetometerProvider` interface with `SyntheticMagnetometerProvider` as the only initial implementation. Do not claim hardware support. A later real sensor adapter would need timestamp synchronisation, calibration, sensor orientation, aircraft interference compensation, lever-arm metadata, GPS/INS alignment, sampling diagnostics, and real instrument specifications.

## 9. CSV export and schema

### 9.1 Generate CSV automatically at flight completion

On normal completion:

1. Flush the final telemetry sample.
2. Validate row ordering and required fields.
3. Add a small metadata sidecar or CSV comment/manifest describing that this is synthetic data. Prefer a `.json` manifest stored with the session record; keep the CSV itself straightforward to parse.
4. Save the CSV blob in IndexedDB.
5. Display a `Download CSV` button and trigger a direct download if that is the chosen UX. Do not lose the file if the user dismisses the completion dialog.
6. Store the session’s metadata and CSV blob in the local archive.

Suggested filename:

`Bailadila_DemoFlight_YYYY-MM-DD_HH-mm-ss_<flightId>_SYNTHETIC.csv`

Allow the user to change the AOI/mission name. Include `SYNTHETIC` in the default filename to avoid confusion.

### 9.2 Required CSV columns

Create one row per sample. Use a stable header row in this order (reasonable additional columns are allowed):

```csv
flight_id,mission_name,mission_timestamp_utc,simulation_elapsed_s,sample_index,latitude,longitude,planned_latitude,planned_longitude,heading_deg,ground_speed_mps,vertical_speed_mps,altitude_agl_m,elevation_m_msl,altitude_m_msl,distance_from_home_m,distance_travelled_m,waypoint_index,battery_percent,link_quality_percent,mag_total_field_nt,magnetic_anomaly_nt,magnetometer_noise_nt,synthetic_iron_score_pct,gps_fix_status,sensor_status,data_origin
```

Column rules:

- Latitude/longitude are decimal degrees in WGS84.
- All distances/altitudes are metres, except speeds in m/s and heading in degrees.
- Magnetic field channels are nanotesla (`nT`).
- `synthetic_iron_score_pct` is a demo-only planted synthetic score, not a probability. Allow it to be empty for uploaded real or third-party CSVs that do not contain this field.
- `data_origin` must be `synthetic_simulation` for generated data and must never be silently changed on import.
- `mission_timestamp_utc` must be ISO-8601 UTC (e.g. `2016-08-29T14:15:15Z`). If the UI wants to represent IST, show that separately.
- Numeric fields must use decimal points, not locale-specific commas.
- Use consistent precision (e.g. coordinates 6–8 decimal places, fields 2–3 decimal places).

If the flight is aborted, allow the user to export partial data with `_ABORTED_PARTIAL_SYNTHETIC.csv`; label it partial and do not write a fake completed return-home coordinate.

### 9.3 Import validation

The processing modal must accept `.csv` via file chooser and drag-and-drop. Parse large files without blocking the UI; display a progress state. Validate:

- Required fields: latitude, longitude, plus either `magnetic_anomaly_nt` or `mag_total_field_nt`.
- Recognise common aliases such as `lat`, `latitude_deg`, `lon`, `lng`, `longitude_deg`, `magnetic_field_nt`, `total_field_nt`, `anomaly_nt`, and `timestamp`.
- Latitude in `[-90, 90]`, longitude in `[-180, 180]`; reject or flag invalid rows.
- Check missing/non-numeric values, duplicates, repeated timestamps, non-monotonic time, suspicious outliers, and coordinate spread.
- Report rows imported, rows skipped, field mappings, coordinate bounds, date range and whether the dataset looks like generated simulation data.
- Never silently guess an unknown magnetic field’s unit. If units are absent, ask user to choose `nT`, `µT`, or `unknown` and disclose any conversion.
- Do not automatically call arbitrary imported values an iron score. If no score column exists, derive a relative magnetic-anomaly-intensity layer and label it accordingly.

## 10. Data Processing Library / CSV Explorer

### 10.1 Interaction

The `Data Processing` command should open a modal/drawer styled like a small file explorer, not navigate away from the map.

Suggested title: **Survey Data Library**. Include:

- Search box for mission name, location, or flight ID.
- Filters for date range, status (`Completed`, `Aborted`), and source (`Synthetic`, `Uploaded`).
- List/table columns: file icon, mission name, flight date/time, duration, sample count, survey area, file size, source badge and processing status.
- Buttons: `Open / Process`, `Download`, `Rename`, `Delete`, and `Upload CSV`.
- `Upload CSV` accepts an external CSV and adds an `Uploaded` item after validation.
- A clear empty state with `Load Demo Mission` / `Run a flight first` instructions.
- A selected file preview with first several rows and detected schema.
- Keyboard navigation, visible focus, and confirmation before deleting a local archive item.

### 10.2 Persistence model

Use IndexedDB rather than localStorage for file bytes/large row arrays. Persist:

- Session ID and display name.
- Mission start/end timestamps.
- AOI geometry and route geometry (GeoJSON).
- Route/settings snapshot and simulator seed.
- Flight status.
- Sample count, duration, route distance, coordinate bounds.
- CSV Blob and optional manifest JSON.
- Imported vs synthetic data source classification.
- Last processed time, processing options and heat map settings.

The archive is local to the browser on the current device unless a server database is explicitly added later. State this in the README; do not imply cloud synchronisation.

### 10.3 Reprocessing

A saved CSV may be processed repeatedly with different display settings/weights, but preserve the original file. Store processed outputs/parameters separately and allow `Reset Processing` without deleting the survey.

## 11. Heat map and exploratory prospectivity analysis

### 11.1 User experience

After the user selects a file and clicks `Process Data`:

1. Show a progress indicator with stages: `Validating CSV`, `Mapping samples`, `Loading Earth Engine context` (when configured), `Interpolating magnetic response`, and `Building layers`.
2. Return to the central map with the survey boundary, flight path and data sample points visible.
3. Display the relative heat map clipped to the AOI or buffered survey footprint.
4. Show a legend with exact metric and units.
5. Add a docked results panel with max score, mean/median, top candidate cells, sample count, data coverage, source types, applied weights/algorithm, and caveats.
6. Clicking a hot spot opens a detail popup with latitude/longitude, interpolated anomaly, spectral proxy score (if available), composite index, distance to nearest sample, and uncertainty/coverage warning.
7. Allow toggling opacity, colour ramp, resolution, and raw/processed display.
8. Allow exporting the processed grid as CSV/GeoJSON and downloading a processing summary/manifest.

### 11.2 Interpolation

Use a genuine deterministic spatial method, not just a decorative red overlay:

- For initial MVP use inverse distance weighting (IDW) over the magnetic anomaly values, with configurable power (default `p = 2`) and a maximum neighbour distance. Use a local metric projection before computing distances.
- Avoid assigning artificially precise values far outside the measured/surveyed region. Clip the surface to the survey polygon or a conservative buffer and mask cells that are too far from samples.
- Use a sensible grid size (default 20–30 m, configurable and capped) that does not imply more spatial detail than the inputs support. Explain that Sentinel-2 optical bands are 10–20 m for relevant bands and terrain datasets such as SRTM are about 30 m, while interpolation resolution is not the same as actual measurement resolution.
- If the CSV contains `synthetic_iron_score_pct`, interpolate it as a **synthetic demo index**, but retain the explicit synthetic label.
- If no score field exists, interpolate `magnetic_anomaly_nt` or calculate a robust relative anomaly magnitude from the field. Show a “Magnetic anomaly intensity” layer rather than a mineral probability.
- If only total field exists, provide a selectable baseline-correction option. Do not infer ore directly from the absolute total field without correcting for background/latitude/trend.
- Make edge effects visible or document them in the quality panel.

### 11.3 Composite relative prospectivity index

When there is magnetic data and the GEE spectral proxy is available, optionally calculate a **prototype composite index**:

```text
mag_component = robust_normalize(local_magnetic_anomaly_or_gradient)
spectral_component = robust_normalize(experimental_ferric_iron_surface_proxy)
composite_index = 100 × (w_mag × mag_component + w_spectral × spectral_component)
```

Use default weights `w_mag = 0.70` and `w_spectral = 0.30` as **illustrative UI defaults only**; make them editable and renormalise the weights when one component is missing. These weights are not scientifically calibrated. Do not add a positive “terrain score” merely because elevation or slope is available; terrain belongs in visual context/masking unless a properly justified model is supplied. Add a UI panel saying which components were present, their weights, normalisation method and whether the output is synthetic or field-data-derived.

Robust normalisation options: percentile scaling using e.g. 2nd–98th percentiles, with careful handling of constant values and NaNs. A score of 90 means a high relative value *within this processed dataset*, not 90% chance of finding ore.

### 11.4 Heat-map style

Provide a readable, semi-transparent colour ramp such as:

- low: indigo/blue;
- low–medium: cyan/teal;
- medium: green;
- high: yellow/orange;
- highest: red/magenta.

Maintain a legend and avoid colours that obscure the satellite imagery. Hot spots should line up spatially with the planted synthetic anomaly and survey sample trend. Provide a neutral/colour-blind-aware alternative ramp if practical. No hot spot should appear outside the AOI without an explicit setting.

### 11.5 Results panel

Include:

- `Layer type: Synthetic prospectivity index` / `Relative magnetic anomaly` / `Composite proxy index`.
- Highest local index and its coordinates.
- Number of valid samples, samples dropped, interpolation grid size and search radius.
- GEE spectral image date range, dataset ID, pixel scale, cloud masking status and live/fallback status.
- Weights, normalization and interpolation method.
- Coverage/uncertainty indicator.
- `Not a confirmed deposit` notice.

Do not create a fake accuracy percentage, F1 score, ROC-AUC or predicted ore tonnage when no validation data exists.

## 12. Google Earth Engine integration (real data path required)

### 12.1 Role of GEE

Use GEE to load actual Earth observation and terrain datasets for the visible study area. At minimum, implement the live retrieval of:

1. Sentinel-2 optical composite and true-colour RGB layer.
2. False-colour composite.
3. An experimental surface ferric-iron/iron-oxide proxy derived from selected Sentinel-2 bands.
4. Elevation and terrain/slope from a DEM.
5. Real acquisition dates/cloud-cover metadata where available.

GEE is used for surface reflectance/context and terrain. It does not supply the simulated airborne magnetometer measurement.

### 12.2 Initial datasets

Use these public GEE catalog collections/assets:

- **Sentinel-2 Level-2A surface reflectance:** `COPERNICUS/S2_SR_HARMONIZED`. Official catalog: https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED
  - Useful bands include `B2` blue, `B3` green, `B4` red, `B8` near infrared, `B11` SWIR1, and `B12` SWIR2.
  - Catalogue availability begins 2017-03-28. Relevant visible/NIR bands are 10 m; red-edge/SWIR bands such as B11/B12 are 20 m.
- **Sentinel-2 Level-1C fallback for older dates:** `COPERNICUS/S2_HARMONIZED`. Official catalog: https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_HARMONIZED
  - Available from 2015. Clearly label the product TOA/Level-1C; do not show it as Level-2A surface reflectance.
- **Elevation:** `USGS/SRTMGL1_003` at approximately 30 m, official catalog https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003 or `NASA/NASADEM_HGT/001` from https://developers.google.com/earth-engine/datasets/catalog/NASA_NASADEM_HGT_001.

Keep dataset IDs and layer formulas centrally configured so an engineer can change datasets without rewriting UI components.

### 12.3 GEE processing logic

For a given AOI and imagery date range:

1. Construct the AOI geometry from validated GeoJSON.
2. Filter the relevant Sentinel-2 collection by AOI and date range.
3. Filter by scene cloud metadata when available, then apply a pixel-level cloud/cirrus/shadow mask using suitable QA/SCL bands. Explain which masking method is used; do not assume scene cloud percentage alone removes clouds.
4. Build a median/quality mosaic over the date window.
5. Return the true-colour visualisation (usually B4/B3/B2) and a false-colour visualisation (for example B8/B4/B3).
6. Calculate NDVI for vegetation context: `(B8 - B4) / (B8 + B4)`, protecting against division by zero.
7. Calculate a **clearly experimental ferric-iron surface proxy** from suitable red/blue and/or visible/SWIR reflectance ratios, for example evaluate B4/B2 and related contrast layers with a documented formula. Keep bands at their native/compatible scale and resample carefully. Do not call this a validated universal iron-ore index and do not equate it with subsurface abundance.
8. Return the elevation band, slope and optional hillshade from the DEM.
9. Return metadata: dataset, collection date range, number of images, best/median scene dates when possible, cloud filter, processing timestamp, pixel scale and GEE status.
10. Produce map tile URLs/MapId-based layers or the current supported Earth Engine map tile mechanism. The frontend adds these as Leaflet layers with opacity and attribution.

The default GEE date picker should provide a sensible recent image-composite period (e.g. past 12 months where scenes exist), not force the 2016 demo flight timestamp. Explicitly show `Mission simulation date` separately from `Satellite imagery date range`.

### 12.4 GEE-derived sampling for a composite grid

If implementing a composite index, do not calculate it from a visual layer screenshot. Query actual pixel values from the Earth Engine image at sample/grid locations or use a bounded small-region sample request. Return numeric band/proxy samples from the backend and join them to the magnetic anomaly grid in projected coordinates.

- Limit AOI area/grid size and point count; show a size estimate before running a heavy job.
- Use server-side Earth Engine operations as much as possible.
- Cache tile-layer metadata and numeric sampling results by AOI geometry hash + dataset + date range + scale + processing formula. Add an expiry and a manual refresh button.
- Handle no imagery, all-cloud, empty collection, permission errors, quota/timeout errors and invalid geometry without crashing the frontend.
- Keep a distinct `GEE live` / `GEE unavailable` status. When unavailable, permit the synthetic flight and magnetometer heat map, but disable or label spectral scoring as unavailable. A fallback basemap is not a substitute for live GEE analysis.

### 12.5 Authentication and operating mode

Keep every Earth Engine credential on the backend, never in browser JavaScript or in a committed `.env` file.

Development options:

- Local developer account: install `earthengine-api`, authenticate through the supported Earth Engine tooling/`ee.Authenticate()`, and initialise the selected Cloud project.
- Deployed backend: use Application Default Credentials (preferred where supported) or a properly configured service account. The Cloud project must have Earth Engine enabled and registered for the appropriate usage. Restrict IAM roles to what the app needs.

Official guides:

- Access and Cloud project registration: https://developers.google.com/earth-engine/guides/access
- Authentication and initialization: https://developers.google.com/earth-engine/guides/auth
- Service accounts: https://developers.google.com/earth-engine/guides/service_account
- Python setup: https://developers.google.com/earth-engine/guides/python_install
- Noncommercial eligibility and commercial-use conditions: https://earthengine.google.com/noncommercial/

Include backend environment settings such as:

```dotenv
GEE_ENABLED=true
GEE_PROJECT_ID=replace-with-your-google-cloud-project
GEE_AUTH_MODE=adc
GEE_SERVICE_ACCOUNT_EMAIL=
GEE_SERVICE_ACCOUNT_KEY_FILE=
GEE_DEFAULT_DATASET=COPERNICUS/S2_SR_HARMONIZED
GEE_DEFAULT_DATE_START=2024-01-01
GEE_DEFAULT_DATE_END=2026-01-01
```

The example dates are configuration defaults only; the application should derive the default period sensibly at runtime and validate that the selected collection has imagery. Never commit private key JSON. Add `.env`, credential files and key JSON paths to `.gitignore`.

**Usage/eligibility warning:** Google Earth Engine access and charges depend on the use case. Noncommercial educational/research access has eligibility requirements; commercial or operational use may require a paid configuration. The README must link to Google’s current access/terms pages instead of promising all use is free.

### 12.6 Basemap choices

- Preferred live surface view: GEE Sentinel-2 true-colour tiles.
- Fallback: an appropriately attributed OpenStreetMap basemap for navigation; indicate that it is not satellite imagery.
- Optional: Google Maps Platform satellite imagery only through its officially supported API and a correctly configured key/terms; do not scrape or reverse-engineer Google Earth tile URLs.

## 13. Backend API contract

Build a small, typed REST API. Exact naming may differ if architecture remains equivalent; document every endpoint in the README/OpenAPI docs.

### Health and configuration

- `GET /api/health` — backend status, simulation available, GEE enabled/connected status.
- `GET /api/config` — public non-secret configuration, supported layers, sampling bounds, GEE availability. Never return keys/secrets.

### Earth Engine

- `POST /api/gee/layers` — input: AOI GeoJSON, dataset/date range, cloud threshold, desired layer names. Output: tile layer URL template/identifiers, metadata, dataset and status.
- `POST /api/gee/sample` — input: AOI/grid/sample coordinates, dates, requested bands, scale and cell cap. Output: numeric surface proxy/elevation samples plus provenance.
- `GET /api/gee/status` — test live Earth Engine initialisation without exposing credential detail.

### Processing

- `POST /api/process/csv/validate` — optional backend validation path for large files. If browser-side parsing is used for the MVP, keep matching validation logic and tests on the frontend.
- `POST /api/process/prospectivity` — input: validated sample rows or file reference, AOI geometry, interpolation options, optional GEE pixel values, weights and grid resolution. Output: GeoJSON grid/features or bounded result data, statistics, processing manifest and caveats.

### API rules

- Use Pydantic models for all request/response payloads.
- Validate geometry, point counts, CSV size and grid dimensions.
- Set timeouts and return human-readable errors.
- Add CORS restricted to the local/deployed frontend origin, not wildcard production access.
- Do not accept or execute uploaded scripts/macros.
- Do not write uploaded content to arbitrary paths. Use temporary/sandboxed processing locations if filesystem operations are required.
- Avoid loading an entire large CSV into multiple copies in memory.

## 14. Suggested frontend components and file structure

Keep the following structure or a clear equivalent:

```text
project-root/
├── README.md                         # Required human-friendly setup and operating guide
├── implementation.md                 # This implementation specification
├── .gitignore
├── .env.example
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── app/
│       │   ├── App.tsx
│       │   ├── routes.tsx
│       │   └── store.ts
│       ├── components/
│       │   ├── TopCommandBar.tsx
│       │   ├── LeftToolRail.tsx
│       │   ├── MapWorkspace.tsx
│       │   ├── TelemetryPanel.tsx
│       │   ├── BatteryPanel.tsx
│       │   ├── PayloadStatusPanel.tsx
│       │   ├── AttitudeIndicator.tsx
│       │   ├── MapStatusStrip.tsx
│       │   ├── CurrentFlightPanel.tsx
│       │   ├── LayerControl.tsx
│       │   ├── SurveyDataLibraryDialog.tsx
│       │   ├── CsvPreview.tsx
│       │   ├── ProcessingProgress.tsx
│       │   ├── ProspectivityResultsPanel.tsx
│       │   └── SimulationDisclosure.tsx
│       ├── map/
│       │   ├── layers.ts
│       │   ├── routeDrawing.ts
│       │   ├── routeGeneration.ts
│       │   ├── heatmapLayer.ts
│       │   └── mapTypes.ts
│       ├── simulation/
│       │   ├── flightSimulator.ts
│       │   ├── syntheticMagnetometer.ts
│       │   ├── telemetryTypes.ts
│       │   └── demoScenario.ts
│       ├── services/
│       │   ├── apiClient.ts
│       │   ├── csvService.ts
│       │   ├── archiveService.ts
│       │   ├── processingService.ts
│       │   └── earthEngineService.ts
│       ├── types/
│       │   ├── mission.ts
│       │   ├── csv.ts
│       │   └── processing.ts
│       ├── styles/
│       │   └── index.css
│       └── tests/
├── backend/
│   ├── pyproject.toml or requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/
│   │   │   ├── health.py
│   │   │   ├── gee.py
│   │   │   └── processing.py
│   │   ├── services/
│   │   │   ├── earth_engine.py
│   │   │   ├── csv_validation.py
│   │   │   └── prospectivity.py
│   │   ├── schemas/
│   │   └── tests/
│   └── .env.example
└── docs/
    ├── data_dictionary.md
    ├── gee_setup.md
    └── limitations.md
```

Do not create placeholder files and leave them empty. Implement all listed core modules. If the agent chooses a simpler folder structure, maintain the same separation and include all required documentation.

## 15. Suggested TypeScript data types

Define strict types roughly equivalent to these (adapt names to codebase):

```ts
type MissionStatus =
  | 'IDLE'
  | 'PLANNED'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'RETURNING_HOME'
  | 'COMPLETED'
  | 'ABORTED';

type DataOrigin = 'synthetic_simulation' | 'uploaded_csv' | 'field_measurement';

type LatLng = { lat: number; lng: number };

type MissionSettings = {
  missionName: string;
  simulatedStartTimeUtc: string;
  altitudeAglM: number;
  speedMps: number;
  surveyLineSpacingM: number;
  sampleRateHz: number;
  nominalEnduranceMinutes: number;
  closeLoop: boolean;
  simulationTimeScale: 1 | 2 | 5;
  sensorMode: 'hematite_like_weak' | 'mixed' | 'magnetite_like_strong';
  randomSeed: number;
};

type TelemetrySample = {
  flightId: string;
  timestampUtc: string;
  elapsedSeconds: number;
  latitude: number;
  longitude: number;
  plannedLatitude: number;
  plannedLongitude: number;
  headingDeg: number;
  groundSpeedMps: number;
  verticalSpeedMps: number;
  altitudeAglM: number;
  elevationMslM: number | null;
  altitudeMslM: number | null;
  distanceFromHomeM: number;
  distanceTravelledM: number;
  waypointIndex: number;
  batteryPercent: number;
  linkQualityPercent: number;
  magTotalFieldNt: number;
  magneticAnomalyNt: number;
  magnetometerNoiseNt: number;
  syntheticIronScorePct: number | null;
  gpsFixStatus: string;
  sensorStatus: string;
  dataOrigin: DataOrigin;
};
```

Use `null` for unavailable real measurements. Do not write `0` for unknown elevation or magnetic values, since zero is a valid measurement and may look like real data.

## 16. Processing implementation details

### 16.1 Frontend CSV pipeline

For standard-size sessions:

1. Read the selected IndexedDB blob/file.
2. Parse with Papa Parse or equivalent.
3. Normalise headers/aliases to the standard schema.
4. Validate numeric fields, units and coordinate bounds.
5. Summarise rows and draw the sample points.
6. Send validated points plus geometry/options to the API only if server-side interpolation/GEE samples are needed; otherwise process with a well-tested frontend module.
7. Show the generated layer and record the processing run in the archive.

For larger files, stream/process in chunks or move parsing/interpolation to a Worker/backend to keep the map responsive. Set a friendly file-size limit and explain it in the UI.

### 16.2 Outlier handling

Provide optional—not automatic destructive—controls to flag outliers:

- non-finite or impossible coordinates;
- values many median absolute deviations from the local distribution;
- duplicate locations/timestamps;
- points far outside the route/AOI;
- large gaps or incomplete coverage.

The user can inspect warnings and choose whether to exclude flagged rows. Preserve the original CSV unchanged and list the exclusion count in the output manifest.

### 16.3 Uncertainty and distance to samples

At minimum, estimate local support by distance to the nearest valid sample and the number of neighbours contributing to each grid cell. Mark remote/extrapolated cells as low coverage or mask them. Do not label this as formal statistical uncertainty unless a validated uncertainty model is implemented.

### 16.4 Downloadable outputs

Provide:

- Original flight CSV.
- Processed grid CSV with `latitude`, `longitude`, `magnetic_anomaly_nt_interpolated`, `spectral_proxy`, `relative_prospectivity_index`, `nearest_sample_distance_m`, `sample_count_or_neighbours`, `processing_method` and `data_origin` where applicable.
- GeoJSON of top candidate cells / grid cells.
- JSON processing manifest with dataset IDs, imagery dates, weighting parameters, interpolation method, generated timestamp and limitations.
- Optional simple HTML/CSV report. Do not block the MVP on PDF report generation.

## 17. Local persistence and privacy

The first version should run locally without requiring a database or user account. Use IndexedDB for the survey archive. Do not send synthetic CSV data to third-party analytics. All backend requests should be limited to GEE retrieval/sampling and local development API use. Document any outbound requests and how to disable GEE. A later server-side multi-user system can use Postgres/PostGIS, but do not add that complexity to the first prototype unless requested.

## 18. Error states and recovery

Implement polished empty/error/loading states for:

- No route planned.
- Route open but loop closure required.
- Invalid/self-intersecting AOI.
- Simulation start while already running.
- Pause/resume/abort from the wrong state.
- Browser timer throttled/background tab.
- CSV parse failure, missing lat/lon, missing magnetic field, unknown units, invalid rows, huge file.
- GEE not configured, authentication denied, API not enabled, no imagery for period, no scenes after cloud filtering, timeout/quota/permission failure.
- IndexedDB quota/storage failure and browser refresh during an active mission.
- No data samples inside AOI / no valid interpolation cells.
- Missing elevation. In this state use `null` and a visible fallback indicator; do not fabricate an elevation and label it as live DEM.

When the browser refreshes during an active simulation, ask the user whether to restore the paused demo session if sufficient state was persisted, or discard it. Do not pretend the simulation continued while the app was closed.

## 19. Accessibility, responsive behaviour and performance

- Ensure all actions are keyboard accessible and have focus styles/accessible labels.
- Never rely on red/green alone; pair status colour with text/icons.
- Give map tool icons descriptive tooltips and accessible button names.
- Keep text and numeric labels legible over map imagery by using solid/light panels, not white text directly on busy satellite tiles.
- At 1600×900 match the reference composition closely.
- At tablet/small widths, collapse the right control panel into a drawer and stack floating telemetry cards. Preserve map interaction.
- Limit heat-map grid cells and use Canvas rendering or raster/tile overlays rather than thousands of DOM nodes.
- Throttle map marker updates; do not recreate all layers on every telemetry tick.
- Debounce GEE requests and prevent an old response overwriting the latest AOI/date selection.
- Add visible loading indicators for slow GEE requests, with cancel/retry where practical.

## 20. README.md is a required deliverable

Create a complete, beginner-friendly `README.md` in the project root. Assume the person running this project understands basic coding but may be new to GEE configuration. Include:

1. Project purpose and feature summary.
2. Prominent simulation/scientific limitation notice.
3. Screens/interaction description and screenshot/reference note.
4. Architecture diagram in Mermaid showing Frontend ↔ FastAPI ↔ Google Earth Engine, plus IndexedDB archive and CSV flow.
5. Prerequisites: Node.js LTS, Python 3.11+, Git, browser, and optional Google Cloud account.
6. Step-by-step local setup for macOS and Windows where practical.
7. Frontend install/run commands.
8. Backend virtual environment, install, and run commands.
9. `.env` creation using `.env.example` without exposing secrets.
10. GEE setup walkthrough: create/select Cloud project, enable Earth Engine API, register for the correct access type, authenticate locally or configure ADC/service account, set project ID, test `/api/gee/status`, and troubleshoot common errors.
11. Clear note that Earth Engine’s access model/price depends on current terms and user eligibility; link the official access and noncommercial pages.
12. How to run in synthetic-only mode when GEE is not configured.
13. How to load the demo route, draw an AOI, generate a route, start/pause/resume/complete/abort, and download a CSV.
14. How to open the Data Processing Library, select archived sessions, upload another CSV, map field aliases, resolve unit choices, and generate/export a heat map.
15. CSV data dictionary with columns, units and definitions.
16. Meaning of nT, total field vs anomaly, AGL vs MSL, data source badges, GEE imagery dates and the relative index.
17. Data persistence: archive stays in the current browser/device unless exported; how to download/delete sessions.
18. Test commands and build commands.
19. Troubleshooting for port conflicts, Python package/earthengine errors, frontend build failures, empty satellite imagery, CSV parse errors and storage quotas.
20. Limitations, validation roadmap, attribution and official data-source links.

Include copy-and-paste commands rather than assuming global packages have already been installed. Keep `.env.example` safe to commit and include `.env`, private key JSON, and local credential locations in `.gitignore`.

## 21. Suggested developer scripts

Use root-level scripts or document separate commands. Expected examples:

```bash
# Frontend (inside frontend/)
npm install
npm run dev
npm run test
npm run build

# Backend (inside backend/; macOS/Linux)
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Backend (Windows PowerShell)
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Ensure the README matches the actual implemented commands, filenames, ports and environment variables. Do not leave placeholder instructions that contradict the app.

## 22. Test plan and acceptance criteria

The task is complete only when the following checks are implemented and pass. Mark each with a test or manual verification note in the README or `docs/test-plan.md`.

### Visual and layout

- [ ] At 1600×900 the design clearly resembles the screenshot: top command bar, central satellite/map canvas, left tool rail, floating white telemetry cards, bottom-left artificial horizon/compass, bottom status strip, and fixed right control panel.
- [ ] The application uses a light theme for UI panels and controls.
- [ ] Telemetry panels do not obscure the primary route or aircraft marker excessively.
- [ ] The right panel remains scrollable and the map usable on smaller widths.

### Mission planning and simulation

- [ ] User can draw, edit and delete an AOI polygon.
- [ ] User can generate a lawnmower survey route with configurable spacing.
- [ ] User can create and edit a manual route.
- [ ] The route closure setting is visible and testable; closed routes start and finish at the exact same coordinate.
- [ ] The map aircraft marker moves smoothly along the planned line and the waypoint highlight advances in order.
- [ ] Current latitude/longitude, heading, speed, altitude, distance, timer, battery, attitude, and magnetometer values update in synchrony with movement.
- [ ] Pausing freezes route progress; resuming continues from the same point.
- [ ] Normal completion finalises a dataset and saves it to IndexedDB.
- [ ] Abort creates clearly labelled partial data and does not masquerade as a completed loop.
- [ ] Demo data is deterministic when the seed/settings are unchanged.

### CSV and archive

- [ ] `Download CSV` provides a real downloadable file containing valid headers, multiple rows, valid coordinates and timestamps.
- [ ] CSV timestamps and mission elapsed time are monotonic for normal completed flights.
- [ ] The final closed-loop record returns to the launch coordinate (within agreed floating-point tolerance).
- [ ] The archive survives a browser refresh.
- [ ] Data Processing opens a file-explorer-style library and can select a saved CSV.
- [ ] External CSV upload, preview, field mapping, validation and errors work.
- [ ] Units and missing columns are handled explicitly; unknown values are not silently interpreted.

### Heat map

- [ ] Processing produces a spatially located heat map and visible legend.
- [ ] In the demo scenario, the main hotspot is near the hidden planted synthetic anomaly, not randomly elsewhere.
- [ ] User can toggle the heat-map opacity and underlying route/sample layers.
- [ ] Processing includes a local-support/nearest-sample-distance warning or masks unsurveyed regions.
- [ ] External CSVs without a score column produce a labelled relative magnetic-anomaly layer, not a fake iron probability.
- [ ] Processed grid/export metadata records processing parameters and synthetic/real provenance.

### Google Earth Engine

- [ ] A working configuration can request real Sentinel-2 and DEM map layers from GEE, with the actual dataset ID and imagery date range visible.
- [ ] GEE requests are made from the backend; credentials never appear in the browser bundle.
- [ ] Spectral proxies are explicitly labelled experimental surface indicators.
- [ ] GEE-offline mode remains usable for simulated flights and CSV anomaly heat maps and displays a truthful GEE status.
- [ ] No real satellite imagery is fabricated when GEE is unavailable.
- [ ] Date ranges with no data and cloud-masked/empty collections show a recoverable message.

### Documentation and quality

- [ ] `README.md` includes complete installation, GEE setup, running, demo flow, CSV schema, limitations, testing and troubleshooting.
- [ ] `.env.example` and `.gitignore` are present and safe.
- [ ] Frontend builds without TypeScript errors.
- [ ] Backend starts without syntax/import errors.
- [ ] Automated tests cover route closure, simulation progression, magnetometer determinism, CSV schema validation, IDW interpolation and GEE error handling where practical.
- [ ] There are no inert buttons, fake success messages, unexplained placeholder charts, or hardcoded credentials.

## 23. Recommended build order

Implement in this order so the application becomes demonstrable early while the more advanced GEE processing is added safely:

1. Create app shell and screenshot-inspired responsive light-theme layout.
2. Implement map, default Bailadila-area viewport, layer legend, waypoint marker and demo geometry.
3. Implement drawing/editing, AOI validation, route generation, and closed-loop check.
4. Implement deterministic simulation state machine, marker movement, telemetry cards, attitude indicator, timer and controls.
5. Implement synthetic magnetometer field/anomaly model and live mini-charts.
6. Implement finalisation, CSV download, IndexedDB archive and data-library modal.
7. Implement CSV upload/validation/preview and process selected archive files.
8. Implement IDW anomaly heat map, legend, hotspot click inspection, result panel and exports.
9. Add FastAPI and real GEE RGB/false-colour/DEM/slope layers with clear metadata and fallbacks.
10. Add numeric GEE sample extraction and optional composite spectral/magnetic index.
11. Write and verify README, `.env.example`, tests, accessibility, loading/error states and responsive refinements.
12. Run the full acceptance checklist; fix gaps before calling the project complete.

Do not overbuild real aircraft connectivity, user authentication, cloud storage, database, or advanced machine learning at this stage. The goal is a convincing, coherent and scientifically transparent **simulation dashboard plus real geospatial context**, not a production flight controller or validated mineral exploration system.

## 24. Data provenance and reference links

Use these links as the starting source list and include them in the README. Recheck dataset availability and Google terms when setting up the app because service rules can change.

1. **NMDC — Bailadila Iron Ore Mine, Bacheli Complex** (official company page): https://www.nmdc.co.in/about-nmdc/operating-mines/bailadila-iron-ore-mine-bacheli-complex
2. **NMDC Limited** (official company website): https://www.nmdc.co.in/
3. **Government of India Ministry of Mines — Bailadila Deposit 01 block document**: https://mines.gov.in/admin/storage/ckeditor/All_states_PPTs_%281%29_1737545150.pdf
4. **Google Earth Engine — Sentinel-2 Level-2A SR Harmonized catalog**: https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED
5. **Google Earth Engine — Sentinel-2 Level-1C Harmonized catalog**: https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_HARMONIZED
6. **Google Earth Engine — SRTM 30 m elevation catalog**: https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003
7. **Google Earth Engine — NASADEM catalog**: https://developers.google.com/earth-engine/datasets/catalog/NASA_NASADEM_HGT_001
8. **Google Earth Engine access / Cloud project registration**: https://developers.google.com/earth-engine/guides/access
9. **Google Earth Engine authentication**: https://developers.google.com/earth-engine/guides/auth
10. **Google Earth Engine service accounts**: https://developers.google.com/earth-engine/guides/service_account
11. **Google Earth Engine Python setup**: https://developers.google.com/earth-engine/guides/python_install
12. **Google Earth Engine noncommercial eligibility and use terms**: https://earthengine.google.com/noncommercial/

---

## Final instruction

Deliver a complete working application and the required **`README.md`**, with `implementation.md` retained in the repository as the full development specification. Prioritise fidelity to the supplied screenshot, coherent flight-linked telemetry, a reliable CSV/record-library workflow, a meaningful spatial heat map, and honest separation between synthetic magnetometer data and genuine GEE imagery. Make the default demo work with one click, then let the user draw and simulate their own survey.
