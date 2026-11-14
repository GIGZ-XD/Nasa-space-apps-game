import React from "react";
import type { PowerBudget } from "./resource.types";
import styles from "./ResourceDashboard.module.css";

interface PowerBudgetPanelProps {
  power: PowerBudget;
}

export function PowerBudgetPanel({ power }: PowerBudgetPanelProps) {
  const {
    totalGenerationWatts,
    totalConsumptionWatts,
    netPowerWatts,
    totalBatteryCapacityWh,
    hasBattery,
    status,
    statusMessage,
    marginPercent,
    categoryBreakdown,
  } = power;

  const isDeficit = status === "DEFICIT" || status === "NO_GENERATION";
  const isMarginal = status === "MARGINAL";

  const powerRatio =
    totalGenerationWatts > 0
      ? Math.min(100, Math.round((totalConsumptionWatts / totalGenerationWatts) * 100))
      : 0;

  return (
    <div className={styles.resourceCard} aria-labelledby="power-budget-heading">
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <span className={styles.cardIcon}>⚡</span>
          <div>
            <h2 id="power-budget-heading" className={styles.cardTitle}>
              Power Budget
            </h2>
            <span className={styles.cardSubtitle}>
              Solar Array Generation vs Subsystem Continuous Load
            </span>
          </div>
        </div>

        <span
          className={`${styles.statusBadge} ${
            status === "SURPLUS"
              ? styles.statusSuccess
              : status === "MARGINAL"
              ? styles.statusWarning
              : styles.statusDanger
          }`}
        >
          {status === "SURPLUS" && "✓ Positive Balance"}
          {status === "MARGINAL" && "⚠️ Marginal Reserve"}
          {status === "DEFICIT" && "🚨 Power Deficit"}
          {status === "NO_GENERATION" && "🚨 No Generation"}
        </span>
      </div>

      {/* Primary Key Figures */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Daylight Generation</span>
          <span className={`${styles.metricValue} ${styles.textSuccess}`}>
            +{totalGenerationWatts.toFixed(1)}{" "}
            <span className={styles.metricUnit}>W</span>
          </span>
          <span className={styles.metricHint}>Solar array output at 1 AU</span>
        </div>

        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Peak Consumption</span>
          <span className={styles.metricValue}>
            {totalConsumptionWatts.toFixed(1)}{" "}
            <span className={styles.metricUnit}>W</span>
          </span>
          <span className={styles.metricHint}>Continuous load of all systems</span>
        </div>

        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Net Power Balance</span>
          <span
            className={`${styles.metricValue} ${
              isDeficit
                ? styles.textDanger
                : isMarginal
                ? styles.textWarning
                : styles.textSuccess
            }`}
          >
            {netPowerWatts >= 0 ? "+" : ""}
            {netPowerWatts.toFixed(1)}{" "}
            <span className={styles.metricUnit}>W</span>
          </span>
          <span className={styles.metricHint}>
            {marginPercent !== null
              ? `${marginPercent >= 0 ? "+" : ""}${marginPercent}% generation margin`
              : "No generation installed"}
          </span>
        </div>

        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Battery Reserve</span>
          <span
            className={`${styles.metricValue} ${
              hasBattery ? styles.textCyan : styles.textWarning
            }`}
          >
            {totalBatteryCapacityWh.toFixed(0)}{" "}
            <span className={styles.metricUnit}>Wh</span>
          </span>
          <span className={styles.metricHint}>
            {hasBattery ? "Eclipse energy storage" : "No battery installed"}
          </span>
        </div>
      </div>

      {/* Power Balance Bar */}
      {totalGenerationWatts > 0 ? (
        <div className={styles.capacitySection}>
          <div className={styles.capacityLabelRow}>
            <span>Daylight Power Draw</span>
            <span className={isDeficit ? styles.textDanger : undefined}>
              {powerRatio}% load ({totalConsumptionWatts} W of {totalGenerationWatts} W)
            </span>
          </div>
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuenow={powerRatio}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Power load ratio"
          >
            <div
              className={`${styles.progressFill} ${
                isDeficit
                  ? styles.fillDanger
                  : isMarginal
                  ? styles.fillWarning
                  : styles.fillSuccess
              }`}
              style={{ width: `${Math.min(100, powerRatio)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className={styles.calloutDanger}>
          <strong>No Solar Arrays Installed:</strong> Active electronics draw {totalConsumptionWatts} W. Mount a Deployable Articulated Solar Array (100W) or Body-Mounted Panels (24W).
        </div>
      )}

      {/* Battery Technical Callout */}
      {!hasBattery && totalConsumptionWatts > 0 ? (
        <div className={styles.calloutWarning}>
          <strong>No Eclipse Energy Storage:</strong> Without a Li-Ion Space Battery Pack, the spacecraft will suffer complete power loss during eclipse (orbital shadow) phases.
        </div>
      ) : hasBattery ? (
        <div className={styles.calloutInfo}>
          <strong>Battery Storage Clarification:</strong> Battery capacity ({totalBatteryCapacityWh} Wh) provides energy reserve during orbital eclipse passes. It does <em>not</em> count as continuous daylight generation.
        </div>
      ) : null}

      {/* Status Explanation */}
      <p className={styles.statusDescription}>{statusMessage}</p>

      {/* Subsystem Category Power Breakdown */}
      <div className={styles.breakdownSection}>
        <div className={styles.breakdownHeader}>
          <span className={styles.sectionSubtitle}>Subsystem Power Consumption / Generation</span>
          <span className={styles.metricHint}>Daylight Continuous (W)</span>
        </div>

        <div className={styles.categoryBars}>
          {categoryBreakdown.map((cat) => {
            const hasActivity = cat.generationWatts > 0 || cat.consumptionWatts > 0;
            if (!hasActivity) return null;

            return (
              <div key={cat.category} className={styles.categoryRow}>
                <div className={styles.categoryInfo}>
                  <span className={styles.categoryName}>
                    {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                  </span>
                  <span className={styles.categoryValues}>
                    {cat.generationWatts > 0 && (
                      <span className={styles.textSuccess}>
                        +{cat.generationWatts} W gen{" "}
                      </span>
                    )}
                    {cat.consumptionWatts > 0 && (
                      <span>-{cat.consumptionWatts} W draw</span>
                    )}
                  </span>
                </div>
                <div className={styles.miniBar}>
                  <div
                    className={`${styles.miniBarFill} ${
                      cat.generationWatts > 0 ? styles.miniFillSuccess : styles.miniFillWarning
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        totalGenerationWatts > 0
                          ? ((cat.generationWatts || cat.consumptionWatts) / totalGenerationWatts) * 100
                          : 50,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
