import React, { useState } from "react";
import type { Component } from "../component-catalogue/component.types";
import {
  mapSelectedComponentsToVisualSlots,
  type VisualSlotItem,
} from "./slotMapping";
import styles from "./SpacecraftPreview.module.css";

export interface SpacecraftPreviewProps {
  installedComponents: Array<{ component: Component; instanceId: string }>;
  selectedInstanceId: string | null;
  onSelectComponent?: (instanceId: string | null) => void;
  onRemoveComponent?: (instanceId: string) => void;
}

export function SpacecraftPreview({
  installedComponents,
  selectedInstanceId,
  onSelectComponent,
  onRemoveComponent,
}: SpacecraftPreviewProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"visual" | "schematic">("visual");
  const [hoveredSlot, setHoveredSlot] = useState<VisualSlotItem | null>(null);

  // Map mounted components into sorted visual slot layers
  const slotLayers = mapSelectedComponentsToVisualSlots(installedComponents);

  const activeHoverOrSelected =
    hoveredSlot ??
    slotLayers.find((s) => s.instanceId === selectedInstanceId) ??
    null;

  const hasComponents = installedComponents.length > 0;
  const hasStructure = slotLayers.some((s) => s.category === "structure");

  // Handlers
  function handleSlotClick(slot: VisualSlotItem) {
    if (!onSelectComponent) return;
    if (selectedInstanceId === slot.instanceId) {
      onSelectComponent(null);
    } else {
      onSelectComponent(slot.instanceId);
    }
  }

  function handleZoomIn() {
    setZoomLevel((z) => Math.min(1.5, Number((z + 0.15).toFixed(2))));
  }

  function handleZoomOut() {
    setZoomLevel((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))));
  }

  function handleZoomReset() {
    setZoomLevel(1);
  }

  return (
    <div className={styles.previewContainer} aria-label="Spacecraft Visual Assembly Preview">
      {/* Visual Workspace Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarTitleGroup}>
          <span className={styles.toolbarTitle}>🛰️ Visual Assembly Preview</span>
          <span className={styles.componentBadge}>
            {installedComponents.length} Mounted Components
          </span>
        </div>

        <div className={styles.toolbarControls}>
          <button
            type="button"
            className={`${styles.modeToggleBtn} ${viewMode === "visual" ? styles.modeToggleActive : ""}`}
            onClick={() => setViewMode("visual")}
            aria-pressed={viewMode === "visual"}
          >
            Visual Render
          </button>
          <button
            type="button"
            className={`${styles.modeToggleBtn} ${viewMode === "schematic" ? styles.modeToggleActive : ""}`}
            onClick={() => setViewMode("schematic")}
            aria-pressed={viewMode === "schematic"}
          >
            Schematic Wireframe
          </button>

          <button
            type="button"
            className={styles.zoomBtn}
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            −
          </button>
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={handleZoomReset}
            title="Reset Zoom"
            aria-label="Reset Zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
          >
            +
          </button>
        </div>
      </div>

      {/* SVG Preview Canvas */}
      <div className={styles.canvasWrapper}>
        <svg
          viewBox="0 0 600 600"
          className={styles.svgCanvas}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
          aria-hidden="true"
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="blueprint-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path
                d="M 30 0 L 0 0 0 30"
                fill="none"
                stroke={viewMode === "schematic" ? "#0b3158" : "#0d2342"}
                strokeWidth="0.8"
              />
            </pattern>

            {/* Solar Cell Pattern */}
            <pattern id="solar-cell-grid" width="16" height="12" patternUnits="userSpaceOnUse">
              <rect width="16" height="12" fill="#0d2e61" stroke="#2564b3" strokeWidth="0.75" />
              <line x1="8" y1="0" x2="8" y2="12" stroke="#488ee0" strokeWidth="0.5" />
            </pattern>

            {/* MLI Foil Gradient */}
            <linearGradient id="mli-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f39c12" />
              <stop offset="50%" stopColor="#f1c40f" />
              <stop offset="100%" stopColor="#d35400" />
            </linearGradient>

            {/* Ion Plasma Beam Glow */}
            <radialGradient id="ion-plasma" cx="50%" cy="0%" r="90%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="1" />
              <stop offset="50%" stopColor="#00a8ff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0044ff" stopOpacity="0" />
            </radialGradient>

            {/* Chemical Thruster Glow */}
            <radialGradient id="chem-flame" cx="50%" cy="0%" r="90%">
              <stop offset="0%" stopColor="#fff2a8" stopOpacity="1" />
              <stop offset="40%" stopColor="#ff793f" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#cd6133" stopOpacity="0" />
            </radialGradient>

            {/* Metal Gradients */}
            <linearGradient id="chassis-metal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3352" />
              <stop offset="50%" stopColor="#2c476f" />
              <stop offset="100%" stopColor="#1a2d48" />
            </linearGradient>

            <linearGradient id="radiator-silver" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ecf0f1" />
              <stop offset="100%" stopColor="#bdc3c7" />
            </linearGradient>
          </defs>

          {/* Background Blueprint Grid */}
          <rect width="600" height="600" fill="url(#blueprint-grid)" />

          {/* Coordinate Guide Rings & Crosshairs */}
          <circle cx="300" cy="300" r="180" fill="none" stroke="#102c52" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="300" cy="300" r="260" fill="none" stroke="#0e2342" strokeWidth="1" strokeDasharray="2 8" />
          <line x1="300" y1="20" x2="300" y2="580" stroke="#0f2647" strokeWidth="1" strokeDasharray="4 8" />
          <line x1="20" y1="300" x2="580" y2="300" stroke="#0f2647" strokeWidth="1" strokeDasharray="4 8" />

          {/* ---- EMPTY STATE CRADLE PLACEHOLDERS ---- */}
          {!hasStructure && (
            <g opacity="0.35">
              {/* Ghost Bus Chassis */}
              <rect
                x="240"
                y="180"
                width="120"
                height="240"
                rx="6"
                fill="none"
                stroke="#3f86e0"
                strokeWidth="1.5"
                strokeDasharray="6 6"
              />
              <text x="300" y="305" textAnchor="middle" fill="#588ec9" fontSize="11" letterSpacing="1">
                AWAITING BUS CHASSIS
              </text>

              {/* Ghost Solar Wings */}
              <rect x="70" y="240" width="150" height="120" rx="4" fill="none" stroke="#2564b3" strokeWidth="1" strokeDasharray="4 6" />
              <rect x="380" y="240" width="150" height="120" rx="4" fill="none" stroke="#2564b3" strokeWidth="1" strokeDasharray="4 6" />

              {/* Ghost Engine Mount */}
              <path d="M 270 420 L 300 470 L 330 420 Z" fill="none" stroke="#2564b3" strokeWidth="1" strokeDasharray="4 4" />

              {/* Ghost Comms Mount */}
              <circle cx="300" cy="140" r="26" fill="none" stroke="#2564b3" strokeWidth="1" strokeDasharray="4 4" />
            </g>
          )}

          {/* ---- RENDER MOUNTED SLOTS ---- */}
          {slotLayers.map((slot) => {
            const isSelected = selectedInstanceId === slot.instanceId;
            const isHovered = hoveredSlot?.instanceId === slot.instanceId;
            const highlightClass = isSelected || isHovered ? styles.slotHighlighted : "";

            return (
              <g
                key={slot.instanceId}
                className={`${styles.interactiveSlot} ${highlightClass}`}
                onClick={() => handleSlotClick(slot)}
                onMouseEnter={() => setHoveredSlot(slot)}
                onMouseLeave={() => setHoveredSlot(null)}
                tabIndex={0}
                role="button"
                aria-label={`Inspect ${slot.name} (${slot.category})`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleSlotClick(slot);
                  }
                }}
              >
                {/* 1. PROPULSION ENGINE & RCS */}
                {(slot.slotId === "propulsion-engine" || slot.slotId === "propulsion-rcs") && (
                  <g id="propulsion-layer">
                    {slot.subtype === "ion-engine" ? (
                      <>
                        {/* Ion Plasma Beam Exhaust */}
                        <polygon points="275,445 325,445 350,550 250,550" fill="url(#ion-plasma)" opacity="0.85" />
                        <ellipse cx="300" cy="445" rx="25" ry="8" fill="#00f0ff" />
                        {/* Ion Thruster Cowl */}
                        <rect x="270" y="420" width="60" height="25" rx="3" fill="#1b2a47" stroke="#00f0ff" strokeWidth="1.5" />
                        <line x1="270" y1="432" x2="330" y2="432" stroke="#00d2d3" strokeWidth="1" />
                      </>
                    ) : slot.subtype === "chemical-engine" ? (
                      <>
                        {/* Chemical Rocket Exhaust Flame */}
                        <polygon points="270,445 330,445 360,560 240,560" fill="url(#chem-flame)" opacity="0.9" />
                        {/* Engine Nozzle Bell */}
                        <path d="M 280,420 L 320,420 L 335,450 L 265,450 Z" fill="#2d3436" stroke="#e17055" strokeWidth="1.5" />
                        {/* Gimbal Ring */}
                        <rect x="285" y="415" width="30" height="6" rx="2" fill="#636e72" stroke="#b2bec3" strokeWidth="1" />
                      </>
                    ) : (
                      <>
                        {/* Cold Gas RCS Quad Blocks on corners */}
                        <rect x="225" y="195" width="15" height="15" rx="2" fill="#34495e" stroke="#7ecfff" strokeWidth="1" />
                        <line x1="225" y1="202" x2="215" y2="202" stroke="#7ecfff" strokeWidth="2" />
                        <rect x="360" y="195" width="15" height="15" rx="2" fill="#34495e" stroke="#7ecfff" strokeWidth="1" />
                        <line x1="375" y1="202" x2="385" y2="202" stroke="#7ecfff" strokeWidth="2" />
                        <rect x="225" y="390" width="15" height="15" rx="2" fill="#34495e" stroke="#7ecfff" strokeWidth="1" />
                        <line x1="225" y1="397" x2="215" y2="397" stroke="#7ecfff" strokeWidth="2" />
                        <rect x="360" y="390" width="15" height="15" rx="2" fill="#34495e" stroke="#7ecfff" strokeWidth="1" />
                        <line x1="375" y1="397" x2="385" y2="397" stroke="#7ecfff" strokeWidth="2" />
                      </>
                    )}
                  </g>
                )}

                {/* 2. CENTRAL BUS STRUCTURE */}
                {slot.slotId === "bus-structure" && (
                  <g id="structure-layer">
                    {slot.subtype === "espahigh" ? (
                      <>
                        {/* ESPA Heavy SmallSat Composite Bus */}
                        <polygon
                          points="250,180 350,180 380,240 380,360 350,420 250,420 220,360 220,240"
                          fill="url(#chassis-metal)"
                          stroke={isSelected ? "#7ecfff" : "#386799"}
                          strokeWidth="2.5"
                        />
                        {/* Internal ESPA Ring Interface */}
                        <circle cx="300" cy="300" r="55" fill="#08182b" stroke="#487eb0" strokeWidth="2" />
                        <circle cx="300" cy="300" r="35" fill="#0c233f" stroke="#273c75" strokeWidth="1.5" strokeDasharray="4 4" />
                        {/* Bus Access Panel Hatches */}
                        <rect x="270" y="200" width="60" height="25" rx="2" fill="#102542" stroke="#2c5382" strokeWidth="1" />
                        <rect x="270" y="375" width="60" height="25" rx="2" fill="#102542" stroke="#2c5382" strokeWidth="1" />
                      </>
                    ) : (
                      <>
                        {/* 3U CubeSat Bus Structure */}
                        <rect
                          x="240"
                          y="180"
                          width="120"
                          height="240"
                          rx="4"
                          fill="url(#chassis-metal)"
                          stroke={isSelected ? "#7ecfff" : "#3a628f"}
                          strokeWidth="2.5"
                        />
                        {/* 3U CubeSat 1U Division Lines */}
                        <line x1="240" y1="260" x2="360" y2="260" stroke="#162e4f" strokeWidth="2" />
                        <line x1="240" y1="340" x2="360" y2="340" stroke="#162e4f" strokeWidth="2" />
                        {/* Corner Deployment Rails */}
                        <rect x="236" y="176" width="6" height="248" rx="2" fill="#40739e" stroke="#273c75" strokeWidth="1" />
                        <rect x="358" y="176" width="6" height="248" rx="2" fill="#40739e" stroke="#273c75" strokeWidth="1" />
                        {/* Internal Electronics Bay Windows */}
                        <rect x="255" y="275" width="90" height="50" rx="3" fill="#08172c" stroke="#204975" strokeWidth="1" />
                        <circle cx="300" cy="300" r="6" fill="#00d2d3" opacity="0.8" />
                      </>
                    )}
                  </g>
                )}

                {/* 3. THERMAL MLI INSULATION */}
                {slot.slotId === "mli-insulation" && (
                  <g id="mli-layer">
                    <rect
                      x="244"
                      y="190"
                      width="112"
                      height="220"
                      rx="3"
                      fill="url(#mli-gold)"
                      opacity="0.85"
                      stroke="#f39c12"
                      strokeWidth="1.5"
                    />
                    {/* MLI Quilting Seam Lines */}
                    <line x1="244" y1="230" x2="356" y2="230" stroke="#d35400" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="244" y1="270" x2="356" y2="270" stroke="#d35400" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="244" y1="310" x2="356" y2="310" stroke="#d35400" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="244" y1="350" x2="356" y2="350" stroke="#d35400" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="244" y1="390" x2="356" y2="390" stroke="#d35400" strokeWidth="1" strokeDasharray="3 3" />
                  </g>
                )}

                {/* 4. POWER: SOLAR WINGS (DEPLOYABLE) */}
                {slot.slotId === "solar-wings" && (
                  <g id="solar-wings-layer">
                    {/* Left Wing Articulated Bracket */}
                    <line x1="240" y1="300" x2="200" y2="300" stroke="#718093" strokeWidth="4" />
                    <circle cx="200" cy="300" r="4" fill="#dcdde1" stroke="#2f3640" strokeWidth="1.5" />
                    {/* Left Wing Solar Array */}
                    <rect
                      x="50"
                      y="235"
                      width="150"
                      height="130"
                      rx="3"
                      fill="url(#solar-cell-grid)"
                      stroke={isSelected ? "#7ecfff" : "#1e4c85"}
                      strokeWidth="2"
                    />
                    <line x1="125" y1="235" x2="125" y2="365" stroke="#718093" strokeWidth="2" />

                    {/* Right Wing Articulated Bracket */}
                    <line x1="360" y1="300" x2="400" y2="300" stroke="#718093" strokeWidth="4" />
                    <circle cx="400" cy="300" r="4" fill="#dcdde1" stroke="#2f3640" strokeWidth="1.5" />
                    {/* Right Wing Solar Array */}
                    <rect
                      x="400"
                      y="235"
                      width="150"
                      height="130"
                      rx="3"
                      fill="url(#solar-cell-grid)"
                      stroke={isSelected ? "#7ecfff" : "#1e4c85"}
                      strokeWidth="2"
                    />
                    <line x1="475" y1="235" x2="475" y2="365" stroke="#718093" strokeWidth="2" />
                  </g>
                )}

                {/* 5. POWER: SOLAR BODY (FIXED 3U) */}
                {slot.slotId === "solar-body" && (
                  <g id="solar-body-layer">
                    <rect
                      x="248"
                      y="190"
                      width="104"
                      height="215"
                      rx="2"
                      fill="url(#solar-cell-grid)"
                      stroke="#2772c7"
                      strokeWidth="1.5"
                    />
                  </g>
                )}

                {/* 6. POWER: BATTERY PACK */}
                {slot.slotId === "battery-module" && (
                  <g id="battery-layer">
                    <rect x="260" y="325" width="80" height="30" rx="3" fill="#1e272e" stroke="#2ed573" strokeWidth="1.5" />
                    <text x="300" y="342" textAnchor="middle" fill="#2ed573" fontSize="8" fontWeight="bold">
                      Li-Ion 50Wh
                    </text>
                    {/* Status LEDs */}
                    <circle cx="270" cy="347" r="2.5" fill="#2ed573" />
                    <circle cx="280" cy="347" r="2.5" fill="#2ed573" />
                    <circle cx="290" cy="347" r="2.5" fill="#2ed573" />
                    <circle cx="300" cy="347" r="2.5" fill="#2ed573" />
                  </g>
                )}

                {/* 7. THERMAL: ACTIVE RADIATOR PANELS */}
                {slot.slotId === "radiator-panels" && (
                  <g id="radiators-layer">
                    {/* Left Radiator Fin */}
                    <polygon
                      points="170,170 235,210 235,245 170,210"
                      fill="url(#radiator-silver)"
                      stroke={isSelected ? "#7ecfff" : "#95a5a6"}
                      strokeWidth="1.5"
                    />
                    <line x1="170" y1="190" x2="235" y2="228" stroke="#3498db" strokeWidth="1.5" />

                    {/* Right Radiator Fin */}
                    <polygon
                      points="430,170 365,210 365,245 430,210"
                      fill="url(#radiator-silver)"
                      stroke={isSelected ? "#7ecfff" : "#95a5a6"}
                      strokeWidth="1.5"
                    />
                    <line x1="430" y1="190" x2="365" y2="228" stroke="#3498db" strokeWidth="1.5" />
                  </g>
                )}

                {/* 8. AVIONICS: COMPUTER & ADCS */}
                {slot.slotId === "avionics-computer" && (
                  <g id="avionics-comp-layer">
                    <rect x="265" y="215" width="70" height="25" rx="3" fill="#0c1b33" stroke="#00d2d3" strokeWidth="1.2" />
                    <text x="300" y="228" textAnchor="middle" fill="#00d2d3" fontSize="7" fontWeight="bold">
                      RAD-HARD OBC
                    </text>
                    <circle cx="273" cy="232" r="2" fill="#00d2d3">
                      <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
                    </circle>
                  </g>
                )}

                {slot.slotId === "avionics-adcs" && (
                  <g id="avionics-adcs-layer">
                    <rect x="270" y="245" width="60" height="25" rx="3" fill="#13243d" stroke="#e056fd" strokeWidth="1.2" />
                    <circle cx="282" cy="257" r="6" fill="none" stroke="#e056fd" strokeWidth="1.2" />
                    <circle cx="300" cy="257" r="6" fill="none" stroke="#e056fd" strokeWidth="1.2" />
                    <circle cx="318" cy="257" r="6" fill="none" stroke="#e056fd" strokeWidth="1.2" />
                  </g>
                )}

                {/* 9. COMMUNICATIONS: DISH & PATCH */}
                {slot.slotId === "antenna-dish" && (
                  <g id="comms-dish-layer">
                    {/* Steerable X-Band Dish */}
                    <line x1="300" y1="180" x2="300" y2="135" stroke="#718093" strokeWidth="3" />
                    <circle cx="300" cy="135" r="4" fill="#a4b0be" />
                    {/* Parabolic Reflector */}
                    <path
                      d="M 245,115 Q 300,75 355,115"
                      fill="none"
                      stroke={isSelected ? "#7ecfff" : "#ecf0f1"}
                      strokeWidth="3.5"
                    />
                    {/* Feed Horn Struts */}
                    <line x1="260" y1="110" x2="300" y2="90" stroke="#718093" strokeWidth="1.2" />
                    <line x1="340" y1="110" x2="300" y2="90" stroke="#718093" strokeWidth="1.2" />
                    <circle cx="300" cy="90" r="3" fill="#e74c3c" />
                    {/* RF Downlink Signals */}
                    <path d="M 285,65 Q 300,55 315,65" fill="none" stroke="#00d2d3" strokeWidth="1" strokeDasharray="2 3" opacity="0.8" />
                    <path d="M 270,50 Q 300,35 330,50" fill="none" stroke="#00d2d3" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
                  </g>
                )}

                {slot.slotId === "antenna-patch" && (
                  <g id="comms-patch-layer">
                    <rect x="285" y="165" width="30" height="15" rx="2" fill="#2c3e50" stroke="#f1c40f" strokeWidth="1.5" />
                    <circle cx="300" cy="172" r="3" fill="#2ecc71">
                      <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  </g>
                )}

                {/* 10. SCIENCE PAYLOADS */}
                {slot.slotId === "payload-camera" && (
                  <g id="payload-camera-layer">
                    {/* High-Resolution Multispectral Imager Barrel */}
                    <rect x="280" y="375" width="40" height="30" rx="3" fill="#1e272e" stroke="#22a6b3" strokeWidth="1.5" />
                    <ellipse cx="300" cy="405" rx="16" ry="6" fill="#0984e3" stroke="#74b9ff" strokeWidth="1.5" />
                    <circle cx="300" cy="405" r="4" fill="#ffffff" opacity="0.8" />
                  </g>
                )}

                {slot.slotId === "payload-radar" && (
                  <g id="payload-radar-layer">
                    {/* SAR Planar Radar Antenna */}
                    <rect x="210" y="380" width="180" height="24" rx="2" fill="#13243d" stroke="#f0932b" strokeWidth="1.5" />
                    <line x1="210" y1="392" x2="390" y2="392" stroke="#f0932b" strokeWidth="0.8" strokeDasharray="4 2" />
                    <text x="300" y="396" textAnchor="middle" fill="#ffbe76" fontSize="7" fontWeight="bold">
                      SYNTHETIC APERTURE RADAR
                    </text>
                  </g>
                )}

                {slot.slotId === "payload-boom" && (
                  <g id="payload-boom-layer">
                    {/* Boom Mounted Magnetometer Mast extending upper left */}
                    <line x1="240" y1="200" x2="130" y2="100" stroke="#a4b0be" strokeWidth="2" />
                    <circle cx="130" cy="100" r="7" fill="#eb4d4b" stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                )}

                {/* 11. AUX / UNKNOWN COMPONENT ATTACHMENT */}
                {slot.slotId === "aux-attachment" && (
                  <g id="aux-layer">
                    <rect x="280" y="275" width="40" height="20" rx="3" fill="#2d3436" stroke="#95a5a6" strokeWidth="1" strokeDasharray="3 2" />
                    <circle cx="300" cy="285" r="3" fill="#ffeaa7" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Empty Cradle Overlay Text */}
        {!hasComponents && (
          <div className={styles.emptyCradle}>
            <span className={styles.emptyCradleIcon}>🛠️</span>
            <h3 className={styles.emptyCradleTitle}>Spacecraft Assembly Cradle Empty</h3>
            <p className={styles.emptyCradleHint}>
              Select a <strong>Structure Bus</strong> from the catalogue to begin mounting subsystem hardware.
            </p>
          </div>
        )}

        {/* Interactive HUD Tooltip on Hover or Selection */}
        {activeHoverOrSelected && (
          <aside className={styles.tooltipOverlay} role="status" aria-live="polite">
            <div className={styles.tooltipInfo}>
              <span className={styles.tooltipName}>{activeHoverOrSelected.name}</span>
              <span className={styles.tooltipCategory}>
                {activeHoverOrSelected.category} · {activeHoverOrSelected.label}
              </span>
              <div className={styles.tooltipMetrics}>
                <span>
                  Mass:{" "}
                  <span className={styles.tooltipMetricVal}>
                    {installedComponents.find((c) => c.instanceId === activeHoverOrSelected.instanceId)?.component.massKg} kg
                  </span>
                </span>
                <span>
                  Power:{" "}
                  <span className={styles.tooltipMetricVal}>
                    {installedComponents.find((c) => c.instanceId === activeHoverOrSelected.instanceId)?.component.powerWatts} W
                  </span>
                </span>
                <span>
                  Thermal:{" "}
                  <span className={styles.tooltipMetricVal}>
                    {installedComponents.find((c) => c.instanceId === activeHoverOrSelected.instanceId)?.component.thermalWatts} W
                  </span>
                </span>
              </div>
            </div>

            {onRemoveComponent && (
              <button
                type="button"
                className={styles.tooltipRemoveBtn}
                onClick={() => onRemoveComponent(activeHoverOrSelected.instanceId)}
                title={`Remove ${activeHoverOrSelected.name}`}
                aria-label={`Remove ${activeHoverOrSelected.name}`}
              >
                ✕ Remove
              </button>
            )}
          </aside>
        )}
      </div>

      {/* Legend Bar */}
      <footer className={styles.legendBar}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#40739e" }} />
          <span>Structure</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#2564b3" }} />
          <span>Power</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#00f0ff" }} />
          <span>Propulsion</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#f39c12" }} />
          <span>Thermal</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#ecf0f1" }} />
          <span>Communications</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#00d2d3" }} />
          <span>Avionics</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#22a6b3" }} />
          <span>Payload</span>
        </div>
      </footer>
    </div>
  );
}
