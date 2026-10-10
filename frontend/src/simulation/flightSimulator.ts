import {
  LatLng,
  MissionSettings,
  MissionStatus,
  Waypoint,
} from '../types/mission';
import { AircraftAttitude, TelemetrySample } from '../types/telemetry';
import {
  calculateBearingDegrees,
  calculateDistanceMeters,
  interpolateLatLng,
} from '../map/geoUtils';
import { SyntheticMagnetometerModel } from './syntheticMagnetometer';

export interface SimulatorCallbacks {
  onTelemetryTick: (sample: TelemetrySample, attitude: AircraftAttitude) => void;
  onStateChange: (status: MissionStatus) => void;
  onMissionCompleted: (samples: TelemetrySample[]) => void;
  onMissionAborted: (samples: TelemetrySample[]) => void;
}

export class FlightSimulator {
  private status: MissionStatus = 'IDLE';
  private flightId: string = '';
  private waypoints: Waypoint[] = [];
  private settings: MissionSettings;
  private magModel: SyntheticMagnetometerModel | null = null;
  private callbacks: SimulatorCallbacks;

  // Flight progress tracking
  private currentSegmentIndex: number = 0;
  private distanceAlongSegmentM: number = 0;
  private currentCoord: LatLng = { lat: 0, lng: 0 };
  private currentAltitudeAglM: number = 60;
  private targetAltitudeAglM: number = 60;
  private currentHeadingDeg: number = 0;
  private targetHeadingDeg: number = 0;
  private groundSpeedMps: number = 0;
  private verticalSpeedMps: number = 0;
  private isLoitering: boolean = false;

  // Cumulative metrics
  private distanceTravelledM: number = 0;
  private totalRouteDistanceM: number = 0;
  private elapsedSeconds: number = 0;
  private sampleIndex: number = 0;
  private batteryPercent: number = 100;

  // Timing loops
  private animationFrameId: number | null = null;
  private lastFrameTimestampMs: number = 0;
  private nextSampleDueElapsedS: number = 0;
  private loggedSamples: TelemetrySample[] = [];

  // Attitude
  private attitude: AircraftAttitude = { pitchDeg: 0, rollDeg: 0, yawDeg: 0 };

  constructor(settings: MissionSettings, callbacks: SimulatorCallbacks) {
    this.settings = { ...settings };
    this.callbacks = callbacks;
  }

  public setMission(
    waypoints: Waypoint[],
    settings: MissionSettings,
    flightId?: string
  ) {
    this.waypoints = waypoints;
    this.settings = { ...settings };
    this.flightId = flightId || `FLT-${Date.now().toString(36).toUpperCase()}`;
    this.currentSegmentIndex = 0;
    this.distanceAlongSegmentM = 0;
    this.distanceTravelledM = 0;
    this.elapsedSeconds = 0;
    this.sampleIndex = 0;
    this.batteryPercent = 100;
    this.loggedSamples = [];
    this.isLoitering = false;

    if (waypoints.length > 0) {
      this.currentCoord = { lat: waypoints[0].lat, lng: waypoints[0].lng };
      this.currentAltitudeAglM = settings.altitudeAglM;
      this.targetAltitudeAglM = settings.altitudeAglM;

      if (waypoints.length > 1) {
        this.currentHeadingDeg = calculateBearingDegrees(waypoints[0], waypoints[1]);
        this.targetHeadingDeg = this.currentHeadingDeg;
      }

      this.magModel = new SyntheticMagnetometerModel(
        this.currentCoord,
        settings.sensorMode,
        settings.randomSeed
      );

      this.totalRouteDistanceM = 0;
      for (let i = 0; i < waypoints.length - 1; i++) {
        this.totalRouteDistanceM += calculateDistanceMeters(waypoints[i], waypoints[i + 1]);
      }

      this.setStatus('READY');
    } else {
      this.setStatus('IDLE');
    }
  }

  public getStatus(): MissionStatus {
    return this.status;
  }

  public getLoggedSamples(): TelemetrySample[] {
    return [...this.loggedSamples];
  }

