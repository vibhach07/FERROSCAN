# Scientific Boundaries & Prototype Limitations

## 1. Prototype Limitation Notice

> [!WARNING]
> The ANVESHAA Airborne Survey Flight platform is an exploratory research demonstrator and software simulator. It is **not** a confirmed mineral detector, an ore-reserve estimator, or a replacement for ground geology.

---

## 2. Core Scientific Distinctions

### 2.1 Synthetic Magnetometer Telemetry
- All magnetometer total field ($B_{\text{total}}$), residual anomaly ($\Delta B$), and noise readings generated during simulated flights are produced by mathematical Gaussian models in code.
- Google Earth Engine (GEE) provides optical and terrain surface datasets; GEE does **not** provide physical UAV magnetometer measurements.

### 2.2 Sentinel-2 Optical Imagery is Surface-Only
- Sentinel-2 Level-2A measures solar radiation reflected from the uppermost millimeter of the Earth's surface and vegetation canopy.
- The ferric-iron / iron-oxide spectral proxy ($B_4 / B_2$ band contrast) reflects surface color, gossan staining, and weathered exposed soils.
- Weathering, tropical soils (laterites), dense vegetation, shadows, and open-pit mine disturbances heavily influence optical reflectance. An optical ratio cannot measure unexposed subsurface ore bodies.

### 2.3 Magnetite vs. Hematite Mineralogy
- Magnetic susceptibility differs by orders of magnitude between iron mineral species:
  - **Magnetite ($\text{Fe}_3\text{O}_4$)**: Strongly ferrimagnetic ($\kappa \approx 0.1 - 1.0\text{ SI}$), producing strong localized magnetic anomalies (+500 to +3000 nT).
  - **Hematite ($\text{Fe}_2\text{O}_3$)**: Weakly canted antiferromagnetic, yielding subtle or negligible magnetic signatures.
- High-grade iron ore deposits in India (such as Bailadila, Noamundi, and Joda) are overwhelmingly hematite-dominant. A magnetometer alone cannot detect all hematite deposits.

### 2.4 Exploratory Relative Prospectivity Index
- All generated scores are explicitly termed **Relative Prospectivity Index (0–100)**.
- A score of 90 indicates that a cell ranks in the upper percentile of this specific dataset's relative response. It does **not** mean a 90% probability of finding iron ore or 90% Fe grade.
- Mineral discovery requires integrated field geological mapping, core drilling, geochemistry, and gravimetric geophysics.

---

## 3. Illustrative Bailadila Study Area

The default demonstration mission center (`18.615°N, 81.231°E`) is positioned in the Bailadila Range area, Dantewada district, Chhattisgarh, India, referencing NMDC's public mine complex context. The demo polygons and planted synthetic anomaly targets are illustrative geometry generated in software, not official mine lease boundaries or classified geological bodies.
