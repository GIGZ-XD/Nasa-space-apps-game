import type { Component, ComponentCategory } from "./component.types";
import styles from "./ComponentDetailPanel.module.css";

/** Emoji icon per category */
const CATEGORY_ICONS: Record<string, string> = {
  structure:      "🛰️",
  power:          "⚡",
  propulsion:     "🔥",
  thermal:        "🌡️",
  communications: "📡",
  avionics:       "🖥️",
  payload:        "🔭",
};

/**
 * Short prose explanation of each category's spacecraft role.
 * Helps users understand WHY they need this subsystem.
 */
const CATEGORY_ROLES: Record<string, string> = {
  structure:
    "The structural bus is the physical skeleton of the spacecraft. It hosts all other subsystems, provides mechanical integrity during launch loads, and defines the available mounting volume and mass budget.",
  power:
    "The power subsystem generates, stores, and distributes electrical energy. Solar panels harvest sunlight; batteries sustain operations during eclipse. All other subsystems draw from this budget.",
  propulsion:
    "Propulsion provides thrust for orbital insertion, station-keeping, attitude control, or deep-space maneuvers. Propellant mass and specific impulse (Isp) determine how much velocity change (ΔV) is available.",
  thermal:
    "The thermal subsystem maintains all components within their survival and operating temperature ranges. Passive solutions (MLI blankets, coatings) work without power; active radiators manage high heat loads.",
  communications:
    "The communications subsystem transmits telemetry to ground stations and receives commands. Data rate, frequency band, and antenna gain determine link margin and downlink capacity.",
  avionics:
    "Avionics encompasses the on-board computer (OBC) for command and data handling, plus the attitude determination and control system (ADCS) for precise pointing. Required on every spacecraft.",
  payload:
    "The mission payload is the instrument that fulfils the science or application objective — imaging, sensing, radar, or other. It is the reason the spacecraft exists; all other subsystems exist to support it.",
};

function formatPower(watts: number): { label: string; sign: "consume" | "generate" | "neutral" } {
  if (watts < 0) return { label: `${Math.abs(watts).toFixed(1)} W generated`, sign: "generate" };
  if (watts === 0) return { label: "0 W (passive)", sign: "neutral" };
  return { label: `${watts.toFixed(1)} W consumed`, sign: "consume" };
}

function formatCost(credits: number): string {
  if (credits >= 1_000_000) return `${(credits / 1_000_000).toFixed(2)}M ¢`;
  if (credits >= 1000) return `${(credits / 1000).toFixed(0)}k ¢`;
  return `${credits} ¢`;
}

