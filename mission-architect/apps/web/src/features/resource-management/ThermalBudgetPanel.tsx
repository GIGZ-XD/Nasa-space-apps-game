import React from "react";
import type { ThermalBudget } from "./resource.types";
import styles from "./ResourceDashboard.module.css";

interface ThermalBudgetPanelProps {
  thermal: ThermalBudget;
}

export function ThermalBudgetPanel({ thermal }: ThermalBudgetPanelProps) {
  const {
    totalHeatLoadWatts,
    totalHeatRejectionWatts,
    activeHeatRejectionCapacityWatts,
    thermalMarginWatts,
    status,
    statusMessage,
    marginPercent,
    bottlenecks,
  } = thermal;

  const isOverheat = status === "OVERHEAT_DEFICIT" || status === "NO_COOLING";
  const isMarginal = status === "MARGINAL";

  const loadRatio =
    totalHeatRejectionWatts > 0
      ? Math.min(100, Math.round((totalHeatLoadWatts / totalHeatRejectionWatts) * 100))
      : 0;

  return (
    <div className={styles.resourceCard} aria-labelledby="thermal-budget-heading">
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <span className={styles.cardIcon}>❄️</span>
          <div>
            <h2 id="thermal-budget-heading" className={styles.cardTitle}>
              Thermal Budget
            </h2>
            <span className={styles.cardSubtitle}>
              Internal Heat Load vs Radiative Rejection Capacity
            </span>
          </div>
        </div>

        <span
          className={`${styles.statusBadge} ${
            status === "NOMINAL"
              ? styles.statusSuccess
              : status === "MARGINAL"
              ? styles.statusWarning
              : styles.statusDanger
          }`}
        >
          {status === "NOMINAL" && "✓ Balanced"}
          {status === "MARGINAL" && "⚠️ Marginal Buffer"}
          {status === "OVERHEAT_DEFICIT" && "🚨 Thermal Overload"}
          {status === "NO_COOLING" && "🚨 No Cooling"}
        </span>
      </div>

      {/* Primary Key Figures */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Internal Heat Load</span>
          <span className={styles.metricValue}>
            {totalHeatLoadWatts.toFixed(1)}{" "}
            <span className={styles.metricUnit}>W</span>
          </span>
          <span className={styles.metricHint}>Active component heat dissipation</span>
        </div>

        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Rejection Capacity</span>
          <span className={`${styles.metricValue} ${styles.textCyan}`}>
            {totalHeatRejectionWatts.toFixed(1)}{" "}
            <span className={styles.metricUnit}>W</span>
          </span>
          <span className={styles.metricHint}>
            Active radiators ({activeHeatRejectionCapacityWatts} W) + MLI
          </span>
        </div>

        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Thermal Margin</span>
          <span
            className={`${styles.metricValue} ${
              isOverheat
                ? styles.textDanger
                : isMarginal
                ? styles.textWarning
                : styles.textSuccess
            }`}
          >
            {thermalMarginWatts >= 0 ? "+" : ""}
            {thermalMarginWatts.toFixed(1)}{" "}
            <span className={styles.metricUnit}>W</span>
          </span>
          <span className={styles.metricHint}>
            {marginPercent !== null
              ? `${marginPercent >= 0 ? "+" : ""}${marginPercent}% cooling buffer`
              : "No cooling capacity"}
          </span>
        </div>
      </div>

      {/* Thermal Ratio Bar */}
      {totalHeatRejectionWatts > 0 ? (
        <div className={styles.capacitySection}>
          <div className={styles.capacityLabelRow}>
            <span>Thermal Dissipation Load Ratio</span>
            <span className={isOverheat ? styles.textDanger : undefined}>
              {loadRatio}% capacity ({totalHeatLoadWatts} W / {totalHeatRejectionWatts} W)
            </span>
          </div>
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuenow={loadRatio}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Thermal dissipation load ratio"
          >
            <div
              className={`${styles.progressFill} ${
                isOverheat
                  ? styles.fillDanger
                  : isMarginal
                  ? styles.fillWarning
                  : styles.fillSuccess
              }`}
              style={{ width: `${Math.min(100, (totalHeatLoadWatts / totalHeatRejectionWatts) * 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className={styles.calloutDanger}>
          <strong>No Thermal Protection Installed:</strong> Subsystems dissipate {totalHeatLoadWatts} W of heat without radiative paths to deep space. Mount an Active Heat Pipe Radiator Panel (75W) or MLI Blanketing (10W).
        </div>
      )}

      {/* Status Explanation */}
      <p className={styles.statusDescription}>{statusMessage}</p>

      {/* Thermal Dissipation Drivers (Bottlenecks) */}
      <div className={styles.breakdownSection}>
        <div className={styles.breakdownHeader}>
          <span className={styles.sectionSubtitle}>Primary Heat Dissipation Drivers</span>
          <span className={styles.metricHint}>Components &ge; 5W Dissipation</span>
        </div>

        {bottlenecks.length === 0 ? (
          <p className={styles.emptyNotice}>
            No high-dissipation components installed. Thermal load is benign.
          </p>
        ) : (
          <div className={styles.bottleneckList}>
            {bottlenecks.map((item) => (
              <div key={item.id} className={styles.bottleneckItem}>
                <div className={styles.bottleneckInfo}>
                  <span className={styles.bottleneckName}>{item.name}</span>
                  <span className={styles.bottleneckCat}>{item.category}</span>
                </div>
                <span className={styles.bottleneckValue}>
                  {item.thermalWatts.toFixed(1)} W heat
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
