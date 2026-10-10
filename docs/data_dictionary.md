# ANVESHAA Airborne Survey Flight — CSV Data Dictionary

This document defines the schema, units, and definitions for all 27 columns recorded during simulated flight surveys and exported as CSV files.

---

## 1. Flight & Mission Metadata

| Column | Data Type | Units / Example | Definition |
| :--- | :--- | :--- | :--- |
| `flight_id` | String | `FLT-BAILADILA-01` | Unique identifier generated for the survey flight session. |
| `mission_name` | String | `Bailadila_Iron_Demo_Survey_01` | Operator-assigned survey name. |
| `mission_timestamp_utc` | ISO-8601 String | `2016-08-29T14:15:15Z` | Monotonic mission simulation clock timestamp in UTC. |
| `simulation_elapsed_s` | Float | `142.5` (seconds) | Cumulative mission duration elapsed in seconds. |
| `sample_index` | Integer | `0, 1, 2...` | Sequential 0-indexed telemetry sample count. |

---

## 2. Spatial Navigation & Positioning

| Column | Data Type | Units / Range | Definition |
| :--- | :--- | :--- | :--- |
| `latitude` | Float | Decimal Degrees `[-90, 90]` | Actual simulated aircraft coordinate (includes small realistic RTK GNSS jitter). |
| `longitude` | Float | Decimal Degrees `[-180, 180]` | Actual simulated aircraft coordinate (includes small realistic RTK GNSS jitter). |
| `planned_latitude` | Float | Decimal Degrees `[-90, 90]` | Ideal pre-planned waypoint track coordinate. |
| `planned_longitude` | Float | Decimal Degrees `[-180, 180]` | Ideal pre-planned waypoint track coordinate. |
| `heading_deg` | Float | Degrees `[0, 359.99]` | Aircraft azimuth heading clockwise relative to True North. |
| `ground_speed_mps` | Float | Meters/second (`m/s`) | Aircraft horizontal speed across the ground. |
| `vertical_speed_mps` | Float | Meters/second (`m/s`) | Vertical climb rate (positive) or descent rate (negative). |
| `altitude_agl_m` | Float | Meters (`m`) | Flight altitude Above Ground Level (AGL). |
| `elevation_m_msl` | Float / Null | Meters (`m`) | Terrain surface elevation above Mean Sea Level (MSL) from DEM or local topography. |
| `altitude_m_msl` | Float / Null | Meters (`m`) | Aircraft absolute altitude MSL (`elevation_m_msl + altitude_agl_m`). |
| `distance_from_home_m` | Float | Meters (`m`) | Line-of-sight geodesic distance from Waypoint 0 (Launch origin). |
| `distance_travelled_m` | Float | Meters (`m`) | Cumulative distance flown along survey path (odometer). |
| `waypoint_index` | Integer | `0, 1, 2...` | Active target waypoint index currently being navigated. |

---

## 3. Avionics & Power

| Column | Data Type | Units / Range | Definition |
| :--- | :--- | :--- | :--- |
| `battery_percent` | Float | Percentage `[0, 100]` | Main 6S propulsion LiPo battery state of charge. |
| `linkQualityPercent` | Integer | Percentage `[0, 100]` | Simulated 2.4 GHz digital command link signal quality. |
| `gps_fix_status` | String | `RTK FIX (Simulated)` | Navigation satellite positioning accuracy solution. |
| `sensor_status` | String | `Active / Sampling` | Payload acquisition state. |

---

## 4. Geophysical Magnetometry Channels

| Column | Data Type | Units | Definition |
| :--- | :--- | :--- | :--- |
| `mag_total_field_nt` | Float | Nanotesla (`nT`) | Total scalar geomagnetic field intensity: $B_{\text{total}} = B_{\text{bg}} + \Delta B + \text{noise}$. |
| `magnetic_anomaly_nt` | Float | Nanotesla (`nT`) | Residual local magnetic anomaly after regional background trend removal: $\Delta B = B_{\text{total}} - B_{\text{bg}}$. |
| `magnetometer_noise_nt` | Float | Nanotesla (`nT`) | Seeded Gaussian instrument noise component ($\sigma \approx 6.5 \text{ nT}$). |
| `synthetic_iron_score_pct` | Float / Null | Percentage `[0, 100]` | Demonstrator synthetic relative score mapped to planted anomaly target bodies. |
| `data_origin` | String | `synthetic_simulation` \| `uploaded_csv` | Provenance label indicating whether measurements were software-simulated or uploaded. |

---

## 5. Standard Units Summary

- **Magnetic Intensity**: Nanotesla ($1 \text{ nT} = 10^{-9} \text{ Tesla} = 1 \text{ gamma}$).
- **Coordinates**: Decimal degrees in WGS84 datum (EPSG:4326).
- **Altitudes & Distances**: International metric meters ($\text{m}$).
- **Velocities**: Meters per second ($\text{m/s}$).