  public startSimulation() {
    if (this.status !== 'READY' && this.status !== 'PLANNED') {
      return;
    }
    this.setStatus('RUNNING');
    this.lastFrameTimestampMs = performance.now();
    this.nextSampleDueElapsedS = 0;
    this.scheduleTick();
  }

  public pauseSimulation() {
    if (this.status === 'RUNNING') {
      this.setStatus('PAUSED');
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  }

  public resumeSimulation() {
    if (this.status === 'PAUSED') {
      this.setStatus('RUNNING');
      this.lastFrameTimestampMs = performance.now();
      this.scheduleTick();
    }
  }

  public returnToHome() {
    if (this.status === 'RUNNING' || this.status === 'PAUSED') {
      this.setStatus('RETURNING_HOME');
      if (this.status === 'PAUSED') {
        this.lastFrameTimestampMs = performance.now();
        this.scheduleTick();
      }
    }
  }

  public abortSimulation() {
    if (this.status === 'RUNNING' || this.status === 'PAUSED' || this.status === 'RETURNING_HOME') {
      this.setStatus('ABORTED');
      this.stopSimulation();
      this.callbacks.onMissionAborted(this.loggedSamples);
    }
  }

  public completeMission() {
    this.setStatus('COMPLETED');
    this.stopSimulation();

    // Ensure final record is exact home coordinate
    if (this.waypoints.length > 0 && this.loggedSamples.length > 0) {
      const home = this.waypoints[0];
      const last = this.loggedSamples[this.loggedSamples.length - 1];
      if (
        Math.abs(last.latitude - home.lat) > 1e-7 ||
        Math.abs(last.longitude - home.lng) > 1e-7
      ) {
        this.currentCoord = { lat: home.lat, lng: home.lng };
        this.recordTelemetrySample();
      }
    }

    this.callbacks.onMissionCompleted(this.loggedSamples);
  }

  public setLoiter(loiter: boolean) {
    this.isLoitering = loiter;
  }

  public isLoiterActive(): boolean {
    return this.isLoitering;
  }

  public setTargetAltitude(altitudeM: number) {
    this.targetAltitudeAglM = Math.max(10, Math.min(250, altitudeM));
  }

  public setTimeScale(scale: 1 | 2 | 5) {
    this.settings.simulationTimeScale = scale;
  }

  private setStatus(newStatus: MissionStatus) {
    this.status = newStatus;
    this.callbacks.onStateChange(newStatus);
  }

  private stopSimulation() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.groundSpeedMps = 0;
    this.verticalSpeedMps = 0;
  }

  private scheduleTick() {
    this.animationFrameId = requestAnimationFrame((now) => this.tick(now));
  }

  private tick(timestampMs: number) {
    if (this.status !== 'RUNNING' && this.status !== 'RETURNING_HOME') {
      return;
    }

    const dtRealSec = Math.min(0.2, (timestampMs - this.lastFrameTimestampMs) / 1000.0);
    this.lastFrameTimestampMs = timestampMs;

    const timeScale = this.settings.simulationTimeScale;
    const dtSimSec = dtRealSec * timeScale;
    this.elapsedSeconds += dtSimSec;

    // Smooth altitude adjustment
    const altDiff = this.targetAltitudeAglM - this.currentAltitudeAglM;
    if (Math.abs(altDiff) > 0.1) {
      const climbRate = 2.0; // m/s climb/descent capability
      const maxDelta = climbRate * dtSimSec;
      const step = Math.sign(altDiff) * Math.min(Math.abs(altDiff), maxDelta);
      this.currentAltitudeAglM += step;
      this.verticalSpeedMps = step / dtSimSec;
    } else {
      this.currentAltitudeAglM = this.targetAltitudeAglM;
      this.verticalSpeedMps = 0;
    }

    // Battery depletion model
    const totalEnduranceSec = this.settings.nominalEnduranceMinutes * 60;
    const batteryDrainRatePerSec = 100 / totalEnduranceSec;
    this.batteryPercent = Math.max(0, 100 - this.elapsedSeconds * batteryDrainRatePerSec);

    if (this.batteryPercent <= 5) {
      // Emergency return to home on critical battery
      if (this.status === 'RUNNING') {
        this.returnToHome();
      }
    }

    if (this.isLoitering) {
      // Hold/orbit mode
      this.groundSpeedMps = 0;
      this.currentHeadingDeg = (this.currentHeadingDeg + 15 * dtSimSec) % 360;
      this.attitude = {
        pitchDeg: this.verticalSpeedMps * 2.5,
        rollDeg: 5,
        yawDeg: this.currentHeadingDeg,
      };
    } else {
      // Advance along route
      this.groundSpeedMps = this.settings.speedMps;
      const distanceStepM = this.groundSpeedMps * dtSimSec;
      this.advanceRoute(distanceStepM, dtSimSec);
    }

    // Telemetry sampling at configured frequency (e.g. 1 Hz)
    const sampleIntervalSec = 1.0 / this.settings.sampleRateHz;
    if (this.elapsedSeconds >= this.nextSampleDueElapsedS) {
      this.recordTelemetrySample();
      this.nextSampleDueElapsedS += sampleIntervalSec;
    }

    // Dispatch current animated frame to UI
    if (this.loggedSamples.length > 0) {
      const latest = this.loggedSamples[this.loggedSamples.length - 1];
      this.callbacks.onTelemetryTick(latest, this.attitude);
    }

    if (this.status === 'RUNNING' || this.status === 'RETURNING_HOME') {
      this.scheduleTick();
    }
  }

