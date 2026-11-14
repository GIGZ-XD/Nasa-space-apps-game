import { useEffect, useState, type CSSProperties, type PropsWithChildren, type ReactNode } from "react";
import { PLAYER } from "../../data/missions";
import "../../styles/ui.css";

export const STAGE_W = 1456;
export const STAGE_H = 820;

export function Screen({ children }: PropsWithChildren) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div className="viewport">
      <div className="stage" style={{ transform: `translate(-50%,-50%) scale(${scale})` }}>
        <div className="stars" />
        {children}
      </div>
    </div>
  );
}

export function Moonscape({ small }: { small?: boolean }) {
  return (
    <>
      <div className="mountains" />
      <div className={`ground ${small ? "small" : ""}`} />
    </>
  );
}

export function Img({ src, size, alt = "" }: { src: string; size: number; alt?: string }) {
  return <img className="pix" src={src} alt={alt} style={{ height: size, width: "auto", flex: "none" }} />;
}

export function Panel({ x, y, w, h, tab, className = "", children, style }: PropsWithChildren<{
  x: number; y: number; w: number; h: number; tab?: ReactNode; className?: string; style?: CSSProperties;
}>) {
  return (
    <div className={`panel ${className}`} style={{ left: x, top: y, width: w, height: h, ...style }}>
      <div className="frame" />
      {tab && <div className="tab">{tab}</div>}
      {children}
    </div>
  );
}

export function Btn({ x, y, w, h, icon, children, onClick, gold, chevron = true }: {
  x: number; y: number; w: number; h: number; icon?: ReactNode; children: ReactNode; onClick?: () => void; gold?: boolean; chevron?: boolean;
}) {
  return (
    <button className={`btn panel ${gold ? "gold" : ""}`} style={{ left: x, top: y, width: w, height: h }} onClick={onClick}>
      <div className="frame" />
      <span className="in">{icon}<span className="grow">{children}</span>{chevron && <span className="chev">›</span>}</span>
    </button>
  );
}

export function Coins() {
  return (
    <Panel x={1216} y={20} w={220} h={72}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 14, padding: "0 22px", zIndex: 1 }}>
        <Img src="/assets/sprites/ui/coin.jpg" size={44} /><b style={{ fontSize: 30 }}>{PLAYER.coins}</b>
      </div>
    </Panel>
  );
}
