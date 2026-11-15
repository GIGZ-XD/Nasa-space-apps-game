import { useState, type ReactNode } from "react";
import { Btn, Coins, Img, Moonscape, Panel, Screen } from "../components/layout/ui";
import { findPartById } from "../data/marketData";
import { formatCoins, STARTING_COINS } from "../stores/gameStore";

/** The four parts of the ideal Mission 1 (Geo-Satellite) spacecraft. */
const IDEAL = [
  { slot: "Launchpad", id: "lp1" },
  { slot: "Launch Vehicle", id: "lv1" },
  { slot: "Satellite Bus", id: "sat2" },
  { slot: "Sensor", id: "sp2" },
].map((p) => ({ ...p, part: findPartById(p.id) }));
const IDEAL_COST = IDEAL.reduce((a, p) => a + (p.part?.price ?? 0), 0);

const hl = (t: string) => <b style={{ color: "var(--gold)" }}>{t}</b>;
const cy = (t: string) => <b style={{ color: "var(--cyan)" }}>{t}</b>;

interface Step {
  title: string;
  icon: string;
  stella: string;
  /** Space fun fact, told by STELLA */
  fact: string;
  body: ReactNode;
}

const P = ({ children }: { children: ReactNode }) => <p style={{ margin: "0 0 12px" }}>{children}</p>;

