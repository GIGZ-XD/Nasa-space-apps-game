import type { Component } from "./component.types";
import styles from "./ComponentCatalogue.module.css";

/** Emoji icon per category — no extra assets needed */
const CATEGORY_ICONS: Record<string, string> = {
  structure:      "🛰️",
  power:          "⚡",
  propulsion:     "🔥",
  thermal:        "🌡️",
  communications: "📡",
  avionics:       "🖥️",
  payload:        "🔭",
};

function formatPower(watts: number): { label: string; className: string } {
  if (watts < 0)
    return { label: `+${Math.abs(watts).toFixed(0)} W gen`, className: styles.statValueGen };
  if (watts === 0)
    return { label: "0 W", className: styles.statValue };
  return { label: `${watts.toFixed(1)} W`, className: styles.statValue };
}

function formatCost(credits: number): string {
  if (credits >= 1000) return `${(credits / 1000).toFixed(0)}k ¢`;
  return `${credits} ¢`;
}

interface ComponentCardProps {
  component: Component;
  /** True when this componentId is already in the design */
  isAdded: boolean;
  /** instanceId of the highlighted instance, if this component is the one highlighted */
  isHighlighted: boolean;
  /** True when the detail panel is open for this component */
  isDetailOpen: boolean;
  /** True when this component is marked for side-by-side comparison */
  isCompared?: boolean;
  onAdd: (componentId: string) => void;
  onRemove: (componentId: string) => void;
  onHighlight: (componentId: string) => void;
  /** Opens the full detail panel for this component */
  onOpenDetail: (componentId: string) => void;
  /** Toggles comparison selection for this component */
  onToggleCompare?: (componentId: string) => void;
}

export function ComponentCard({
  component,
  isAdded,
  isHighlighted,
  isDetailOpen,
  isCompared = false,
  onAdd,
  onRemove,
  onHighlight,
  onOpenDetail,
  onToggleCompare,
}: ComponentCardProps) {
  const { label: powerLabel, className: powerClass } = formatPower(component.powerWatts);

  const cardClass = [
    styles.card,
    isAdded ? styles.cardAdded : "",
    isHighlighted ? styles.cardHighlighted : "",
    isDetailOpen ? styles.cardDetailOpen : "",
    isCompared ? styles.cardCompared : "",
  ]
    .filter(Boolean)
    .join(" ");

  function handleCardClick() {
    onOpenDetail(component.id);
    if (isAdded) {
      onHighlight(component.id);
    }
  }

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    onAdd(component.id);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    onRemove(component.id);
  }

  function handleToggleCompare(e: React.MouseEvent) {
    e.stopPropagation();
    if (onToggleCompare) {
      onToggleCompare(component.id);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  }

  return (
    <article
      className={cardClass}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${component.name}, ${component.category} subsystem, ${isAdded ? "currently added to design" : "not added"}`}
      aria-pressed={isAdded}
      aria-expanded={isDetailOpen}
    >
      {/* Badge row: icon + category tag + compare button */}
      <div className={styles.cardBadge}>
        <div className={styles.badgeLeft}>
          <span className={styles.categoryIcon} aria-hidden="true">
            {CATEGORY_ICONS[component.category] ?? "🔩"}
          </span>
          <span className={styles.categoryTag}>{component.category}</span>
        </div>
        {onToggleCompare && (
          <button
            type="button"
            className={`${styles.compareToggleBtn} ${isCompared ? styles.compareToggleBtnActive : ""}`}
            onClick={handleToggleCompare}
            title={isCompared ? "Remove from comparison" : "Compare with other category components"}
            aria-pressed={isCompared}
          >
            {isCompared ? "✓ Compared" : "⚖️ Compare"}
          </button>
        )}
      </div>

      {/* Name */}
      <p className={styles.cardName}>{component.name}</p>

      {/* Description */}
      <p className={styles.cardDesc}>{component.description}</p>

      {/* Stats with Educational Tooltips */}
      <div className={styles.cardStats}>
        <div className={styles.stat} title="Component dry mass in kilograms (affects launcher payload limits and delta-V)">
          <span className={styles.statLabel}>Mass</span>
          <span className={styles.statValue}>{component.massKg} kg</span>
        </div>
        <div className={styles.stat} title="Net electrical power: positive (+) indicates consumption, negative (-) indicates solar generation">
          <span className={styles.statLabel}>Power</span>
          <span className={powerClass}>{powerLabel}</span>
        </div>
        <div className={styles.stat} title="Procurement and flight-qualification cost in mission credits">
          <span className={styles.statLabel}>Cost</span>
          <span className={styles.statValueCost}>{formatCost(component.costCredits)}</span>
        </div>
        {component.specs?.thrustN !== undefined && (
          <div className={styles.stat} title="Thrust force delivered in Newtons: higher thrust allows shorter, high-impulse maneuvers">
            <span className={styles.statLabel}>Thrust</span>
            <span className={styles.statValue}>{component.specs.thrustN} N</span>
          </div>
        )}
        {component.specs?.ispSeconds !== undefined && (
          <div className={styles.stat} title="Specific Impulse in seconds: measures propellant mass efficiency. Higher Isp = less fuel needed for orbital maneuvers">
            <span className={styles.statLabel}>Isp</span>
            <span className={styles.statValue}>{component.specs.ispSeconds} s</span>
          </div>
        )}
        {component.specs?.dataRateKbps !== undefined && (
          <div className={styles.stat} title="Downlink communication bandwidth: data rate for telemetry transmission and scientific payload downlink">
            <span className={styles.statLabel}>Data rate</span>
            <span className={styles.statValue}>
              {component.specs.dataRateKbps >= 1000
                ? `${(component.specs.dataRateKbps / 1000).toFixed(0)} Mbps`
                : `${component.specs.dataRateKbps} kbps`}
            </span>
          </div>
        )}
        {component.specs?.energyStorageWh !== undefined && (
          <div className={styles.stat} title="Battery capacity in Watt-hours: stores electrical energy to sustain power during planetary eclipse shadow periods">
            <span className={styles.statLabel}>Storage</span>
            <span className={styles.statValue}>{component.specs.energyStorageWh} Wh</span>
          </div>
        )}
      </div>

      {/* Footer: action button */}
      <div className={styles.cardFooter}>
        {isAdded ? (
          <>
            <span className={styles.addedBadge}>✓ Added</span>
            <button
              className={styles.removeBtn}
              onClick={handleRemove}
              aria-label={`Remove ${component.name}`}
              type="button"
            >
              Remove
            </button>
          </>
        ) : (
          <button
            className={styles.addBtn}
            onClick={handleAdd}
            aria-label={`Add ${component.name}`}
            type="button"
          >
            + Add to Design
          </button>
        )}
      </div>
    </article>
  );
}
