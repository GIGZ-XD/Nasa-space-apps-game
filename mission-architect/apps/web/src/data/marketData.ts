export type MarketPart = {
  id: string;
  name: string;
  desc: string;
  price: number;
  unlockLevel: number;
};

export type MarketCategory = {
  id: string;
  name: string;
  emoji: string;
  unlockLevel: number;
  priceRange: string;
  parts: MarketPart[];
};

export const MARKET_CATEGORIES: MarketCategory[] = [
  {
    id: "launchpad",
    name: "Launchpad",
    emoji: "🗼",
    unlockLevel: 1,
    priceRange: "100K – 500K",
    parts: [
      { id: "lp1", name: "Wallops Flight Facility (Pad 0A/0B)", desc: "Lightweight pad for small and medium rockets on Virginia's Eastern Shore.", price: 110000, unlockLevel: 1 },
      { id: "lp2", name: "Kennedy Space Center (LC-39A / LC-39B)", desc: "Historic NASA launchpad supporting Falcon 9, Falcon Heavy & SLS missions.", price: 280000, unlockLevel: 1 },
      { id: "lp3", name: "Cape Canaveral SLC-41", desc: "Premier ULA launch site for Atlas V and next-gen rockets.", price: 450000, unlockLevel: 1 },
    ],
  },
  {
    id: "vehicle",
    name: "Launch Vehicle",
    emoji: "🚀",
    unlockLevel: 1,
    priceRange: "500K – 1.50M",
    parts: [
      { id: "lv1", name: "Suborbital Sounding Rocket", desc: "Low-cost rocket for brief suborbital science experiments.", price: 500000, unlockLevel: 1 },
      { id: "lv2", name: "Pegasus XL / Electron VADR", desc: "Air-launched and small-payload orbital rockets.", price: 650000, unlockLevel: 1 },
      { id: "lv3", name: "Falcon 9 (Commercial / Interplanetary)", desc: "SpaceX's reusable workhorse for LEO, GTO and ISS missions.", price: 900000, unlockLevel: 1 },
      { id: "lv4", name: "Atlas V (401 / 541)", desc: "ULA medium-to-heavy lift rocket with optional solid boosters.", price: 1100000, unlockLevel: 1 },
      { id: "lv5", name: "Falcon Heavy", desc: "SpaceX's heavy-lift rocket capable of deep-space trajectories.", price: 1300000, unlockLevel: 1 },
      { id: "lv6", name: "SLS (Block 1B / Deep-Space Config)", desc: "NASA's most powerful rocket designed for Artemis and beyond.", price: 1500000, unlockLevel: 1 },
    ],
  },
  {
    id: "satellite",
    name: "Satellite (Orbiter)",
    emoji: "🛰️",
    unlockLevel: 1,
    priceRange: "300K – 1.20M",
    parts: [
      { id: "sat1", name: "1U/3U Bare-Bones Nanosat Bus", desc: "Tiny CubeSat frame for educational and low-budget missions.", price: 300000, unlockLevel: 1 },
      { id: "sat2", name: "RainCube 6U CubeSat Bus", desc: "Miniaturized satellite bus proven for Earth observation.", price: 450000, unlockLevel: 1 },
      { id: "sat3", name: "Basic 3U LEO Weather / Comms-Sat Bus", desc: "Standard bus for weather monitoring and communications.", price: 550000, unlockLevel: 1 },
      { id: "sat4", name: "CAPSTONE Deep-Space CubeSat Bus", desc: "Lightweight bus tested in lunar halo orbit for Artemis.", price: 750000, unlockLevel: 1 },
      { id: "sat5", name: "Lunar Reconnaissance Orbiter (LRO) Bus", desc: "NASA's proven lunar mapping satellite platform.", price: 950000, unlockLevel: 1 },
      { id: "sat6", name: "OSIRIS-REx / Mars Sample Return Interplanetary Bus", desc: "Robust bus designed for asteroid and planetary sample return.", price: 1200000, unlockLevel: 1 },
    ],
  },
  {
    id: "sensors",
    name: "Sensors & Payloads",
    emoji: "📡",
    unlockLevel: 1,
    priceRange: "250K – 1.00M",
    parts: [
      { id: "sp1", name: "Basic VHF Radio Beacon / Radio Antenna", desc: "Essential comms hardware for telemetry and tracking.", price: 250000, unlockLevel: 1 },
      { id: "sp2", name: "OLI-2 Mini Optical Camera", desc: "Compact optical imager for land and water observations.", price: 320000, unlockLevel: 1 },
      { id: "sp3", name: "S-Band / X-Band High-Gain Transceiver Antenna", desc: "High-bandwidth antenna for deep-space data downlinks.", price: 400000, unlockLevel: 1 },
      { id: "sp4", name: "LROC (Lunar Reconnaissance Orbiter Camera)", desc: "Wide-angle camera designed for detailed lunar surface imaging.", price: 500000, unlockLevel: 1 },
      { id: "sp5", name: "Neutron Spectrometer (Water-Ice Detector)", desc: "Detects hydrogen signatures indicating subsurface water ice.", price: 600000, unlockLevel: 1 },
      { id: "sp6", name: "Autonomous Optical Nav & LiDAR (DRACO Suite)", desc: "Multi-instrument navigation and science package.", price: 720000, unlockLevel: 1 },
      { id: "sp7", name: "SEIS Seismometer & HP3 Thermal Probe", desc: "InSight-heritage seismometer and heat-flow probe.", price: 820000, unlockLevel: 1 },
      { id: "sp8", name: "Mastcam-Z Stereo Cameras & SHERLOC Spectrometer", desc: "Perseverance-class imaging and Raman spectrometer.", price: 900000, unlockLevel: 1 },
      { id: "sp9", name: "TRIDENT 1-Meter Hammer Drill & MSOLO MS", desc: "Deep drilling and mass spectrometer for volatile detection.", price: 950000, unlockLevel: 1 },
      { id: "sp10", name: "Heavy Planetary Core-Drill", desc: "Industrial-grade drill for subsurface geological sample collection.", price: 1000000, unlockLevel: 1 },
    ],
  },
  {
    id: "lander",
    name: "Lander & Rover",
    emoji: "🤖",
    unlockLevel: 1,
    priceRange: "750K – 2.00M",
    parts: [
      { id: "lr1", name: "DART Kinetic Impactor (Hard Lander)", desc: "NASA's planetary defense impactor that redirected asteroid Dimorphos.", price: 750000, unlockLevel: 1 },
      { id: "lr2", name: "Nova-C / Blue Ghost Lander", desc: "Commercial lunar lander for CLPS program surface delivery.", price: 900000, unlockLevel: 1 },
      { id: "lr3", name: "InSight Mars Stationary Lander", desc: "Geophysics station designed to study the Martian interior.", price: 1100000, unlockLevel: 1 },
      { id: "lr4", name: "CLPS Heavy Retro-Rocket Landing Platform", desc: "Heavy-duty lunar cargo lander with retro-rocket descent.", price: 1300000, unlockLevel: 1 },
      { id: "lr5", name: "Aeroshell + Supersonic Parachute + Sky Crane", desc: "MSL/Perseverance EDL system for precise Mars landing.", price: 1500000, unlockLevel: 1 },
      { id: "lr6", name: "Mars Sample Retrieval Lander + MAV", desc: "Future Mars Sample Return lander with ascent vehicle.", price: 1700000, unlockLevel: 1 },
      { id: "lr7", name: "VIPER 4-Wheeled Polar Rover", desc: "NASA's lunar south pole rover to map water ice deposits.", price: 1500000, unlockLevel: 1 },
      { id: "lr8", name: "Perseverance 6-Wheeled MMRTG Rover", desc: "Advanced Mars rover with nuclear power and sample caching.", price: 1800000, unlockLevel: 1 },
      { id: "lr9", name: "Sample Cache Retrieval Rover & Robotic Manipulator Arm", desc: "Robotic arm rover for precise sample collection and return.", price: 2000000, unlockLevel: 1 },
    ],
  },
];
