import React, { useState } from "react";
import { ComponentCatalogue } from "../features/component-catalogue/ComponentCatalogue";
import { ResourceDashboard } from "../features/resource-management/ResourceDashboard";
import { useResourceBudget } from "../features/resource-management/useResourceBudget";
import styles from "./WorkshopPage.module.css";

export function WorkshopPage() {
  const [activeView, setActiveView] = useState<"builder" | "resources">("builder");
  const resourceReport = useResourceBudget();

  const { feasibility, warnings } = resourceReport;
  const criticalCount = warnings.filter((w) => w.severity === "CRITICAL").length;
  const warningCount = warnings.filter((w) => w.severity === "WARNING").length;

  return (
    <div className={styles.workshopShell}>
      {/* Top Navigation Bar */}
      <nav className={styles.topNav} aria-label="Workshop Mode Navigation">
        <div className={styles.navBrand}>
          <span className={styles.brandLogo} role="img" aria-label="Rocket">🚀</span>
          <span className={styles.brandText}>Mission Architect · Workshop</span>
        </div>

        <div className={styles.navTabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === "builder"}
            className={`${styles.navTab} ${activeView === "builder" ? styles.navTabActive : ""}`}
            onClick={() => setActiveView("builder")}
          >
            🛰️ Spacecraft Builder
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeView === "resources"}
            className={`${styles.navTab} ${activeView === "resources" ? styles.navTabActive : ""}`}
            onClick={() => setActiveView("resources")}
          >
            📊 Resource Management
            {feasibility.status === "FEASIBLE" && (
              <span className={styles.tabBadgeSuccess}>✓ Feasible</span>
            )}
            {feasibility.status === "MARGINAL" && (
              <span className={styles.tabBadgeWarning}>⚠️ Marginal</span>
            )}
            {feasibility.status === "VIOLATION" && (
              <span className={styles.tabBadgeDanger}>🚨 {criticalCount} Violations</span>
            )}
            {feasibility.status === "INCOMPLETE" && (
              <span className={styles.tabBadgeInfo}>📋 Incomplete</span>
            )}
          </button>
        </div>
      </nav>

      {/* Main View Display */}
      <div className={styles.viewContent}>
        {activeView === "builder" ? (
          <ComponentCatalogue onSwitchToResources={() => setActiveView("resources")} />
        ) : (
          <ResourceDashboard onSwitchToCatalogue={() => setActiveView("builder")} />
        )}
      </div>
    </div>
  );
}