const STEPS: Step[] = [
  {
    title: "Welcome, Commander",
    icon: "👋",
    stella: "Let's walk through Mission 1 together. It only takes a minute!",
    fact: "Woof! On Venus, one day lasts longer than its whole year. It spins so slowly that a day is 243 Earth days, but it circles the Sun in just 225!",
    body: (
      <>
        <P>
          In <b>Mission Architect</b> you design a spacecraft, launch it, and try to complete the mission.
        </P>
        <P>
          Mission 1 is the {hl("Geo-Satellite Mission")}: put a communications satellite into orbit around the Earth.
        </P>
        <P>
          The loop is always the same: {cy("Buy parts")} → {cy("Build in the Workshop")} → {cy("Launch")} →{" "}
          {cy("Earn rewards")} → unlock the next mission.
        </P>
        <P>
          You start with {hl(formatCoins(STARTING_COINS) + " coins")}. Spend them wisely!
        </P>
      </>
    ),
  },
  {
    title: "Step 1 — Pick the mission",
    icon: "🚀",
    stella: "Missions unlock one after another. Finish this one to open Mission 2!",
    fact: "Our Mission 1 satellite lives in a special spot: about 35,786 km up. At that height it circles once every 24 hours, so it seems to hover over the same place on Earth forever!",
    body: (
      <>
        <P>
          Press {cy("Missions")} on the Dashboard and open {hl("Geo-Satellite Mission")}.
        </P>
        <P>
          The mission brief shows the {cy("objectives")} (launch, reach orbit, transfer to geostationary orbit) and the{" "}
          {cy("rewards")}: up to {hl("3M coins")} and {hl("200 XP")}.
        </P>
        <P>
          Only Mission 1 is open at the start. Later missions stay locked 🔒 until you complete the one before.
        </P>
      </>
    ),
  },
  {
    title: "Step 2 — Buy your parts",
    icon: "🛒",
    stella: "No parts, no rocket. The Market is where you shop.",
    fact: "Space is expensive! The International Space Station cost well over 100 billion dollars to build. Good thing your budget only needs a few million. Woof!",
    body: (
      <>
        <P>
          Open the {cy("Market")}. Nothing is handed to you: you must buy every part yourself. Mission 1 needs four:
        </P>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, margin: "6px 0 14px" }}>
          {IDEAL.map((p) => (
            <div
              key={p.id}
              style={{
                background: "rgba(8,18,44,0.8)",
                border: "2px solid #1b5fb3",
                padding: 10,
                textAlign: "center",
                fontSize: 13,
              }}
            >
              <div style={{ height: 70, display: "grid", placeItems: "center" }}>
                {p.part?.img && <img className="pix" src={p.part.img} alt="" style={{ maxHeight: 66, maxWidth: 66, objectFit: "contain" }} />}
              </div>
              <div style={{ color: "var(--cyan)", fontWeight: 700, margin: "6px 0 2px" }}>{p.slot}</div>
              <div style={{ minHeight: 34, color: "#eaf2ff" }}>{p.part?.name}</div>
              <div style={{ color: "var(--gold)", fontWeight: 700 }}>{p.part ? formatCoins(p.part.price) : ""}</div>
            </div>
          ))}
        </div>
        <P>
          These four are the {hl("ideal")} build, costing about {hl(formatCoins(IDEAL_COST))} in total. Cheaper or
          different parts work too, but they score lower.
        </P>
      </>
    ),
  },
  {
    title: "Step 3 — Build in the Workshop",
    icon: "🛠️",
    stella: "Pick a slot on the left, then press Install on a part you own.",
    fact: "Rockets are mostly fuel! Around 90% of a rocket's weight at liftoff is propellant. The spacecraft on top is the tiny part. Arf!",
    body: (
      <>
        <P>
          From the brief press {hl("START MISSION")} to enter the {cy("Workshop")}.
        </P>
        <P>
          • {cy("Left")}: the spacecraft slots (Launchpad, Launch Vehicle, Satellite, Sensors, Lander).<br />
          • {cy("Right")}: the parts you own for the selected slot. Press {hl("Install")} to fit one.<br />
          • {cy("Centre")}: your assembly bay, built up piece by piece, with a live score.
        </P>
        <P>
          Missing something? Press {cy("Market")}, then the gold {hl("BACK TO WORKSHOP")} button brings you straight back.
        </P>
      </>
    ),
  },
  {
    title: "Step 4 — Your Level of Success",
    icon: "📊",
    stella: "This number decides everything. Keep an eye on it!",
    fact: "Voyager 1 launched in 1977 and is STILL talking to us from over 24 billion kilometres away. Great engineering scores high marks, just like you want to!",
    body: (
      <>
        <P>
          The workshop scores your build live as the {hl("LOS")} (Level of Success), from 0 to 100%. Every part is compared
          with the {cy("ideal")} part for that slot.
        </P>
        <div style={{ margin: "4px 0 14px" }}>
          <div style={{ position: "relative", height: 26, background: "#0b1a40", border: "2px solid #1b5fb3" }}>
            <div style={{ width: "97.9%", height: "100%", background: "linear-gradient(90deg,#16a34a,#4ade80)" }} />
            <div style={{ position: "absolute", left: "60%", top: -6, bottom: -6, width: 3, background: "var(--gold)" }} />
          </div>
          <div style={{ fontSize: 13, color: "#8ec5ff", marginTop: 4 }}>
            Gold line = the 60% pass mark. Example: the Electron rocket (95%) instead of the ideal one gives 97.9% — still a success.
          </div>
        </div>
        <P>
          • {hl("60% or more")} → {cy("MISSION SUCCESSFUL")}.<br />
          • {hl("Below 60%")} → the rocket fails and {cy("MISSION FAILED")}.<br />
          • Open the {cy("LOS vs Ideal")} tab to see which part is dragging your score down.
        </P>
      </>
    ),
  },
  {
    title: "Step 5 — Safety checks",
    icon: "✅",
    stella: "The launch button stays locked until every check passes.",
    fact: "Far from the Sun, solar panels don't work well. So the Voyager probes run on the heat from decaying plutonium. That's why power checks matter, woof!",
    body: (
      <>
        <P>Besides the score, the game checks that your spacecraft can physically fly:</P>
        <P>
          • {cy("Mandatory parts")}: every required slot must be filled.<br />
          • {cy("Budget")}: total parts cost within 20M.<br />
          • {cy("Mass")}: spacecraft + fuel must fit what the rocket can carry.<br />
          • {cy("Power")}: your satellite must generate enough power for its instruments. Mission 1 needs {hl("25 W")} net.<br />
          • {cy("Delta-V")}: the rocket must be strong enough to reach orbit.
        </P>
        <P>
          Careful: adding extra instruments uses power. If a check fails, the workshop tells you which one.
        </P>
      </>
    ),
  },
  {
    title: "Step 6 — Launch!",
    icon: "🔥",
    stella: "3, 2, 1... You'll see your own rocket and satellite fly.",
    fact: "To stay in orbit around Earth, you have to travel about 28,000 km/h, which is roughly 8 kilometres every second! Hold onto your helmet!",
    body: (
      <>
        <P>
          When everything is green, press {hl("GO TO LAUNCHPAD")}. Press {hl("Space")} (or click) to start the countdown.
        </P>
        <P>
          Your chosen pad and rocket lift off and your satellite enters orbit around the Earth. After {hl("2 orbits")}{" "}
          you'll see {cy("MISSION SUCCESSFUL")} and a {hl("Claim your rewards")} button.
        </P>
        <P>
          If your score was too low, the rocket climbs a little, then {hl("explodes")}: {cy("MISSION FAILED")}.
        </P>
      </>
    ),
  },
  {
    title: "Step 7 — Rewards & what's next",
    icon: "🏆",
    stella: "Win or lose, you learn something. Then build a better one!",
    fact: "Astronauts on the Space Station see 16 sunrises and 16 sunsets every single day, because it circles the Earth about every 90 minutes. Wow!",
    body: (
      <>
        <P>
          • {hl("Coins")}: up to 3M, scaled by your score (80% score = 80% of the coins).<br />
          • {hl("XP")}: a flat {hl("200 XP")} for completing Mission 1. Gain enough XP to {cy("level up")}.<br />
          • {hl("Success")} unlocks {cy("Mission 2")}. A failure earns no coins or XP and unlocks nothing.
        </P>
        <P>
          ⚠️ {hl("Parts are expended!")} After every launch, win or lose, all the parts you used are destroyed. Buy new ones
          for your next attempt.
        </P>
        <P>
          Tip: coins from Mission 1 pay for better parts for Mission 2. Good luck, Commander!
        </P>
      </>
    ),
  },
];

