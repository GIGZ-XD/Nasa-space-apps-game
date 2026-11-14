/**
 * Subsystem categories for spacecraft components based on standard aerospace engineering disciplines.
 */
export type ComponentCategory =
  | "structure"
  | "power"
  | "propulsion"
  | "thermal"
  | "communications"
  | "avionics"
  | "payload";

/**
 * Core component representation in the catalogue.
 * All physical and engineering quantities have documented standard SI/aerospace units.
 */
export interface Component {
  /** Stable unique identifier (e.g., "bus-cubesat-3u", "solar-panel-deployable-100w") */
  id: string;

  /** Display name of the component */
  name: string;

  /** Subsystem category */
  category: ComponentCategory;

  /** Technical description and intended operational role */
  description: string;

  /** Mass in kilograms (kg) */
  massKg: number;

  /** Net power in Watts (W). Positive = power consumed; negative = power generated */
  powerWatts: number;

  /** Procurement / manufacturing cost in credits */
  costCredits: number;

  /** Thermal heat dissipation in Watts (W) */
  thermalWatts: number;

  /** Optional subsystem-specific specifications */
  specs?: {
    /** Data generation or throughput in kilobits per second (kbps) */
    dataRateKbps?: number;
    /** Thrust delivered in Newtons (N) */
    thrustN?: number;
    /** Specific impulse in seconds (s) */
    ispSeconds?: number;
    /** Battery energy storage capacity in Watt-hours (Wh) */
    energyStorageWh?: number;
    /** Heat rejection capacity in Watts (W) */
    heatRejectionWatts?: number;
    /** Structural slot/form factor compatibility (e.g., "3U", "12U", "ESPA") */
    formFactor?: string;
  };
}

/**
 * Target orbit types supported by the mission architect.
 */
export type OrbitType =
  | "LEO"
  | "SSO"
  | "MEO"
  | "GEO"
  | "LUNAR"
  | "INTERPLANETARY";

/**
 * Orbit target selection option.
 */
export interface OrbitTarget {
  /** Stable unique identifier (e.g., "orbit-leo-400", "orbit-geo-circular") */
  id: string;

  /** Display name of target orbit */
  name: string;

  /** Orbit regime classification */
  type: OrbitType;

  /** Target orbital altitude in kilometers (km) above reference surface */
  altitudeKm: number;

  /** Orbital inclination relative to the equator in degrees (deg) */
  inclinationDeg: number;

  /** Characteristic velocity required from launch to achieve orbit (m/s) */
  deltaVRequiredMps: number;

  /** Mission operational description and environment challenges */
  description: string;
}

/**
 * Launch vehicle selection option.
 */
export interface LauncherTarget {
  /** Stable unique identifier (e.g., "launcher-electron", "launcher-falcon9") */
  id: string;

  /** Commercial or vehicle name */
  name: string;

  /** Maximum payload mass to Low Earth Orbit in kilograms (kg) */
  payloadCapacityLeoKg: number;

  /** Maximum payload mass to Geostationary Transfer Orbit in kilograms (kg) */
  payloadCapacityGtoKg: number;

  /** Dedicated launch service cost in credits */
  costCredits: number;

  /** Payload fairing internal usable diameter in meters (m) */
  fairingDiameterM: number;

  /** Payload fairing internal usable height in meters (m) */
  fairingHeightM: number;

  /** Reliability rating percentage (0 - 100) */
  reliabilityPercent: number;

  /** Description of launch capabilities */
  description: string;
}
