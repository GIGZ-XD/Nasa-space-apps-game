/**
 * Local Component Catalogue Adapter
 *
 * NOTE: PROVISIONAL DATA NOTICE
 * The data definitions below represent provisional mock datasets for Phase 1.
 * These are temporary placeholders pending official delivery and confirmation
 * from Tanishka (Mission Data Owner) and backend API endpoints from Vineeth.
 *
 * REPLACEMENT POINT:
 * To swap this local adapter with an API-backed service in Phase 2/3, implement
 * the `ComponentCatalogueSource` interface using `apiClient.ts` and inject it
 * into `setCatalogueAdapter(apiAdapter)`.
 */

import type {
  Component,
  ComponentCategory,
  OrbitTarget,
  LauncherTarget,
} from "./component.types";

/**
 * Interface contract for catalogue data sources.
 * Both local and remote API-backed implementations adhere to this contract.
 */
export interface ComponentCatalogueSource {
  getComponents(): Promise<Component[]> | Component[];
  getComponentById(id: string): Promise<Component | undefined> | (Component | undefined);
  getComponentsByCategory(category: ComponentCategory): Promise<Component[]> | Component[];
  getOrbits(): Promise<OrbitTarget[]> | OrbitTarget[];
  getOrbitById(id: string): Promise<OrbitTarget | undefined> | (OrbitTarget | undefined);
  getLaunchers(): Promise<LauncherTarget[]> | LauncherTarget[];
  getLauncherById(id: string): Promise<LauncherTarget | undefined> | (LauncherTarget | undefined);
}

/**
 * Provisional component dataset.
 * Units:
 * - massKg: Kilograms (kg)
 * - powerWatts: Watts (W); positive = power consumption, negative = power generation
 * - costCredits: In-game mission currency credits
 * - thermalWatts: Heat dissipation / load in Watts (W)
 */
