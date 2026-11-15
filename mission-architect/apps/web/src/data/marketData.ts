export type MarketPart = {
  id: string;
  name: string;
  desc: string;
  price: number;
  unlockLevel: number;
  img?: string;
};

export type MarketCategory = {
  id: string;
  name: string;
  emoji: string;
  unlockLevel: number;
  priceRange: string;
  parts: MarketPart[];
};

export type MarketIntel = {
  id: string;
  title: string;
  category: "Lunar" | "Martian" | "Deep Space" | "Solar" | "Planetary";
  badge: string;
  icon: string;
  price: number;
  unlockLevel: number;
  summary: string;
  dossier: string;
};

export const MARKET_CATEGORIES: MarketCategory[] = [
  {
    id: "launchpad",
    name: "Launchpad",
    emoji: "🗼",
    unlockLevel: 1,
    priceRange: "100K – 520K",
    parts: [
      { id: "lp1", name: "Wallops Flight Facility (Pad 0A/0B)", desc: "Lightweight pad for small and medium rockets on Virginia's Eastern Shore.", price: 110000, unlockLevel: 1, img: "/assets/sprites/parts/lp1.png" },
      { id: "lp2", name: "Kennedy Space Center (LC-39A / LC-39B)", desc: "Historic NASA launchpad supporting Falcon 9, Falcon Heavy & SLS missions.", price: 280000, unlockLevel: 1, img: "/assets/sprites/parts/lp2.png" },
      { id: "lp3", name: "Cape Canaveral SLC-41", desc: "Premier ULA launch site for Atlas V and next-gen rockets.", price: 450000, unlockLevel: 1, img: "/assets/sprites/parts/lp3.png" },
      { id: "lp4", name: "Heavy Integration Pad (KSC LC-39B)", desc: "The heaviest NASA launch complex, built for multi-stage interplanetary return architectures.", price: 520000, unlockLevel: 1, img: "/assets/sprites/parts/lp3.png" },
    ],
  },
  {
    id: "vehicle",
    name: "Launch Vehicle",
    emoji: "🚀",
    unlockLevel: 1,
    priceRange: "500K – 1.50M",
    parts: [
      { id: "lv1", name: "Suborbital Sounding Rocket", desc: "Low-cost rocket for brief suborbital science experiments.", price: 500000, unlockLevel: 1, img: "/assets/sprites/parts/lv1.png" },
      { id: "lv2", name: "Pegasus XL / Electron VADR", desc: "Air-launched and small-payload orbital rockets.", price: 650000, unlockLevel: 1, img: "/assets/sprites/parts/lv2.png" },
      { id: "lv3", name: "Falcon 9 (Commercial / Interplanetary)", desc: "SpaceX's reusable workhorse for LEO, GTO and ISS missions.", price: 900000, unlockLevel: 1, img: "/assets/sprites/parts/lv3.png" },
      { id: "lv4", name: "Atlas V (401 / 541)", desc: "ULA medium-to-heavy lift rocket with optional solid boosters.", price: 1100000, unlockLevel: 1, img: "/assets/sprites/parts/lv4.png" },
      { id: "lv5", name: "Falcon Heavy", desc: "SpaceX's heavy-lift rocket capable of deep-space trajectories.", price: 1300000, unlockLevel: 1, img: "/assets/sprites/parts/lv5.png" },
      { id: "lv6", name: "SLS (Block 1B / Deep-Space Config)", desc: "NASA's most powerful rocket designed for Artemis and beyond.", price: 1500000, unlockLevel: 1, img: "/assets/sprites/parts/lv6.png" },
      { id: "lv7", name: "Minotaur V", desc: "Solid-fuel launcher that can send small spacecraft on lunar trajectories.", price: 700000, unlockLevel: 1, img: "/assets/sprites/parts/lv2.png" },
      { id: "lv8", name: "Vulcan Centaur", desc: "ULA's high-energy next-generation booster for heavy interplanetary payloads.", price: 1250000, unlockLevel: 1, img: "/assets/sprites/parts/lv4.png" },
      { id: "lv9", name: "Atlas V 541", desc: "Atlas V with four solid boosters: the heavy-lift rocket that flew Curiosity and Perseverance to Mars.", price: 1150000, unlockLevel: 1, img: "/assets/sprites/parts/lv4.png" },
    ],
  },
  {
    id: "satellite",
    name: "Satellite (Orbiter)",
    emoji: "🛰️",
    unlockLevel: 1,
    priceRange: "300K – 1.30M",
    parts: [
      { id: "sat1", name: "1U/3U Bare-Bones Nanosat Bus", desc: "Tiny CubeSat frame for educational and low-budget missions.", price: 300000, unlockLevel: 1, img: "/assets/sprites/parts/sat1.png" },
      { id: "sat2", name: "RainCube 6U CubeSat Bus", desc: "Miniaturized satellite bus proven for Earth observation.", price: 450000, unlockLevel: 1, img: "/assets/sprites/parts/sat2.png" },
      { id: "sat3", name: "Basic 3U LEO Weather / Comms-Sat Bus", desc: "Standard bus for weather monitoring and communications.", price: 550000, unlockLevel: 1, img: "/assets/sprites/parts/sat3.png" },
      { id: "sat4", name: "CAPSTONE Deep-Space CubeSat Bus", desc: "Lightweight bus tested in lunar halo orbit for Artemis.", price: 750000, unlockLevel: 1, img: "/assets/sprites/parts/sat4.png" },
      { id: "sat5", name: "Lunar Reconnaissance Orbiter (LRO) Bus", desc: "NASA's proven lunar mapping satellite platform.", price: 950000, unlockLevel: 1, img: "/assets/sprites/parts/sat5.png" },
      { id: "sat6", name: "OSIRIS-REx / Mars Sample Return Interplanetary Bus", desc: "Robust bus designed for asteroid and planetary sample return.", price: 1200000, unlockLevel: 1, img: "/assets/sprites/parts/sat6.png" },
      { id: "sat7", name: "Mars Sample Return Orbiter Bus", desc: "Interplanetary orbiter bus with NEXT-C ion thrusters for rendezvous with the sample return lander.", price: 1300000, unlockLevel: 1, img: "/assets/sprites/parts/sat6.png" },
    ],
  },
  {
    id: "sensors",
    name: "Sensors & Payloads",
    emoji: "📡",
    unlockLevel: 1,
    priceRange: "250K – 1.00M",
    parts: [
      { id: "sp1", name: "Basic VHF Radio Beacon / Radio Antenna", desc: "Essential comms hardware for telemetry and tracking.", price: 250000, unlockLevel: 1, img: "/assets/sprites/parts/sp1.png" },
      { id: "sp2", name: "OLI-2 Mini Optical Camera", desc: "Compact optical imager for land and water observations.", price: 320000, unlockLevel: 1, img: "/assets/sprites/parts/sp2.png" },
      { id: "sp3", name: "S-Band / X-Band High-Gain Transceiver Antenna", desc: "High-bandwidth antenna for deep-space data downlinks.", price: 400000, unlockLevel: 1, img: "/assets/sprites/parts/sp3.png" },
      { id: "sp4", name: "LROC (Lunar Reconnaissance Orbiter Camera)", desc: "Wide-angle camera designed for detailed lunar surface imaging.", price: 500000, unlockLevel: 1, img: "/assets/sprites/parts/sp4.png" },
      { id: "sp5", name: "Neutron Spectrometer (Water-Ice Detector)", desc: "Detects hydrogen signatures indicating subsurface water ice.", price: 600000, unlockLevel: 1, img: "/assets/sprites/parts/sp5.png" },
      { id: "sp6", name: "Autonomous Optical Nav & LiDAR (DRACO Suite)", desc: "Multi-instrument navigation and science package.", price: 720000, unlockLevel: 1, img: "/assets/sprites/parts/sp6.png" },
      { id: "sp7", name: "SEIS Seismometer & HP3 Thermal Probe", desc: "InSight-heritage seismometer and heat-flow probe.", price: 820000, unlockLevel: 1, img: "/assets/sprites/parts/sp7.png" },
      { id: "sp8", name: "Mastcam-Z Stereo Cameras & SHERLOC Spectrometer", desc: "Perseverance-class imaging and Raman spectrometer.", price: 900000, unlockLevel: 1, img: "/assets/sprites/parts/sp8.png" },
      { id: "sp9", name: "TRIDENT 1-Meter Hammer Drill & MSOLO MS", desc: "Deep drilling and mass spectrometer for volatile detection.", price: 950000, unlockLevel: 1, img: "/assets/sprites/parts/sp9.png" },
      { id: "sp10", name: "Heavy Planetary Core-Drill", desc: "Industrial-grade drill for subsurface geological sample collection.", price: 1000000, unlockLevel: 1, img: "/assets/sprites/parts/sp10.png" },
      { id: "sp11", name: "IRIS Deep-Space X-Band Transponder", desc: "Deep-space radio that stays connected to NASA's Deep Space Network across 384,400 km to the Moon.", price: 350000, unlockLevel: 1 },
      { id: "sp12", name: "Solar Wings + Radioisotope Heater Units (RHUs)", desc: "Deployable solar arrays with heater units that keep electronics alive through freezing planetary nights.", price: 280000, unlockLevel: 1 },
      { id: "sp13", name: "MMRTG (Plutonium-238 Power Generator)", desc: "Nuclear battery that never gets covered in dust and keeps a rover running through nights and storms.", price: 650000, unlockLevel: 1 },
      { id: "sp14", name: "Robotic Arm", desc: "Deployable arm that reaches out to place instruments and handle samples after landing.", price: 380000, unlockLevel: 1 },
      { id: "sp15", name: "Navcam Stereo Cameras + AutoNav", desc: "Stereo cameras and hazard avoidance that let a rover spot boulders and steer around them on its own.", price: 340000, unlockLevel: 1 },
      { id: "sp16", name: "Rotary Percussive Drill + Sample Caching System", desc: "Drills into rock and seals soil and rock cores into sample tubes.", price: 880000, unlockLevel: 1 },
      { id: "sp17", name: "TAGSAM (Touch-and-Go Sampler) Robotic Arm", desc: "Reaches out to grab loose asteroid regolith without crashing into the surface.", price: 780000, unlockLevel: 1 },
    ],
  },
  {
    id: "lander",
    name: "Lander & Rover",
    emoji: "🤖",
    unlockLevel: 1,
    priceRange: "600K – 2.00M",
    parts: [
      { id: "lr1", name: "DART Kinetic Impactor (Hard Lander)", desc: "NASA's planetary defense impactor that redirected asteroid Dimorphos.", price: 750000, unlockLevel: 1, img: "/assets/sprites/parts/lr1.png" },
      { id: "lr2", name: "Nova-C / Blue Ghost Lander", desc: "Commercial lunar lander for CLPS program surface delivery.", price: 900000, unlockLevel: 1, img: "/assets/sprites/parts/lr2.png" },
      { id: "lr3", name: "InSight Mars Stationary Lander", desc: "Geophysics station designed to study the Martian interior.", price: 1100000, unlockLevel: 1, img: "/assets/sprites/parts/lr3.png" },
      { id: "lr4", name: "CLPS Heavy Retro-Rocket Landing Platform", desc: "Heavy-duty lunar cargo lander with retro-rocket descent.", price: 1300000, unlockLevel: 1, img: "/assets/sprites/parts/lr4.png" },
      { id: "lr5", name: "Aeroshell + Supersonic Parachute + Sky Crane", desc: "MSL/Perseverance EDL system for precise Mars landing.", price: 1500000, unlockLevel: 1, img: "/assets/sprites/parts/lr5.png" },
      { id: "lr6", name: "Mars Sample Retrieval Lander + MAV", desc: "Future Mars Sample Return lander with ascent vehicle.", price: 1700000, unlockLevel: 1, img: "/assets/sprites/parts/lr6.png" },
      { id: "lr7", name: "VIPER 4-Wheeled Polar Rover", desc: "NASA's lunar south pole rover to map water ice deposits.", price: 1500000, unlockLevel: 1, img: "/assets/sprites/parts/lr7.png" },
      { id: "lr8", name: "Perseverance 6-Wheeled MMRTG Rover", desc: "Advanced Mars rover with nuclear power and sample caching.", price: 1800000, unlockLevel: 1, img: "/assets/sprites/parts/lr8.png" },
      { id: "lr9", name: "Sample Cache Retrieval Rover & Robotic Manipulator Arm", desc: "Robotic arm rover for precise sample collection and return.", price: 2000000, unlockLevel: 1, img: "/assets/sprites/parts/lr9.png" },
      { id: "lr10", name: "Curiosity 6-Wheeled Rover", desc: "Mars Science Laboratory rover with a rocker-bogie suspension for climbing Martian rocks.", price: 1700000, unlockLevel: 1, img: "/assets/sprites/parts/lr8.png" },
      { id: "lr11", name: "Sample Return Capsule (SRC)", desc: "Sealed capsule that carries the collected samples home.", price: 600000, unlockLevel: 1 },
      { id: "lr12", name: "PICA-X Reinforced Aeroshell Capsule (Earth Entry Vehicle)", desc: "Heat-shielded capsule that protects the samples through Earth re-entry at over 40,000 km/h.", price: 900000, unlockLevel: 1 },
      { id: "lr13", name: "EEV Thermal Protection Shield & Parachute", desc: "Earth Entry Vehicle heat shield with parachute for a safe landing in the desert.", price: 850000, unlockLevel: 1 },
    ],
  },
];

