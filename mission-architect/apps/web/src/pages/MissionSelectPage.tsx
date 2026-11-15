import { Btn, Coins, Img, Moonscape, Panel, Screen } from "../components/layout/ui";
import { MISSIONS, type Mission } from "../data/missions";
import { useGameStore } from "../stores/gameStore";

const POS: Record<number, [number, number]> = { 1: [100, 125], 2: [533, 130], 3: [963, 130], 4: [281, 420], 5: [757, 420] };
const W = 394, H = 268;

function Card({ m, onOpen, playerLevel, unlocked }: { m: Mission; onOpen: () => void; playerLevel: number; unlocked: boolean }) {
  const locked = m.unlockLevel > playerLevel && !unlocked;
  const [x, y] = POS[m.id];
  return (
    <button className={`card panel ${locked ? "locked" : "sel"}`} style={{ left: x, top: y, width: W, height: H }} onClick={locked ? undefined : onOpen} aria-disabled={locked}>
      <div className={`frame ${locked ? "" : "sel"}`} />
      <h3 className="cardtitle">{m.short}</h3>
      <img className="pix cardart" src={m.card} alt={m.name} />
      <div className="stats"><span><Img src="/assets/sprites/ui/coin.jpg" size={32} />{m.cost}</span><span><span style={{ color: "#4db8ff" }}>★</span>{m.xp.toLocaleString()} XP</span></div>
      <div className="view">{locked ? `UNLOCKS AT LVL ${m.unlockLevel}` : "VIEW MISSION ›"}</div>
    </button>
  );
}

export function MissionSelectPage({ go, open }: { go: (s: string) => void; open: (id: number) => void }) {
  const { level, unlockedMissionIds } = useGameStore();
  return (
    <Screen>
      <Moonscape small />
      <Panel x={462} y={16} w={532} h={64}>
        <div className="px sprite-title" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: 1 }}>✦ MISSION SELECT ✦</div>
      </Panel>
      <Panel x={535} y={78} w={386} h={36}>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--cyan)", fontWeight: 600, fontSize: 21, zIndex: 1 }}>Choose your next operation</div>
      </Panel>
      <Coins />
      {MISSIONS.map((m) => <Card key={m.id} m={m} onOpen={() => open(m.id)} playerLevel={level} unlocked={(unlockedMissionIds || []).includes(m.id)} />)}
      <Btn x={17} y={724} w={282} h={82} icon={<Img src="/assets/sprites/ui/home.jpg" size={50} />} onClick={() => go("home")}>Dashboard</Btn>
      <Btn x={1214} y={634} w={230} h={78} icon={<Img src="/assets/sprites/ui/gear.jpg" size={46} />} chevron={false} onClick={() => go("inventory")}>Inventory</Btn>
      <Btn x={1214} y={724} w={230} h={82} icon={<Img src="/assets/sprites/ui/market.jpg" size={50} />} chevron={false} onClick={() => go("market")}>Market</Btn>
    </Screen>
  );
}