export const PROVISIONAL_COMPONENTS: Component[] = [
  // --- STRUCTURE ---
  {
    id: "comp-bus-cubesat-3u",
    name: "3U CubeSat Bus Structure",
    category: "structure",
    description: "Standard aluminum chassis for 3U nanosatellites with integrated internal mounting rails.",
    massKg: 1.5,
    powerWatts: 1.0,
    costCredits: 15000,
    thermalWatts: 1.0,
    specs: { formFactor: "3U" },
  },
  {
    id: "comp-bus-smallsat-espahigh",
    name: "ESPA-Class SmallSat Bus",
    category: "structure",
    description: "Rigid composite ring-compatible satellite bus suitable for secondary payloads up to 180kg.",
    massKg: 45.0,
    powerWatts: 15.0,
    costCredits: 90000,
    thermalWatts: 10.0,
    specs: { formFactor: "ESPA" },
  },

  // --- POWER ---
  {
    id: "comp-pwr-solar-fixed-3u",
    name: "3U Body-Mounted Solar Panels",
    category: "power",
    description: "Gallium-Arsenide triple-junction cells mounted directly to external side faces.",
    massKg: 0.4,
    powerWatts: -24.0, // Generates 24 Watts in sunlight
    costCredits: 8500,
    thermalWatts: 2.0,
  },
  {
    id: "comp-pwr-solar-deployable-100w",
    name: "Deployable Articulated Solar Array (100W)",
    category: "power",
    description: "Double-hinged tracking solar array providing sustained high power generation.",
    massKg: 2.2,
    powerWatts: -100.0, // Generates 100 Watts
    costCredits: 28000,
    thermalWatts: 4.0,
  },
  {
    id: "comp-pwr-battery-li-ion-50wh",
    name: "Li-Ion Space Battery Pack (50Wh)",
    category: "power",
    description: "Space-qualified battery block with integrated cell-balancing and thermal runaway containment.",
    massKg: 0.8,
    powerWatts: 0.5,
    costCredits: 6500,
    thermalWatts: 1.5,
    specs: { energyStorageWh: 50 },
  },

  // --- PROPULSION ---
  {
    id: "comp-prop-cold-gas-thruster",
    name: "Cold Gas R-236fa Thruster Module",
    category: "propulsion",
    description: "Low-complexity, non-toxic cold gas propulsion for orbit maintenance and momentum dumping.",
    massKg: 3.2,
    powerWatts: 5.0,
    costCredits: 22000,
    thermalWatts: 1.0,
    specs: { thrustN: 1.2, ispSeconds: 68 },
  },
  {
    id: "comp-prop-biprop-engine",
    name: "Monopropellant Hydrazine Thruster (20N)",
    category: "propulsion",
    description: "Proven high-thrust monopropellant motor for major orbital insertion maneuvers.",
    massKg: 7.0,
    powerWatts: 12.0,
    costCredits: 48000,
    thermalWatts: 6.0,
    specs: { thrustN: 20.0, ispSeconds: 225 },
  },
  {
    id: "comp-prop-hall-thruster-ion",
    name: "Miniature Hall-Effect Ion Thruster",
    category: "propulsion",
    description: "High-efficiency electric propulsion engine with high specific impulse for deep space cruising.",
    massKg: 8.5,
    powerWatts: 140.0,
    costCredits: 78000,
    thermalWatts: 28.0,
    specs: { thrustN: 0.045, ispSeconds: 1650 },
  },

  // --- THERMAL ---
  {
    id: "comp-thm-passive-mli",
    name: "Multi-Layer Insulation Blanketing (MLI)",
    category: "thermal",
    description: "Reflective aluminized Mylar radiation barrier mitigating harsh deep-space thermal cycling.",
    massKg: 0.5,
    powerWatts: 0.0,
    costCredits: 3500,
    thermalWatts: -10.0,
  },
  {
    id: "comp-thm-active-radiator-panel",
    name: "Active Heat Pipe Radiator Panel",
    category: "thermal",
    description: "Deployable high-emissivity radiator panel with embedded constant-conductance heat pipes.",
    massKg: 3.0,
    powerWatts: 6.0,
    costCredits: 19500,
    thermalWatts: -65.0,
    specs: { heatRejectionWatts: 75 },
  },

  // --- COMMUNICATIONS ---
  {
    id: "comp-com-patch-antenna-uhf",
    name: "S-Band Patch Antenna & Transponder",
    category: "communications",
    description: "Omni-directional telemetry, tracking, and command (TT&C) antenna assembly.",
    massKg: 0.9,
    powerWatts: 9.0,
    costCredits: 12000,
    thermalWatts: 3.0,
    specs: { dataRateKbps: 128 },
  },
  {
    id: "comp-com-xband-dish",
    name: "X-Band High-Gain Steerable Reflector",
    category: "communications",
    description: "High-bandwidth downlink dish designed for scientific payload telemetry backhaul.",
    massKg: 3.4,
    powerWatts: 38.0,
    costCredits: 44000,
    thermalWatts: 14.0,
    specs: { dataRateKbps: 8000 },
  },

  // --- AVIONICS ---
  {
    id: "comp-avi-onboard-computer",
    name: "Rad-Hardened Dual-Core On-Board Computer",
    category: "avionics",
    description: "Fault-tolerant flight computer running real-time operating system with ECC memory.",
    massKg: 0.7,
    powerWatts: 5.5,
    costCredits: 34000,
    thermalWatts: 4.0,
  },
  {
    id: "comp-avi-adcs-reaction-wheels",
    name: "3-Axis ADCS Reaction Wheel Assembly",
    category: "avionics",
    description: "Precision attitude determination and control suite including three reaction wheels and rate gyro.",
    massKg: 2.1,
    powerWatts: 15.0,
    costCredits: 39000,
    thermalWatts: 6.0,
  },

  // --- PAYLOAD ---
  {
    id: "comp-pld-multispectral-imager",
    name: "High-Resolution Multispectral Earth Imager",
    category: "payload",
    description: "Four-band optical sensor for environmental remote sensing and surface mapping.",
    massKg: 4.8,
    powerWatts: 26.0,
    costCredits: 82000,
    thermalWatts: 11.0,
    specs: { dataRateKbps: 18000 },
  },
  {
    id: "comp-pld-space-weather-mag",
    name: "Boom-Mounted Fluxgate Magnetometer",
    category: "payload",
    description: "High-sensitivity sensor for solar wind interaction and planetary magnetosphere investigation.",
    massKg: 1.1,
    powerWatts: 3.5,
    costCredits: 26000,
    thermalWatts: 1.5,
    specs: { dataRateKbps: 16 },
  },
  {
    id: "comp-pld-synthetic-aperture-radar",
    name: "Compact Synthetic Aperture Radar (SAR)",
    category: "payload",
    description: "All-weather day/night radar imaging instrument for surface topography and radar interferometry.",
    massKg: 16.5,
    powerWatts: 130.0,
    costCredits: 135000,
    thermalWatts: 42.0,
    specs: { dataRateKbps: 45000 },
  },
];

/**
 * Provisional orbit catalog options.
 */
