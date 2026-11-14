import React, { useEffect, useMemo } from "react";
import type { Component, ComponentCategory } from "./component.types";
import styles from "./ComponentComparisonModal.module.css";

const CATEGORY_ICONS: Record<string, string> = {
  structure: "🛰️",
  power: "⚡",
  propulsion: "🔥",
  thermal: "🌡️",
  communications: "📡",
  avionics: "🖥️",
  payload: "🔭",
};

const CATEGORY_TRADEOFF_NARRATIVES: Record<ComponentCategory, string> = {
  structure:
    "Structure selection dictates the total mass budget, available internal mounting volume, and structural launch load envelope. The 3U CubeSat bus provides an ultra-lightweight, low-cost platform optimal for secondary nanosatellite missions, while the ESPA-class bus represents a 30x mass increase and 6x cost increase, but provides the structural rigidity and payload volume necessary to host multi-instrument, high-powered payloads up to 180 kg.",
  power:
    "Power architecture requires balancing orbital generation against eclipse storage. Fixed body-mounted panels minimize mass (0.4 kg) and deployment risk, but yield limited power (-24 W). The deployable articulated array quadruples solar generation (-100 W) to sustain power-hungry payloads, at the cost of +1.8 kg mass, higher financial cost, and deployment complexity. Batteries provide no power generation, but are mandatory to bridge solar eclipse periods with dedicated 50 Wh storage capacity.",
  propulsion:
    "Propulsion embodies the classic aerospace rocket equation trade-off between thrust magnitude and specific impulse (Isp). The Hall-effect ion engine delivers exceptional fuel economy (1650 s Isp — 7.3x more efficient than hydrazine), making it ideal for deep-space cruise and high delta-V requirements, but requires 140 W electrical power and delivers micro-thrust (0.045 N) necessitating long-duration spiral burns. Monopropellant hydrazine provides high impulsive thrust (20 N) for rapid orbital maneuvers, while cold gas offers minimal complexity, low mass, and non-toxic handling for modest station-keeping.",
  thermal:
    "Thermal management balances passive mass-efficiency against active heat rejection capability. Multi-layer insulation (MLI) is virtually zero-power and lightweight (0.5 kg), shielding the bus from deep-space radiation extremes. The active heat pipe radiator delivers 6.5x greater heat rejection (-65 W) to dissipate thermal loads from high-power avionics and radar payloads, but imposes a 3.0 kg mass penalty and 6 W electrical power draw.",
  communications:
    "Communications trade off RF downlink throughput against mass, power, and pointing precision. The S-band patch antenna provides an omni-directional, low-power link ideal for robust telemetry, tracking, and command (TT&C) housekeeping even during tumbling. The X-band steerable dish expands scientific telemetry bandwidth by 62.5x (8 Mbps vs 128 kbps), but demands 38 W power, 3.4 kg mass, and precise spacecraft pointing control.",
  avionics:
    "Avionics split command and data processing from attitude determination and control. The dual-core OBC handles flight software execution, command sequencing, and fault monitoring with minimal mass (0.7 kg). The reaction wheel assembly provides active 3-axis gyro stabilization and precision slewing for instrument target pointing, requiring 15 W power and 2.1 kg mass.",
  payload:
    "Payload selection governs the core mission science goals and sizes all spacecraft supporting subsystems. The fluxgate magnetometer provides low-power (3.5 W), low-mass (1.1 kg) in-situ planetary field exploration. The multispectral optical imager provides rich environmental Earth-observation imagery at 18 Mbps. Synthetic aperture radar (SAR) delivers day/night all-weather cloud-penetrating radar topography, but acts as a heavy mission driver requiring 130 W power, 16.5 kg mass, and 45 Mbps telemetry throughput.",
};

function formatCost(credits: number): string {
  if (credits >= 1_000_000) return `${(credits / 1_000_000).toFixed(2)}M ¢`;
  if (credits >= 1000) return `${(credits / 1000).toFixed(0)}k ¢`;
  return `${credits} ¢`;
}