  private advanceRoute(distanceStepM: number, dtSimSec: number) {
    if (this.waypoints.length < 2) return;

    if (this.status === 'RETURNING_HOME') {
      // Return straight home to waypoint 0
      const home = this.waypoints[0];
      const distToHome = calculateDistanceMeters(this.currentCoord, home);
      if (distToHome <= distanceStepM || distToHome < 1.0) {
        this.currentCoord = { lat: home.lat, lng: home.lng };
        this.completeMission();
        return;
      }
      const t = Math.min(1.0, distanceStepM / distToHome);
      this.currentCoord = interpolateLatLng(this.currentCoord, home, t);
      this.targetHeadingDeg = calculateBearingDegrees(this.currentCoord, home);
      this.updateAttitude(dtSimSec);
      this.distanceTravelledM += distanceStepM;
      return;
    }

    // Normal multi-segment route following
    let remainingStepM = distanceStepM;

    while (remainingStepM > 0 && this.currentSegmentIndex < this.waypoints.length - 1) {
      const p1 = this.waypoints[this.currentSegmentIndex];
      const p2 = this.waypoints[this.currentSegmentIndex + 1];
      const segmentLengthM = calculateDistanceMeters(p1, p2);

      const remainingInSegmentM = segmentLengthM - this.distanceAlongSegmentM;

      if (remainingStepM < remainingInSegmentM) {
        this.distanceAlongSegmentM += remainingStepM;
        const fraction = this.distanceAlongSegmentM / Math.max(1e-3, segmentLengthM);
        this.currentCoord = interpolateLatLng(p1, p2, fraction);
        this.targetHeadingDeg = calculateBearingDegrees(p1, p2);
        this.distanceTravelledM += remainingStepM;
        remainingStepM = 0;
      } else {
        // Reached end of current segment
        remainingStepM -= remainingInSegmentM;
        this.distanceTravelledM += remainingInSegmentM;
        this.distanceAlongSegmentM = 0;
        this.currentSegmentIndex++;

        if (this.currentSegmentIndex >= this.waypoints.length - 1) {
          // Reached final waypoint
          const finalWp = this.waypoints[this.waypoints.length - 1];
          this.currentCoord = { lat: finalWp.lat, lng: finalWp.lng };
          this.completeMission();
          return;
        }
      }
    }

    this.updateAttitude(dtSimSec);
  }