export const MARKET_INTEL: MarketIntel[] = [
  {
    id: "intel-lunar-water",
    title: "Lunar South Pole Water Ice Map",
    category: "Lunar",
    badge: "TOP SECRET",
    icon: "🧊",
    price: 150000,
    unlockLevel: 1,
    summary: "Reflectance spectroscopy confirming ice in permanently shadowed regions of Shackleton Crater.",
    dossier: "SPECTRAL RECONNAISSANCE REPORT:\nTarget: Shackleton / Faustini Rim\nNeutron count dips confirm >1.5m deep water-ice sheet suitable for in-situ resource propellant electrolysis. Landing within 2km of crater ridge maximizes solar generation while granting access to cryogenic reserves.",
  },
  {
    id: "intel-mars-edl",
    title: "Mars Atmospheric Entry Corridor Telemetry",
    category: "Martian",
    badge: "CLASSIFIED",
    icon: "🌪️",
    price: 280000,
    unlockLevel: 2,
    summary: "High-altitude atmospheric density models and dust storm wind shear vectors for Jezero / Gale entry.",
    dossier: "EDL TRAJECTORY BRIEFING:\nAtmospheric scale height: 11.1km. Dust activity elevates mesospheric density by 14%. Supersonic parachute deployment threshold must occur at Mach 1.9 at >= 9.2km AGL to ensure sufficient terrain clearance for Sky Crane retro-burn.",
  },
  {
    id: "intel-asteroid-ephemeris",
    title: "Near-Earth Asteroid Orbital Ephemeris",
    category: "Deep Space",
    badge: "RESTRICTED",
    icon: "☄️",
    price: 350000,
    unlockLevel: 2,
    summary: "Precision Doppler radar ranging and orbital elements for high-value carbonaceous asteroids.",
    dossier: "DEEP SPACE RADAR EPHEMERIS:\nSemi-major axis: 1.12 AU. Delta-V for rendezvous: 3.4 km/s via lunar gravity assist. Surface regolith cohesion is near-zero; harpoon or micro-spine anchoring required for sample collection.",
  },
  {
    id: "intel-solar-storm",
    title: "Heliospheric Coronal Mass Ejection Forecast",
    category: "Solar",
    badge: "CRITICAL",
    icon: "☀️",
    price: 200000,
    unlockLevel: 1,
    summary: "48-hour advance telemetry on proton storm flux and space weather radiation hazards.",
    dossier: "SPACE WEATHER WARNING:\nX-class solar flare detected on eastern solar limb. High-energy proton flux (>100 MeV) expected to peak within 36 hours. Interplanetary orbiters should orient solar arrays edge-on and place primary flight computers into safe-hold shielding mode.",
  },
  {
    id: "intel-europa-radiation",
    title: "Jovian Magnetosphere & Europa Radiation Map",
    category: "Planetary",
    badge: "CLASSIFIED",
    icon: "⚡",
    price: 450000,
    unlockLevel: 2,
    summary: "Trapped electron flux maps in Jupiter's inner magnetic belts for radiation mitigation.",
    dossier: "RADIATION BELT DOSIMETRY:\nInner magnetosphere ionizing radiation exceeds 5.4 Mrad behind 100 mil aluminum shielding. Recommends eccentric flyby trajectory with periapsis duration limited to <12 hours to prevent optical sensor degradation and single-event upsets.",
  },
  {
    id: "intel-debris-avoidance",
    title: "Low Earth Orbit Conjunction Matrix",
    category: "Deep Space",
    badge: "URGENT",
    icon: "🛰️",
    price: 100000,
    unlockLevel: 1,
    summary: "Real-time collision avoidance coordinates for high-density 500-800km polar and sun-synchronous orbits.",
    dossier: "CONJUNCTION ASSESSMENT:\nIdentified 12 close approaches (<500m miss distance) across SSO-600 corridor over next 72 hours. Recommended prograde delta-V burn: 0.8 m/s to phase orbit 35km away from defunct upper stage debris cloud.",
  },
];