function formatPower(watts: number): string {
  if (watts < 0) return `+${Math.abs(watts).toFixed(1)} W (gen)`;
  if (watts === 0) return "0 W (passive)";
  return `${watts.toFixed(1)} W (draw)`;
}

interface ComponentComparisonModalProps {
  category: ComponentCategory;
  availableComponents: Component[];
  comparedIds: string[];
  addedIds: Set<string>;
  onToggleComparedId: (id: string) => void;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function ComponentComparisonModal({
  category,
  availableComponents,
  comparedIds,
  addedIds,
  onToggleComparedId,
  onAdd,
  onRemove,
  onClose,
}: ComponentComparisonModalProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const comparedComponents = useMemo(() => {
    return availableComponents.filter((c) => comparedIds.includes(c.id));
  }, [availableComponents, comparedIds]);

  // Derived best values for highlighting advantages
  const extremes = useMemo(() => {
    if (comparedComponents.length === 0) return null;

    let minMassComp = comparedComponents[0];
    let maxMassComp = comparedComponents[0];
    let minCostComp = comparedComponents[0];
    let maxCostComp = comparedComponents[0];
    let mostPowerGenComp: Component | null = null;
    let leastPowerDrawComp: Component | null = null;
    let mostPowerDrawComp: Component | null = null;
    let maxThrustComp: Component | null = null;
    let maxIspComp: Component | null = null;
    let maxDataRateComp: Component | null = null;

    for (const c of comparedComponents) {
      if (c.massKg < minMassComp.massKg) minMassComp = c;
      if (c.massKg > maxMassComp.massKg) maxMassComp = c;
      if (c.costCredits < minCostComp.costCredits) minCostComp = c;
      if (c.costCredits > maxCostComp.costCredits) maxCostComp = c;

      // Power generation
      if (c.powerWatts < 0) {
        if (!mostPowerGenComp || c.powerWatts < mostPowerGenComp.powerWatts) {
          mostPowerGenComp = c;
        }
      } else {
        if (!leastPowerDrawComp || c.powerWatts < leastPowerDrawComp.powerWatts) {
          leastPowerDrawComp = c;
        }
        if (!mostPowerDrawComp || c.powerWatts > mostPowerDrawComp.powerWatts) {
          mostPowerDrawComp = c;
        }
      }

      // Specs
      if (c.specs?.thrustN !== undefined) {
        if (!maxThrustComp || (c.specs.thrustN > (maxThrustComp.specs?.thrustN ?? 0))) {
          maxThrustComp = c;
        }
      }
      if (c.specs?.ispSeconds !== undefined) {
        if (!maxIspComp || (c.specs.ispSeconds > (maxIspComp.specs?.ispSeconds ?? 0))) {
          maxIspComp = c;
        }
      }
      if (c.specs?.dataRateKbps !== undefined) {
        if (!maxDataRateComp || (c.specs.dataRateKbps > (maxDataRateComp.specs?.dataRateKbps ?? 0))) {
          maxDataRateComp = c;
        }
      }
    }

    return {
      minMassComp,
      maxMassComp,
      minCostComp,
      maxCostComp,
      mostPowerGenComp,
      leastPowerDrawComp,
      mostPowerDrawComp,
      maxThrustComp,
      maxIspComp,
      maxDataRateComp,
    };
  }, [comparedComponents]);

  // Generate dynamic pros/cons trade-off bullets per component
  const prosAndCons = useMemo(() => {
    if (!extremes) return new Map<string, { pros: string[]; cons: string[] }>();
    const map = new Map<string, { pros: string[]; cons: string[] }>();

    for (const c of comparedComponents) {
      const pros: string[] = [];
      const cons: string[] = [];

      // Mass
      if (c.id === extremes.minMassComp.id && comparedComponents.length > 1) {
        pros.push(`Lightest in comparison (${c.massKg} kg)`);
      } else if (c.id === extremes.maxMassComp.id && comparedComponents.length > 1) {
        const diff = (c.massKg - extremes.minMassComp.massKg).toFixed(1);
        cons.push(`Heaviest option (+${diff} kg payload burden)`);
      }

      // Cost
      if (c.id === extremes.minCostComp.id && comparedComponents.length > 1) {
        pros.push(`Lowest budget impact (${formatCost(c.costCredits)})`);
      } else if (c.id === extremes.maxCostComp.id && comparedComponents.length > 1) {
        const diff = formatCost(c.costCredits - extremes.minCostComp.costCredits);
        cons.push(`Highest cost penalty (+${diff})`);
      }

      // Power
      if (c.powerWatts < 0) {
        if (c.id === extremes.mostPowerGenComp?.id) {
          pros.push(`Highest solar output (+${Math.abs(c.powerWatts)} W generation)`);
        } else {
          pros.push(`Generates +${Math.abs(c.powerWatts)} W power`);
        }
      } else if (c.powerWatts === 0) {
        pros.push("Passive zero-power operation");
      } else {
        if (c.id === extremes.leastPowerDrawComp?.id && comparedComponents.length > 1) {
          pros.push(`Lowest electrical draw (${c.powerWatts} W)`);
        } else if (c.id === extremes.mostPowerDrawComp?.id && comparedComponents.length > 1) {
          cons.push(`High electrical demand (${c.powerWatts} W draw)`);
        }
      }

      // Specific specs
      if (c.specs?.thrustN !== undefined && c.id === extremes.maxThrustComp?.id && comparedComponents.length > 1) {
        pros.push(`Highest thrust capability (${c.specs.thrustN} N)`);
      }
      if (c.specs?.ispSeconds !== undefined && c.id === extremes.maxIspComp?.id && comparedComponents.length > 1) {
        pros.push(`Peak fuel efficiency (${c.specs.ispSeconds} s Isp)`);
      }
      if (c.specs?.dataRateKbps !== undefined && c.id === extremes.maxDataRateComp?.id && comparedComponents.length > 1) {
        const mbps = (c.specs.dataRateKbps / 1000).toFixed(0);
        pros.push(`Highest downlink bandwidth (${mbps} Mbps)`);
      }
      if (c.specs?.energyStorageWh !== undefined) {
        pros.push(`Includes ${c.specs.energyStorageWh} Wh eclipse storage`);
      }
      if (c.specs?.heatRejectionWatts !== undefined) {
        pros.push(`Rejects up to ${c.specs.heatRejectionWatts} W thermal load`);
      }

      map.set(c.id, { pros, cons });
    }

    return map;
  }, [comparedComponents, extremes]);

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.categoryIcon} aria-hidden="true">
              {CATEGORY_ICONS[category] ?? "⚙️"}
            </span>
            <div>
              <h2 className={styles.headerTitle}>
                {category.toUpperCase()} Component Comparison
              </h2>
              <p className={styles.headerSubtitle}>
                Side-by-side engineering trade-offs and specification differential analysis
              </p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button
              className={styles.closeButton}
              onClick={onClose}
              type="button"
              aria-label="Close comparison dialog"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter chips to toggle components in this category */}
        <div className={styles.chipsBar}>
          <span className={styles.chipsLabel}>Compare In Category:</span>
          {availableComponents.map((c) => {
            const isSelected = comparedIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`${styles.chip} ${isSelected ? styles.chipSelected : ""}`}
                onClick={() => onToggleComparedId(c.id)}
                aria-pressed={isSelected}
              >
                <span>{isSelected ? "✓" : "+"}</span>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Engineering Narrative Trade-off Card */}
          <div className={styles.tradeoffCard}>
            <div className={styles.tradeoffHeader}>
              <span>⚖️ Aerospace Trade-off Analysis</span>
            </div>
            <p className={styles.tradeoffText}>
              {CATEGORY_TRADEOFF_NARRATIVES[category]}
            </p>
          </div>

          {/* Side-by-Side Comparison Matrix Table */}
          {comparedComponents.length === 0 ? (
            <p style={{ color: "#7a9cc2", textAlign: "center", padding: "32px 0" }}>
              Please select at least one component above to compare.
            </p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.labelCell}>Component</th>
                    {comparedComponents.map((comp) => {
                      const isAdded = addedIds.has(comp.id);
                      return (
                        <th key={comp.id} className={styles.componentHeaderCell}>
                          <div className={styles.compHeaderTop}>
                            <div className={styles.compName}>{comp.name}</div>
                            {isAdded ? (
                              <span className={styles.statusTagAdded}>✓ In Design</span>
                            ) : (
                              <span className={styles.statusTagNotAdded}>Not in Design</span>
                            )}
                          </div>
                          {isAdded ? (
                            <button
                              type="button"
                              className={`${styles.headerActionBtn} ${styles.removeBtn}`}
                              onClick={() => onRemove(comp.id)}
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={`${styles.headerActionBtn} ${styles.addBtn}`}
                              onClick={() => onAdd(comp.id)}
                            >
                              + Add to Design
                            </button>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Mass Row */}
                  <tr>
                    <td className={styles.labelCell}>Mass (kg)</td>
                    {comparedComponents.map((comp) => {
                      const isMin = comp.id === extremes?.minMassComp.id && comparedComponents.length > 1;
                      const diff = extremes ? (comp.massKg - extremes.minMassComp.massKg).toFixed(1) : "0";
                      return (
                        <td key={comp.id} className={styles.valCell}>
                          <div className={styles.primaryValue}>
                            {comp.massKg} <span className={styles.unit}>kg</span>
                          </div>
                          {isMin ? (
                            <div className={styles.badgeBest}>🏆 Lightest</div>
                          ) : comparedComponents.length > 1 ? (
                            <div className={styles.badgeDiffWarn}>+{diff} kg</div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Power Row */}
                  <tr>
                    <td className={styles.labelCell}>Power (W)</td>
                    {comparedComponents.map((comp) => {
                      const isMostGen = comp.powerWatts < 0 && comp.id === extremes?.mostPowerGenComp?.id;
                      const isLeastDraw = comp.powerWatts > 0 && comp.id === extremes?.leastPowerDrawComp?.id && comparedComponents.length > 1;
                      return (
                        <td key={comp.id} className={styles.valCell}>
                          <div className={styles.primaryValue}>
                            {formatPower(comp.powerWatts)}
                          </div>
                          {isMostGen ? (
                            <div className={styles.badgeBest}>🏆 Max Generation</div>
                          ) : isLeastDraw ? (
                            <div className={styles.badgeBest}>⚡ Lowest Draw</div>
                          ) : comp.powerWatts > 50 ? (
                            <div className={styles.badgeDiffWarn}>⚠️ High Power Draw</div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Cost Row */}
                  <tr>
                    <td className={styles.labelCell}>Cost (Credits)</td>
                    {comparedComponents.map((comp) => {
                      const isMin = comp.id === extremes?.minCostComp.id && comparedComponents.length > 1;
                      const diff = extremes ? formatCost(comp.costCredits - extremes.minCostComp.costCredits) : "0";
                      return (
                        <td key={comp.id} className={styles.valCell}>
                          <div className={styles.primaryValue}>
                            {formatCost(comp.costCredits)}
                          </div>
                          {isMin ? (
                            <div className={styles.badgeBest}>🏆 Lowest Cost</div>
                          ) : comparedComponents.length > 1 ? (
                            <div className={styles.badgeDiffWarn}>+{diff}</div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Thermal Dissipation */}
                  <tr>
                    <td className={styles.labelCell}>Thermal (W)</td>
                    {comparedComponents.map((comp) => (
                      <td key={comp.id} className={styles.valCell}>
                        <div className={styles.primaryValue}>
                          {comp.thermalWatts < 0
                            ? `${Math.abs(comp.thermalWatts)} W rejected`
                            : `${comp.thermalWatts} W dissipated`}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Subsystem Specifications */}
                  <tr>
                    <td className={styles.labelCell}>Key Specs</td>
                    {comparedComponents.map((comp) => {
                      const specs = comp.specs;
                      if (!specs) {
                        return (
                          <td key={comp.id} className={styles.valCell}>
                            <span style={{ color: "#4f7296" }}>Standard Subsystem</span>
                          </td>
                        );
                      }
                      return (
                        <td key={comp.id} className={styles.valCell}>
                          {specs.thrustN !== undefined && (
                            <div style={{ marginBottom: "6px" }}>
                              <strong>Thrust:</strong> {specs.thrustN} N
                              {comp.id === extremes?.maxThrustComp?.id && comparedComponents.length > 1 && (
                                <span className={styles.badgeBest} style={{ marginLeft: "6px" }}>
                                  Highest
                                </span>
                              )}
                            </div>
                          )}
                          {specs.ispSeconds !== undefined && (
                            <div style={{ marginBottom: "6px" }}>
                              <strong>Isp:</strong> {specs.ispSeconds} s
                              {comp.id === extremes?.maxIspComp?.id && comparedComponents.length > 1 && (
                                <span className={styles.badgeBest} style={{ marginLeft: "6px" }}>
                                  Max Isp
                                </span>
                              )}
                            </div>
                          )}
                          {specs.dataRateKbps !== undefined && (
                            <div style={{ marginBottom: "6px" }}>
                              <strong>Bandwidth:</strong>{" "}
                              {specs.dataRateKbps >= 1000
                                ? `${(specs.dataRateKbps / 1000).toFixed(0)} Mbps`
                                : `${specs.dataRateKbps} kbps`}
                              {comp.id === extremes?.maxDataRateComp?.id && comparedComponents.length > 1 && (
                                <span className={styles.badgeBest} style={{ marginLeft: "6px" }}>
                                  Max Bandwidth
                                </span>
                              )}
                            </div>
                          )}
                          {specs.energyStorageWh !== undefined && (
                            <div style={{ marginBottom: "6px" }}>
                              <strong>Storage:</strong> {specs.energyStorageWh} Wh
                            </div>
                          )}
                          {specs.heatRejectionWatts !== undefined && (
                            <div style={{ marginBottom: "6px" }}>
                              <strong>Heat Rejection:</strong> {specs.heatRejectionWatts} W
                            </div>
                          )}
                          {specs.formFactor !== undefined && (
                            <div style={{ marginBottom: "6px" }}>
                              <strong>Form Factor:</strong> {specs.formFactor}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Component Pros / Cons Key Highlights */}
          {comparedComponents.length > 1 && (
            <div>
              <p
                style={{
                  fontSize: "0.75rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#608bb8",
                  margin: "0 0 12px",
                  fontWeight: 700,
                }}
              >
                Comparative Advantages & Constraints
              </p>
              <div className={styles.summaryGrid}>
                {comparedComponents.map((comp) => {
                  const data = prosAndCons.get(comp.id);
                  if (!data) return null;
                  return (
                    <div key={comp.id} className={styles.summaryCol}>
                      <h4 className={styles.summaryCompName}>{comp.name}</h4>
                      {data.pros.length > 0 && (
                        <div>
                          <ul className={styles.summaryList}>
                            {data.pros.map((p, idx) => (
                              <li key={idx} className={styles.summaryItemPro}>
                                <span className={styles.bulletPro}>+</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {data.cons.length > 0 && (
                        <div>
                          <ul className={styles.summaryList}>
                            {data.cons.map((c, idx) => (
                              <li key={idx} className={styles.summaryItemCon}>
                                <span className={styles.bulletCon}>-</span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