export const PROVISIONAL_ORBITS: OrbitTarget[] = [
  {
    id: "orbit-leo-400",
    name: "Low Earth Orbit (400 km Circular)",
    type: "LEO",
    altitudeKm: 400,
    inclinationDeg: 51.6,
    deltaVRequiredMps: 9400,
    description: "Standard ISS-altitude orbit. Low latency communications and moderate atmospheric drag.",
  },
  {
    id: "orbit-sso-600",
    name: "Sun-Synchronous Orbit (600 km Polar)",
    type: "SSO",
    altitudeKm: 600,
    inclinationDeg: 97.8,
    deltaVRequiredMps: 9650,
    description: "Consistent solar illumination angle, optimal for Earth imaging and solar observation.",
  },
  {
    id: "orbit-geo-35786",
    name: "Geostationary Equatorial Orbit (35,786 km)",
    type: "GEO",
    altitudeKm: 35786,
    inclinationDeg: 0.0,
    deltaVRequiredMps: 13850,
    description: "Matches Earth rotation period; ideal for continuous regional communication and weather monitoring.",
  },
  {
    id: "orbit-lunar-polar-100",
    name: "Low Lunar Polar Orbit (100 km)",
    type: "LUNAR",
    altitudeKm: 100,
    inclinationDeg: 90.0,
    deltaVRequiredMps: 15200,
    description: "Comprehensive surface coverage for lunar south pole exploration missions.",
  },
];

/**
 * Provisional launch vehicles catalog options.
 */
export const PROVISIONAL_LAUNCHERS: LauncherTarget[] = [
  {
    id: "launcher-electron",
    name: "Electron (Dedicated SmallSat)",
    payloadCapacityLeoKg: 300,
    payloadCapacityGtoKg: 0,
    costCredits: 75000,
    fairingDiameterM: 1.2,
    fairingHeightM: 2.5,
    reliabilityPercent: 93,
    description: "Rapid, dedicated lightweight launcher ideal for dedicated CubeSat and nanosat missions.",
  },
  {
    id: "launcher-vega-c",
    name: "Vega-C (Medium Payload)",
    payloadCapacityLeoKg: 2300,
    payloadCapacityGtoKg: 800,
    costCredits: 140000,
    fairingDiameterM: 2.6,
    fairingHeightM: 7.0,
    reliabilityPercent: 90,
    description: "European lightweight-medium launcher optimized for polar and scientific payloads.",
  },
  {
    id: "launcher-falcon9",
    name: "Falcon 9 (Heavy Rideshare/Dedicated)",
    payloadCapacityLeoKg: 22800,
    payloadCapacityGtoKg: 8300,
    costCredits: 260000,
    fairingDiameterM: 5.2,
    fairingHeightM: 13.1,
    reliabilityPercent: 99,
    description: "Reusable heavy-lift vehicle with expansive payload fairing and high mission success rate.",
  },
];

/**
 * Local implementation of ComponentCatalogueSource.
 * Provides synchronous cached access and asynchronous promise-based access.
 */
export class LocalComponentCatalogueAdapter implements ComponentCatalogueSource {
  private components: Component[];
  private orbits: OrbitTarget[];
  private launchers: LauncherTarget[];

  constructor(
    components: Component[] = PROVISIONAL_COMPONENTS,
    orbits: OrbitTarget[] = PROVISIONAL_ORBITS,
    launchers: LauncherTarget[] = PROVISIONAL_LAUNCHERS,
  ) {
    this.components = [...components];
    this.orbits = [...orbits];
    this.launchers = [...launchers];
  }

  getComponents(): Component[] {
    return [...this.components];
  }

  getComponentById(id: string): Component | undefined {
    return this.components.find((c) => c.id === id);
  }

  getComponentsByCategory(category: ComponentCategory): Component[] {
    return this.components.filter((c) => c.category === category);
  }

  getOrbits(): OrbitTarget[] {
    return [...this.orbits];
  }

  getOrbitById(id: string): OrbitTarget | undefined {
    return this.orbits.find((o) => o.id === id);
  }

  getLaunchers(): LauncherTarget[] {
    return [...this.launchers];
  }

  getLauncherById(id: string): LauncherTarget | undefined {
    return this.launchers.find((l) => l.id === id);
  }
}

/**
 * Singleton instance of the local catalogue adapter.
 */
export const localCatalogueAdapter = new LocalComponentCatalogueAdapter();

/**
 * Helper lookup functions for direct convenience.
 */
export const getCatalogueComponentById = (id: string): Component | undefined =>
  localCatalogueAdapter.getComponentById(id);

export const getCatalogueComponentsByCategory = (
  category: ComponentCategory,
): Component[] => localCatalogueAdapter.getComponentsByCategory(category);

export const getCatalogueOrbitById = (id: string): OrbitTarget | undefined =>
  localCatalogueAdapter.getOrbitById(id);

export const getCatalogueLauncherById = (id: string): LauncherTarget | undefined =>
  localCatalogueAdapter.getLauncherById(id);
