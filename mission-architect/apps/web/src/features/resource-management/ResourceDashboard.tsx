import React from "react";
import { useResourceBudget } from "./useResourceBudget";
import { MassBudgetPanel } from "./MassBudgetPanel";
import { PowerBudgetPanel } from "./PowerBudgetPanel";
import { ThermalBudgetPanel } from "./ThermalBudgetPanel";
import { EngineeringWarningsPanel } from "./EngineeringWarningsPanel";
import { useSpacecraftStore } from "../../stores/spacecraftStore";
import type { SpacecraftResourceReport } from "./resource.types";
import styles from "./ResourceDashboard.module.css";

interface ResourceDashboardProps {
  onSwitchToCatalogue?: () => void;
  report?: SpacecraftResourceReport;
}

export function ResourceDashboard({ onSwitchToCatalogue, report }: ResourceDashboardProps) {
  const storeReport = useResourceBudget();
  const resourceReport = report ?? storeReport;
  const design = useSpacecraftStore((s) => s.design);

  const { mass, power, thermal, warnings, feasibility } = resourceReport;

  const isFeasible = feasibility.status === "FEASIBLE";
  const isMarginal = feasibility.status === "MARGINAL";
  const isViolation = feasibility.status === "VIOLATION";
  const isIncomplete = feasibility.status === "INCOMPLETE";

  return (
    <div className={styles.dashboardContainer}>
      {/* Top Header & Navigation Bar */}
      <header className={styles.dashboardHeader}>
        <div className={styles.dashboardHeaderTop}>
          <div>
            <div className={styles.titleRow}>
              <h1 className={styles.mainTitle}>Resource Management & Engineering Budgets</h1>
              <span className={styles.spacecraftNameTag}>
                🛰️ {design.name || "Unnamed Spacecraft"}
              </span>
            </div>
            <p className={styles.mainSubtitle}>
              Live Multi-Subsystem Mass, Electrical Power & Thermal Dissipation Verification
            </p>
          </div>

          {onSwitchToCatalogue && (
            <button
              type="button"
              className={styles.navSwitchBtn}
              onClick={onSwitchToCatalogue}
              aria-label="Return to Component Catalogue"
            >
              🛰️ Return to Component Catalogue
            </button>
          )}
        </div>

        {/* Mission Feasibility Assessment Banner */}
        <div
          className={`${styles.feasibilityBanner} ${
            isFeasible
              ? styles.feasibilitySuccess
              : isMarginal
              ? styles.feasibilityWarning
              : isViolation
              ? styles.feasibilityDanger
              : styles.feasibilityInfo
          }`}
          role="region"
          aria-label="Mission Feasibility Summary"
        >
          <div className={styles.feasibilityHeaderRow}>
            <div className={styles.feasibilityTitleGroup}>
              <span className={styles.feasibilityIcon}>
                {isFeasible && "🚀"}
                {isMarginal && "⚠️"}
                {isViolation && "🚨"}
                {isIncomplete && "📋"}
              </span>
              <div>
                <div className={styles.feasibilityStatusLabel}>
                  {isFeasible && "MISSION FEASIBLE"}
                  {isMarginal && "MARGINAL FLIGHT READINESS"}
                  {isViolation && "MISSION DESIGN VIOLATION"}
                  {isIncomplete && "ARCHITECTURE INCOMPLETE"}
                </div>
                <div className={styles.feasibilitySummaryText}>
                  {feasibility.summary}
                </div>
              </div>
            </div>

            <div className={styles.feasibilityScoreWrapper}>
              <span className={styles.feasibilityScoreNumber}>
                {feasibility.scorePercentage}%
              </span>
              <span className={styles.feasibilityScoreLabel}>
                Engineering Feasibility Index
              </span>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className={styles.quickMetricsStrip}>
            <div className={styles.quickMetricPill}>
              <span className={styles.quickMetricPillLabel}>Mass Budget:</span>
              <span
                className={
                  mass.status === "EXCEEDED" || mass.status === "INCAPABLE_ORBIT"
                    ? styles.textDanger
                    : mass.status === "WARNING"
                    ? styles.textWarning
                    : styles.textSuccess
                }
              >
                {mass.totalMassKg} kg / {mass.applicableCapacityKg ? `${mass.applicableCapacityKg} kg` : "--"}
              </span>
            </div>

            <div className={styles.quickMetricPill}>
              <span className={styles.quickMetricPillLabel}>Net Power:</span>
              <span
                className={
                  power.status === "DEFICIT" || power.status === "NO_GENERATION"
                    ? styles.textDanger
                    : power.status === "MARGINAL"
                    ? styles.textWarning
                    : styles.textSuccess
                }
              >
                {power.netPowerWatts >= 0 ? "+" : ""}
                {power.netPowerWatts} W
              </span>
            </div>

            <div className={styles.quickMetricPill}>
              <span className={styles.quickMetricPillLabel}>Battery Storage:</span>
              <span className={power.hasBattery ? styles.textCyan : styles.textWarning}>
                {power.totalBatteryCapacityWh} Wh
              </span>
            </div>

            <div className={styles.quickMetricPill}>
              <span className={styles.quickMetricPillLabel}>Thermal Margin:</span>
              <span
                className={
                  thermal.status === "OVERHEAT_DEFICIT" || thermal.status === "NO_COOLING"
                    ? styles.textDanger
                    : thermal.status === "MARGINAL"
                    ? styles.textWarning
                    : styles.textSuccess
                }
              >
                {thermal.thermalMarginWatts >= 0 ? "+" : ""}
                {thermal.thermalMarginWatts} W
              </span>
            </div>

            <div className={styles.quickMetricPill}>
              <span className={styles.quickMetricPillLabel}>Advisories:</span>
              <span>
                {warnings.filter((w) => w.severity === "CRITICAL").length} Critical ·{" "}
                {warnings.filter((w) => w.severity === "WARNING").length} Warn
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Budget Grid Layout */}
      <main className={styles.dashboardGrid}>
        {/* Left Column: The 3 Core Physical Budgets */}
        <section className={styles.budgetsColumn} aria-label="Physical Budgets">
          <MassBudgetPanel mass={mass} />
          <PowerBudgetPanel power={power} />
          <ThermalBudgetPanel thermal={thermal} />
        </section>

        {/* Right Column: Engineering Assessment, Advisories & Actions */}
        <aside className={styles.sidebarColumn} aria-label="Engineering Advisories">
          <EngineeringWarningsPanel warnings={warnings} />
        </aside>
      </main>
    </div>
  );
}
