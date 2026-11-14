import { Btn, Coins, Img, Moonscape, Panel, Screen } from "../components/layout/ui";
import type { Mission } from "../data/missions";

export function MissionBriefPage({ mission, go, start }: { mission: Mission; go: (s: string) => void; start: () => void }) {
  const [first, ...rest] = mission.tagline.split(". ");
  return (
    <Screen>
      <Moonscape small />
      <Btn x={25} y={16} w={100} h={64} chevron={false} onClick={() => go("select")}>{""}</Btn>
      <span className="abs" style={{ left: 48, top: 24, fontSize: 44, color: "var(--cyan)", zIndex: 3, pointerEvents: "none" }}>←</span>
      <Panel x={146} y={14} w={506} h={70}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 16, padding: "0 20px", zIndex: 1, fontSize: 31, fontWeight: 700, whiteSpace: "nowrap" }}>
          <Img src={mission.id === 4 ? "/assets/sprites/ui/rover.jpg" : mission.card} size={46} />
          <span><span className="hl">Mission {mission.id}:</span> {mission.name}</span>
        </div>
      </Panel>
      <Coins />

      <Panel x={58} y={102} w={592} h={440}>
        <img className="pix abs" src={mission.hero ?? mission.card} alt={mission.name} style={{ left: 10, top: 10, width: 572, height: 232 + 80, objectFit: "cover", border: "3px solid #1b4a99" }} />
        <p style={{ position: "absolute", left: 40, top: 336, right: 30, margin: 0, fontSize: 26, fontWeight: 600, lineHeight: 1.3, zIndex: 1 }}>{first}{rest.length ? ". " + rest.join(". ") : ""}</p>
      </Panel>

      <Panel x={68} y={560} w={572} h={96} tab={<><span style={{ color: "var(--gold)", fontSize: 28 }}>★</span>Mission Rewards</>}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 50, paddingTop: 12, fontSize: 32, fontWeight: 600, zIndex: 1 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 14 }}><Img src="/assets/sprites/ui/coin.jpg" size={46} />{mission.cost}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 14 }}><span style={{ color: "#4db8ff", fontSize: 40 }}>★</span>{mission.xp.toLocaleString()} XP</span>
        </div>
      </Panel>

      <Panel x={685} y={102} w={715} h={556} tab={<><span style={{ color: "#4db8ff" }}>◎</span>Mission Objectives</>}>
        <ul className="obj" style={{ position: "absolute", left: 18, right: 22, top: 36, margin: 0, zIndex: 1 }}>
          {mission.objectives.map((o) => (
            <li key={o.id} style={{ height: Math.min(84, 470 / mission.objectives.length) }}>
              <span className="dot" /><b>{o.id}</b><div><strong>{o.title}</strong><small>{o.text}</small></div>
            </li>
          ))}
        </ul>
      </Panel>

      <Btn gold x={478} y={698} w={500} h={88} icon={<Img src="/assets/sprites/ui/rocket.jpg" size={62} />} chevron={false} onClick={start}>START MISSION</Btn>
      <Btn x={17} y={724} w={282} h={82} icon={<Img src="/assets/sprites/ui/home.jpg" size={50} />} onClick={() => go("home")}>Dashboard</Btn>
      <Btn x={1214} y={724} w={230} h={82} icon={<Img src="/assets/sprites/ui/market.jpg" size={50} />} chevron={false}>Market</Btn>
    </Screen>
  );
}