export const ALL_MARKET_PARTS: MarketPart[] = MARKET_CATEGORIES.flatMap((c) => c.parts);

export function findPartById(id: string): MarketPart | undefined {
  return ALL_MARKET_PARTS.find((p) => p.id === id);
}

export function findIntelById(id: string): MarketIntel | undefined {
  return MARKET_INTEL.find((i) => i.id === id);
}

export function findPartByNameOrSlot(name: string): MarketPart | undefined {
  const norm = name.toLowerCase().trim();
  const direct = ALL_MARKET_PARTS.find(
    (p) => p.name.toLowerCase().includes(norm) || norm.includes(p.name.toLowerCase().split(" ")[0])
  );
  if (direct) return direct;

  if (norm.includes("falcon 9")) return findPartById("lv3");
  if (norm.includes("falcon heavy")) return findPartById("lv5");
  if (norm.includes("atlas v")) return findPartById("lv4");
  if (norm.includes("sls")) return findPartById("lv6");
  if (norm.includes("wallops")) return findPartById("lp1");
  if (norm.includes("39a") || norm.includes("ksc")) return findPartById("lp2");
  if (norm.includes("41") || norm.includes("canaveral")) return findPartById("lp3");
  if (norm.includes("3u") || norm.includes("nanosat")) return findPartById("sat3");
  if (norm.includes("lro")) return findPartById("sat5");
  if (norm.includes("osiris")) return findPartById("sat6");
  if (norm.includes("vhf")) return findPartById("sp1");
  if (norm.includes("lroc")) return findPartById("sp4");
  if (norm.includes("neutron")) return findPartById("sp5");
  if (norm.includes("nova-c")) return findPartById("lr2");
  if (norm.includes("aeroshell") || norm.includes("sky crane")) return findPartById("lr5");
  if (norm.includes("perseverance") || norm.includes("curiosity") || norm.includes("rover")) return findPartById("lr8");
  if (norm.includes("draco") || norm.includes("autonav")) return findPartById("sp6");
  if (norm.includes("sherloc") || norm.includes("drill")) return findPartById("sp8");
  if (norm.includes("mmrtg")) return findPartById("sp7");

  return undefined;
}