function formatDataRate(kbps: number): string {
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(0)} Mbps`;
  return `${kbps} kbps`;
}

interface Stat {
  label: string;
  value: string;
  note?: string;
  variant?: "default" | "gen" | "cost" | "warn";
}

function buildSpecRows(component: Component): Stat[] {
  const rows: Stat[] = [];
  const { specs } = component;
  if (!specs) return rows;

  if (specs.thrustN !== undefined) {
    rows.push({
      label: "Thrust",
      value: `${specs.thrustN} N`,
      note: specs.thrustN < 1 ? "Micro-Newton class — electric propulsion" : undefined,
    });
  }
  if (specs.ispSeconds !== undefined) {
    rows.push({
      label: "Specific Impulse (Isp)",
      value: `${specs.ispSeconds} s`,
      note:
        specs.ispSeconds > 1000
          ? "High Isp — efficient for long-duration cruise maneuvers"
          : specs.ispSeconds > 200
          ? "Medium Isp — suitable for orbital insertion"
          : "Low Isp — simple, reliable cold gas propulsion",
    });
  }
  if (specs.dataRateKbps !== undefined) {
    rows.push({
      label: "Data Rate",
      value: formatDataRate(specs.dataRateKbps),
      note:
        specs.dataRateKbps >= 10_000
          ? "High-bandwidth — suitable for large science data volumes"
          : specs.dataRateKbps >= 1000
          ? "Medium bandwidth — adequate for telemetry and imagery"
          : "Low bandwidth — TT&C housekeeping only",
    });
  }
  if (specs.energyStorageWh !== undefined) {
    rows.push({
      label: "Energy Storage",
      value: `${specs.energyStorageWh} Wh`,
      note: "Available during eclipse periods",
    });
  }
  if (specs.heatRejectionWatts !== undefined) {
    rows.push({
      label: "Heat Rejection Capacity",
      value: `${specs.heatRejectionWatts} W`,
      note: "Maximum thermal load this component can reject",
    });
  }
  if (specs.formFactor !== undefined) {
    rows.push({
      label: "Form Factor / Interface",
      value: specs.formFactor,
    });
  }
  return rows;
}

interface ComponentDetailPanelProps {
  component: Component;
  isAdded: boolean;
  onAdd: (componentId: string) => void;
  onRemove: (componentId: string) => void;
  onClose: () => void;
  onCompareCategory?: (category: ComponentCategory, componentId: string) => void;
}

export function ComponentDetailPanel({
  component,
  isAdded,
  onAdd,
  onRemove,
  onClose,
  onCompareCategory,
}: ComponentDetailPanelProps) {
  const { label: powerLabel, sign: powerSign } = formatPower(component.powerWatts);
  const specRows = buildSpecRows(component);
  const categoryRole = CATEGORY_ROLES[component.category] ?? "";
  const icon = CATEGORY_ICONS[component.category] ?? "🔩";

  function handleAdd() {
    onAdd(component.id);
  }

  function handleRemove() {
    onRemove(component.id);
  }

  return (
    <aside className={styles.panel} aria-label={`Details: ${component.name}`}>
      {/* Close button */}
      <button
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Close details panel"
        type="button"
      >
        ✕
      </button>

      {/* ---- Header ---- */}
      <div className={styles.panelHeader}>
        <div className={styles.panelCategoryRow}>
          <span className={styles.panelIcon} aria-hidden="true">{icon}</span>
          <span className={styles.panelCategoryTag}>{component.category}</span>
        </div>
        <h2 className={styles.panelName}>{component.name}</h2>

        {/* Status badge */}
        {isAdded ? (
          <div className={styles.statusAdded}>
            <span className={styles.statusDot} />
            Added to design
          </div>
        ) : (
          <div className={styles.statusNotAdded}>
            <span className={styles.statusDot} />
            Not in design
          </div>
        )}
      </div>

      {/* ---- Scrollable body ---- */}
      <div className={styles.panelBody}>

        {/* Description */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Description</p>
          <p className={styles.description}>{component.description}</p>
        </section>

        {/* Subsystem role explanation */}
        {categoryRole && (
          <section className={styles.section}>
            <p className={styles.sectionLabel}>Subsystem Role</p>
            <p className={styles.roleText}>{categoryRole}</p>
          </section>
        )}

        {/* Core resource specs */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Core Properties</p>
          <div className={styles.statGrid}>
            {/* Mass */}
            <div className={styles.statBlock}>
              <span className={styles.statBlockLabel}>Mass</span>
              <span className={styles.statBlockValue}>{component.massKg} <span className={styles.unit}>kg</span></span>
            </div>

            {/* Power */}
            <div className={styles.statBlock}>
              <span className={styles.statBlockLabel}>Power</span>
              <span
                className={
                  powerSign === "generate"
                    ? styles.statBlockValueGen
                    : styles.statBlockValue
                }
              >
                {powerLabel}
              </span>
              {powerSign === "generate" && (
                <span className={styles.statBlockNote}>Positive net generation in sunlight</span>
              )}
            </div>

            {/* Thermal */}
            <div className={styles.statBlock}>
              <span className={styles.statBlockLabel}>Thermal dissipation</span>
              <span
                className={
                  component.thermalWatts < 0
                    ? styles.statBlockValueGen
                    : styles.statBlockValue
                }
              >
                {component.thermalWatts < 0
                  ? `${Math.abs(component.thermalWatts).toFixed(1)} W rejected`
                  : `${component.thermalWatts.toFixed(1)} W dissipated`}
              </span>
            </div>

            {/* Cost */}
            <div className={styles.statBlock}>
              <span className={styles.statBlockLabel}>Mission Cost</span>
              <span className={styles.statBlockValueCost}>
                {formatCost(component.costCredits)}
              </span>
              <span className={styles.statBlockNote}>In-game mission credits</span>
            </div>
          </div>
        </section>

        {/* Technical specifications */}
        {specRows.length > 0 && (
          <section className={styles.section}>
            <p className={styles.sectionLabel}>Technical Specifications</p>
            <div className={styles.specTable}>
              {specRows.map((row) => (
                <div key={row.label} className={styles.specRow}>
                  <div className={styles.specLabel}>{row.label}</div>
                  <div>
                    <div className={styles.specValue}>{row.value}</div>
                    {row.note && <div className={styles.specNote}>{row.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ---- Sticky action footer ---- */}
      <div className={styles.panelFooter}>
        {onCompareCategory && (
          <button
            className={styles.footerCompareBtn}
            onClick={() => onCompareCategory(component.category, component.id)}
            type="button"
          >
            ⚖️ Compare in {component.category}
          </button>
        )}
        {isAdded ? (
          <button
            className={styles.footerRemoveBtn}
            onClick={handleRemove}
            type="button"
          >
            Remove from Design
          </button>
        ) : (
          <button
            className={styles.footerAddBtn}
            onClick={handleAdd}
            type="button"
          >
            + Add to Design
          </button>
        )}
      </div>
    </aside>
  );
}
