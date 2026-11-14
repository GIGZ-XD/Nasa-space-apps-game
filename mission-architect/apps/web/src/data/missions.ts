export interface Objective { id: string; title: string; text: string }
export interface Part { slot: string; name: string; icon: string; img?: string; isNew?: boolean }
export interface Mission {
  id: number;
  name: string;
  short: string;
  unlockLevel: number;
  cost: string;
  xp: number;
  theme: "geo" | "lunar" | "dark" | "mars" | "deep";
  icon: string;
  card: string;
  hero?: string;
  tagline: string;
  objectives: Objective[];
  parts: Part[];
}

export const PLAYER = { name: "Commander_01", level: 1, xp: 150, xpMax: 500, coins: "2.50M" };

export const MISSIONS: Mission[] = [
  {
    id: 1, name: "Geo-Satellite Mission", short: "GEO-SATELLITE MISSION", unlockLevel: 1, cost: "250K", xp: 500,
    theme: "geo", icon: "🛰️", card: "/assets/sprites/spacecraft/card-1.jpg", tagline: "Place a communications satellite into geostationary orbit.",
    objectives: [
      { id: "1.1", title: "Launch", text: "Lift off from Earth and clear the launch tower." },
      { id: "1.2", title: "Orbit Insertion", text: "Reach a stable low Earth orbit." },
      { id: "1.3", title: "Transfer Burn", text: "Raise the orbit to geostationary altitude." },
    ],
    parts: [
      { slot: "Launch Pad", name: "Wallops 0A", icon: "🗼" },
      { slot: "Launch Vehicle", name: "Falcon 9", icon: "🚀" },
      { slot: "Satellite Bus", name: "Basic 3U", icon: "🛰️" },
      { slot: "Payload", name: "VHF Beacon", icon: "📡" },
    ],
  },
  {
    id: 2, name: "Lunar Satellite", short: "LUNAR SATELLITE", unlockLevel: 2, cost: "350K", xp: 700,
    theme: "lunar", icon: "🌙", card: "/assets/sprites/spacecraft/card-2.jpg", tagline: "Map the Moon from lunar orbit.",
    objectives: [
      { id: "2.1", title: "Translunar Launch", text: "Send the spacecraft toward the Moon." },
      { id: "2.2", title: "Lunar Orbit", text: "Capture into a stable lunar orbit." },
      { id: "2.3", title: "Mapping", text: "Image the surface and transmit data." },
    ],
    parts: [
      { slot: "Launch Pad", name: "KSC LC-39A", icon: "🗼" },
      { slot: "Launch Vehicle", name: "Falcon 9", icon: "🚀" },
      { slot: "Satellite Bus", name: "LRO Bus", icon: "🛰️" },
      { slot: "Payload", name: "LROC Camera", icon: "📷" },
    ],
  },
  {
    id: 3, name: "Lunar Lander (Dark Side)", short: "LUNAR LANDER (DARK SIDE)", unlockLevel: 3, cost: "500K", xp: 900,
    theme: "dark", icon: "🛬", card: "/assets/sprites/spacecraft/card-3.jpg", tagline: "Land on the far side of the Moon.",
    objectives: [
      { id: "3.1", title: "Launch", text: "Launch toward the Moon." },
      { id: "3.2", title: "Descent", text: "Perform a powered descent." },
      { id: "3.3", title: "Touchdown", text: "Land safely and deploy instruments." },
    ],
    parts: [
      { slot: "Launch Pad", name: "KSC LC-39A", icon: "🗼" },
      { slot: "Launch Vehicle", name: "Falcon Heavy", icon: "🚀" },
      { slot: "Lander", name: "Nova-C", icon: "🛬" },
      { slot: "Payload", name: "Neutron Spec.", icon: "🔬" },
    ],
  },
  {
    id: 4, name: "Mars Rover", short: "MARS ROVER", unlockLevel: 4, cost: "750K", xp: 1200,
    theme: "mars", icon: "🤖", card: "/assets/sprites/spacecraft/card-4.jpg", hero: "/assets/sprites/spacecraft/hero-4.jpg", tagline: "Deploy a rover on Mars, explore the terrain, and gather valuable scientific data.",
    objectives: [
      { id: "4.1", title: "Interplanetary Launch", text: "Successfully launch the spacecraft from Earth and establish a trajectory towards Mars." },
      { id: "4.2", title: "Mars Arrival", text: "Reach Mars and achieve the required conditions for atmospheric entry." },
      { id: "4.3", title: "Precision Landing", text: "Achieve a safe landing within the designated Martian exploration zone without damaging the rover." },
      { id: "4.4", title: "Surface Exploration", text: "Explore the Martian terrain and identify geological formations that may preserve evidence of ancient water." },
      { id: "4.5", title: "Sample Collection", text: "Investigate selected rock formations and obtain scientifically valuable samples." },
      { id: "4.6", title: "Scientific Data Transmission", text: "Transmit the collected scientific data, sample records and exploration findings to Earth." },
    ],
    parts: [
      { slot: "Launch Pad", name: "Cape Canaveral SLC-41", icon: "🗼", img: "/assets/sprites/ui/part-4-1.jpg" },
      { slot: "Launch Vehicle", name: "Atlas V 541 / Falcon Heavy", icon: "🚀", img: "/assets/sprites/ui/part-4-2.jpg" },
      { slot: "Lander / Entry System", name: "Aeroshell + Sky Crane", icon: "🪂", img: "/assets/sprites/ui/part-4-3.jpg" },
      { slot: "Rover", name: "Perseverance / Curiosity", icon: "🤖", isNew: true, img: "/assets/sprites/ui/part-4-4.jpg" },
      { slot: "Power System", name: "MMRTG", icon: "🔋", img: "/assets/sprites/ui/part-4-5.jpg" },
      { slot: "Navigation & Autonomy", name: "Navcam + AutoNav", icon: "🎥", img: "/assets/sprites/ui/part-4-6.jpg" },
      { slot: "Sensors & Sample Tools", name: "SHERLOC + Drill", icon: "🧪", img: "/assets/sprites/ui/part-4-7.jpg" },
    ],
  },
  {
    id: 5, name: "Deep-Space Mission", short: "DEEP-SPACE MISSION", unlockLevel: 5, cost: "1.00M", xp: 1500,
    theme: "deep", icon: "🌌", card: "/assets/sprites/spacecraft/card-5.jpg", tagline: "Send a probe beyond the planets.",
    objectives: [
      { id: "5.1", title: "Heavy Launch", text: "Launch aboard a deep-space capable vehicle." },
      { id: "5.2", title: "Cruise", text: "Survive the long interplanetary cruise." },
      { id: "5.3", title: "Encounter", text: "Collect science at the target." },
    ],
    parts: [
      { slot: "Launch Pad", name: "KSC Heavy Pad", icon: "🗼" },
      { slot: "Launch Vehicle", name: "SLS Block 1B", icon: "🚀" },
      { slot: "Bus", name: "OSIRIS-REx Bus", icon: "🛰️" },
      { slot: "Payload", name: "DRACO Suite", icon: "🔭" },
    ],
  },
];
