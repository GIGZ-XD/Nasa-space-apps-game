import React, { useState } from "react";
import type { MassBudget } from "./resource.types";
import styles from "./ResourceDashboard.module.css";

interface MassBudgetPanelProps {
  mass: MassBudget;
}

export function MassBudgetPanel({ mass }: MassBudgetPanelProps) {
  const [showComponentList, setShowComponentList] = useState(false);

  const {
    totalMassKg,
    applicableCapacityKg,
    remainingCapacityKg,
    marginPercent,
    status,
    statusMessage,
    launcher,
    orbit,
    categoryBreakdown,
    componentBreakdown,
    isProvisionalOrbitCapacity,
  } = mass;

  const usagePercent =
    applicableCapacityKg && applicableCapacityKg > 0
      ? Math.min(100, Math.round((totalMassKg / applicableCapacityKg) * 100))
      : 0;

  const isOverweight = status === "EXCEEDED" || (remainingCapacityKg !== null && remainingCapacityKg < 0);
  const isTight = status === "WARNING";
  const isIncapable = status === "INCAPABLE_ORBIT";

  return (
    <div className={styles.resourceCard} aria-labelledby="mass-budget-heading">
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <span className={styles.cardIcon}>⚖️</span>
          <div>
            <h2 id="mass-budget-heading" className={styles.cardTitle}>
              Mass Budget
            </h2>
            <span className={styles.cardSubtitle}>
              Structure, Payload & Subsystem Mass vs Launch Capacity
            </span>
          </div>
        </div>

        <span
          className={`${styles.statusBadge} ${
            status === "NOMINAL"
              ? styles.statusSuccess
              : status === "WARNING"
              ? styles.statusWarning
              : status === "NO_LAUNCHER"
              ? styles.statusInfo
              : styles.statusDanger
          }`}
        >
          {status === "NOMINAL" && "✓ Nominal"}
          {status === "WARNING" && "⚠️ Tight Margin"}
          {status === "EXCEEDED" && "🚨 Mass Exceeded"}
          {status === "INCAPABLE_ORBIT" && "🚨 0kg Capacity"}
          {status === "NO_LAUNCHER" && "ℹ️ Launcher Unset"}
        </span>
      </div>

      {/* Primary Key Figures */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Total Wet Mass</span>
          <span className={styles.metricValue}>
            {totalMassKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{" "}
            <span className={styles.metricUnit}>kg</span>
          </span>
          <span className={styles.metricHint}>Sum of all mounted components</span>
        </div>

        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Launcher Capacity</span>
          <span className={styles.metricValue}>
            {applicableCapacityKg !== null ? (
              <>
                {applicableCapacityKg.toLocaleString()}{" "}
                <span className={styles.metricUnit}>kg</span>
              </>
            ) : (
              <span className={styles.metricMuted}>Not Selected</span>
            )}
          </span>
          <span className={styles.metricHint}>
            {launcher ? launcher.name : "Choose a vehicle"}
            {orbit ? ` (${orbit.type})` : ""}
          </span>
        </div>

        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Remaining Margin</span>
          <span
            className={`${styles.metricValue} ${
              isOverweight || isIncapable
                ? styles.textDanger
                : isTight
                ? styles.textWarning
                : styles.textSuccess
            }`}
          >
            {remainingCapacityKg !== null ? (
              <>
                {remainingCapacityKg >= 0 ? "+" : ""}
                {remainingCapacityKg.toFixed(1)}{" "}
                <span className={styles.metricUnit}>kg</span>
              </>
            ) : (
              <span className={styles.metricMuted}>--</span>
            )}
          </span>
          <span className={styles.metricHint}>
            {marginPercent !== null
              ? `${marginPercent >= 0 ? "+" : ""}${marginPercent}% payload margin`
              : "Awaiting launcher"}
          </span>
        </div>
      </div>

      {/* Progress / Capacity Bar */}
      {applicableCapacityKg !== null && applicableCapacityKg > 0 ? (
        <div className={styles.capacitySection}>
          <div className={styles.capacityLabelRow}>
            <span>Payload Utilization</span>
            <span className={isOverweight ? styles.textDanger : undefined}>
              {usagePercent}% ({totalMassKg} / {applicableCapacityKg} kg)
            </span>
          </div>
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuenow={usagePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Launch mass capacity utilization"
          >
            <div
              className={`${styles.progressFill} ${
                isOverweight
                  ? styles.fillDanger
                  : isTight
                  ? styles.fillWarning
                  : styles.fillSuccess
              }`}
              style={{ width: `${Math.min(100, (totalMassKg / applicableCapacityKg) * 100)}%` }}
            />
          </div>
        </div>
      ) : isIncapable ? (
        <div className={styles.calloutDanger}>
          <strong>Trajectory Incompatible:</strong> {launcher?.name} has 0 kg rated payload capacity for {orbit?.name}. Choose a heavier launcher (Vega-C / Falcon 9) or change orbit.
        </div>
      ) : (
        <div className={styles.calloutInfo}>
          <strong>No Launcher Selected:</strong> Configure a launch vehicle in the design sidebar to evaluate payload mass limits.
        </div>
      )}

      {/* Provisional Orbit Capacity Warning */}
      {isProvisionalOrbitCapacity && (
        <div className={styles.calloutWarning}>
          <strong>Provisional Lunar Rating:</strong> The dataset does not provide an explicit translunar payload rating for {launcher?.name}. The vehicle&apos;s GTO rating ({applicableCapacityKg} kg) is displayed as a provisional proxy upper bound.
        </div>
      )}

      {/* Status Explanation */}
      <p className={styles.statusDescription}>{statusMessage}</p>

      {/* Subsystem Category Mass Breakdown */}
      <div className={styles.breakdownSection}>
        <div className={styles.breakdownHeader}>
          <span className={styles.sectionSubtitle}>Subsystem Mass Allocation</span>
          <span className={styles.metricHint}>Fraction of Total</span>
        </div>

        <div className={styles.categoryBars}>
          {categoryBreakdown.map((cat) => (
            <div key={cat.category} className={styles.categoryRow}>
              <div className={styles.categoryInfo}>
                <span className={styles.categoryName}>
                  {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                  {cat.componentCount > 0 && (
                    <span className={styles.catCount}> ({cat.componentCount})</span>
                  )}
                </span>
                <span className={styles.categoryValues}>
                  {cat.massKg.toFixed(1)} kg · {cat.percentage}%
                </span>
              </div>
              <div className={styles.miniBar}>
                <div
                  className={styles.miniBarFill}
                  style={{ width: `${Math.min(100, cat.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Component Mass Toggle */}
      <div className={styles.collapsibleWrapper}>
        <button
          type="button"
          className={styles.collapseToggle}
          onClick={() => setShowComponentList(!showComponentList)}
          aria-expanded={showComponentList}
        >
          <span>{showComponentList ? "▼ Hide Individual Component Masses" : "► View Individual Component Masses"} ({componentBreakdown.length})</span>
        </button>

        {showComponentList && (
          <div className={styles.componentTableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Subsystem</th>
                  <th style={{ textAlign: "right" }}>Mass (kg)</th>
                </tr>
              </thead>
              <tbody>
                {componentBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={styles.emptyTable}>
                      No components installed yet.
                    </td>
                  </tr>
                ) : (
                  componentBreakdown.map((item, idx) => (
                    <tr key={`${item.id}-${idx}`}>
                      <td className={styles.componentTableName}>{item.name}</td>
                      <td>
                        <span className={styles.tableCategoryBadge}>{item.category}</span>
                      </td>
                      <td style={{ textAlign: "right" }} className={styles.tableNumber}>
                        {item.massKg.toFixed(1)} kg
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