export function TutorialPage({ go }: { go: (s: string) => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <Screen>
      <Moonscape small />

      <Panel x={462} y={12} w={532} h={64}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
          <div className="px sprite-title" style={{ color: "var(--gold)", fontWeight: 700, fontSize: 22, letterSpacing: 2, textShadow: "0 0 10px rgba(255, 210, 31, 0.6)" }}>
            ★ TUTORIAL ★
          </div>
          <div style={{ color: "var(--cyan)", fontSize: 12, marginTop: 2 }}>Mission 1: Geo-Satellite Mission</div>
        </div>
      </Panel>
      <Coins />

      {/* Lesson */}
      <Panel x={40} y={100} w={900} h={560} tab={<>{step.icon} {step.title}</>}>
        <div style={{ position: "absolute", left: 28, right: 28, top: 52, bottom: 60, zIndex: 1, overflowY: "auto", fontSize: 19, lineHeight: 1.5, color: "#eaf2ff" }}>
          {step.body}
        </div>
        {/* progress dots */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 20, display: "flex", justifyContent: "center", gap: 10, zIndex: 1 }}>
          {STEPS.map((_, n) => (
            <button
              key={n}
              aria-label={`Go to step ${n + 1}`}
              onClick={() => setI(n)}
              style={{
                width: n === i ? 28 : 12,
                height: 12,
                padding: 0,
                cursor: "pointer",
                border: "none",
                background: n === i ? "var(--gold)" : n < i ? "var(--neon)" : "#1b3a6b",
                borderRadius: 6,
              }}
            />
          ))}
        </div>
      </Panel>

      {/* STELLA guide */}
      <img
        className="pix abs"
        src="/assets/sprites/ui/stella2.jpg"
        alt="STELLA"
        style={{ left: 1000, top: 110, width: 300, WebkitMaskImage: "radial-gradient(ellipse at 50% 50%,#000 70%,transparent 96%)", maskImage: "radial-gradient(ellipse at 50% 50%,#000 70%,transparent 96%)" }}
      />
      <Panel x={950} y={414} w={470} h={236} className="bubble home-bubble">
        <div style={{ position: "absolute", inset: 0, padding: "16px 22px", zIndex: 1, overflowY: "auto" }}>
          <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.3 }}>
            <b className="hl">STELLA:</b> {step.stella}
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(95, 227, 255, 0.35)", fontSize: 16, lineHeight: 1.35, color: "#cfe9ff" }}>
            <b style={{ color: "var(--cyan)" }}>🌟 Space fun fact:</b> {step.fact}
          </div>
        </div>
      </Panel>
      <div style={{ position: "absolute", left: 950, top: 662, width: 470, textAlign: "center", color: "#8ec5ff", fontSize: 15, fontWeight: 600 }}>
        Step {i + 1} of {STEPS.length}
      </div>

      {/* Navigation */}
      <Btn x={12} y={724} w={290} h={82} icon={<Img src="/assets/sprites/ui/home.jpg" size={50} />} onClick={() => go("home")}>
        Dashboard
      </Btn>
      {i > 0 && (
        <Btn x={500} y={698} w={200} h={80} chevron={false} onClick={() => setI(i - 1)}>
          ‹ Back
        </Btn>
      )}
      {!last ? (
        <Btn gold x={740} y={698} w={260} h={80} chevron={false} onClick={() => setI(i + 1)}>
          Next ›
        </Btn>
      ) : (
        <Btn gold x={740} y={698} w={360} h={80} icon={<Img src="/assets/sprites/ui/rocket.jpg" size={46} />} chevron={false} onClick={() => go("select")}>
          START MISSIONS
        </Btn>
      )}
      <Btn x={1222} y={724} w={222} h={82} icon={<Img src="/assets/sprites/ui/market.jpg" size={50} />} chevron={false} onClick={() => go("market")}>
        Market
      </Btn>
    </Screen>
  );
}