  private updateAttitude(dtSimSec: number) {
    // Heading turn smoothing
    let headingDiff = this.targetHeadingDeg - this.currentHeadingDeg;
    while (headingDiff > 180) headingDiff -= 360;
    while (headingDiff < -180) headingDiff += 360;

    const maxHeadingTurnRateDegPerSec = 35;
    const maxTurnStep = maxHeadingTurnRateDegPerSec * dtSimSec;
    const turnStep = Math.sign(headingDiff) * Math.min(Math.abs(headingDiff), maxTurnStep);

    this.currentHeadingDeg = (this.currentHeadingDeg + turnStep + 360) % 360;

    // Bank angle (roll) proportional to turn rate
    const turnRate = turnStep / Math.max(1e-3, dtSimSec);
    const targetRollDeg = Math.max(-25, Math.min(25, -turnRate * 0.7));
    const targetPitchDeg = Math.max(-15, Math.min(15, this.verticalSpeedMps * 2.8));

    this.attitude = {
      pitchDeg: Math.round(targetPitchDeg * 10) / 10,
      rollDeg: Math.round(targetRollDeg * 10) / 10,
      yawDeg: Math.round(this.currentHeadingDeg * 10) / 10,
    };
  }

  private recordTelemetrySample() {
    if (!this.magModel || this.waypoints.length === 0) return;

    const home = this.waypoints[0];
    const distanceFromHomeM = calculateDistanceMeters(this.currentCoord, home);

    // Magnetic model reading at current coordinate
    const magReading = this.magModel.evaluate(this.currentCoord, this.sampleIndex);

    // Simulated elevation (illustrative local topography in Bailadila ~640m - 720m MSL)
    const baseElevationMslM = 685.0;
    const localTopographyM = Math.sin(this.currentCoord.lat * 1000) * 15.0;
    const elevationMslM = Math.round((baseElevationMslM + localTopographyM) * 10) / 10;
    const altitudeMslM = Math.round((elevationMslM + this.currentAltitudeAglM) * 10) / 10;

    // Derived mission clock timestamp
    const missionStartDate = new Date(this.settings.simulatedStartTimeUtc);
    const currentTimestamp = new Date(
      missionStartDate.getTime() + this.elapsedSeconds * 1000
    ).toISOString();

    const plannedLat = this.currentCoord.lat;
    const plannedLng = this.currentCoord.lng;

    // Slight realistic GPS jitter (stddev ~0.3m) in reported coordinates
    const latJitter = (Math.sin(this.sampleIndex * 3.7) * 0.000003);
    const lngJitter = (Math.cos(this.sampleIndex * 2.9) * 0.000003);

    const sample: TelemetrySample = {
      flightId: this.flightId,
      missionName: this.settings.missionName,
      missionTimestampUtc: currentTimestamp,
      simulationElapsedS: Math.round(this.elapsedSeconds * 10) / 10,
      sampleIndex: this.sampleIndex++,
      latitude: parseFloat((plannedLat + latJitter).toFixed(7)),
      longitude: parseFloat((plannedLng + lngJitter).toFixed(7)),
      plannedLatitude: parseFloat(plannedLat.toFixed(7)),
      plannedLongitude: parseFloat(plannedLng.toFixed(7)),
      headingDeg: Math.round(this.currentHeadingDeg * 10) / 10,
      groundSpeedMps: Math.round(this.groundSpeedMps * 10) / 10,
      verticalSpeedMps: Math.round(this.verticalSpeedMps * 10) / 10,
      altitudeAglM: Math.round(this.currentAltitudeAglM * 10) / 10,
      elevationMslM,
      altitudeMslM,
      distanceFromHomeM: Math.round(distanceFromHomeM * 10) / 10,
      distanceTravelledM: Math.round(this.distanceTravelledM * 10) / 10,
      waypointIndex: Math.min(this.waypoints.length - 1, this.currentSegmentIndex),
      batteryPercent: Math.round(this.batteryPercent * 10) / 10,
      linkQualityPercent: Math.min(100, Math.max(88, Math.round(98 - (distanceFromHomeM / 2000) * 10))),
      magTotalFieldNt: magReading.totalFieldNt,
      magneticAnomalyNt: magReading.magneticAnomalyNt,
      magnetometerNoiseNt: magReading.noiseNt,
      syntheticIronScorePct: magReading.syntheticIronScorePct,
      gpsFixStatus: 'RTK FIX (Simulated)',
      sensorStatus: 'Active / Sampling',
      dataOrigin: 'synthetic_simulation',
    };

    this.loggedSamples.push(sample);
  }
}
