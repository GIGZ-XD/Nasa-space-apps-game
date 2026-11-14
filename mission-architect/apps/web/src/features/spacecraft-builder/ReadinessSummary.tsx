import React from "react";
import type { ComponentCategory } from "../component-catalogue/component.types";
import styles from "./ReadinessSummary.module.css";

export const REQUIRED_CATEGORIES: ComponentCategory[] = [
  "structure",
  "power",
  "communications",
  "avionics",
];

export type AssemblyReadinessStatus =
  | "INCOMPLETE"
  | "READY_FOR_REVIEW"
  | "READY_FOR_SUBMISSION";

export interface ReadinessSummaryProps {
  selectedComponentCount: number;
  presentCategories: Set<ComponentCategory>;
  orbitSelected: boolean;
  launcherSelected: boolean;
  engineeringFeasible?: boolean;
  hasCriticalViolations?: boolean;
  onSwitchToResources?: () => void;
}

export function ReadinessSummary({
  selectedComponentCount,
  presentCategories,
  orbitSelected,
  launcherSelected,
  engineeringFeasible = false,
  hasCriticalViolations = false,
  onSwitchToResources,
}: ReadinessSummaryProps) {
  const satisfiedCategories = REQUIRED_CATEGORIES.filter((c) => presentCategories.has(c));
  const missingCategories = REQUIRED_CATEGORIES.filter((c) => !presentCategories.has(c));

  const isAssemblyComplete =
    missingCategories.length === 0 && orbitSelected && launcherSelected;

  let status: AssemblyReadinessStatus = "INCOMPLETE";
  if (isAssemblyComplete) {
    if (engineeringFeasible && !hasCriticalViolations) {
      status = "READY_FOR_SUBMISSION";
    } else {
      status = "READY_FOR_REVIEW";
    }
  }

  // Derive actionable next steps
  const nextActions: string[] = [];
  if (missingCategories.length > 0) {
    nextActions.push(`Install missing core subsystems: ${missingCategories.join(", ")}.`);
  }
  if (!orbitSelected) {
    nextActions.push("Configure a target orbit in the Mission Parameters panel.");
  }
  if (!launcherSelected) {
    nextActions.push("Select a compatible launch vehicle to establish payload limits.");
  }
  if (isAssemblyComplete && hasCriticalViolations) {
    nextActions.push("Hardware mounted, but critical engineering violations detected. Review the Resource Dashboard to balance budgets.");
  }
  if (status === "READY_FOR_SUBMISSION") {
    nextActions.push("Spacecraft architecture satisfies all structural requirements and physics budgets. Ready for mission flight qualification!");
  }

  return (
    <div className={styles.summaryContainer} aria-labelledby="readiness-summary-heading">
      {/* Header */}
      <div className={styles.summaryHeader}>
        <div className={styles.titleGroup}>
          <span className={styles.titleIcon}>📋</span>
          <h2 id="readiness-summary-heading" className={styles.summaryTitle}>
            Assembly Readiness Summary
          </h2>
        </div>

        <span
          className={`${styles.statusBadge} ${
            status === "READY_FOR_SUBMISSION"
              ? styles.badgeSubmission
              : status === "READY_FOR_REVIEW"
              ? styles.badgeReview
              : styles.badgeIncomplete
          }`}
        >
          {status === "READY_FOR_SUBMISSION" && "✓ Ready for Submission"}
          {status === "READY_FOR_REVIEW" && "⚠️ Ready for Review"}
          {status === "INCOMPLETE" && "📋 Assembly Incomplete"}
        </span>
      </div>

      {/* Assembly Status Banner */}
      <div
        className={`${styles.statusBanner} ${
          status === "READY_FOR_SUBMISSION"
            ? styles.bannerSubmission
            : status === "READY_FOR_REVIEW"
            ? styles.bannerReview
            : styles.bannerIncomplete
        }`}
      >
        {status === "READY_FOR_SUBMISSION" && (
          <p style={{ margin: 0 }}>
            <strong>All Criteria Satisfied:</strong> Core hardware subsystems are installed and physical mass, electrical power, and thermal budgets are verified with healthy flight margins.
          </p>
        )}
        {status === "READY_FOR_REVIEW" && (
          <p style={{ margin: 0 }}>
            <strong>Assembly Complete (Engineering Review Required):</strong> All required subsystem components and mission parameters are in place. However, resource budget warnings or fatal violations must be resolved in the Resource Dashboard before flight submission.
          </p>
        )}
        {status === "INCOMPLETE" && (
          <p style={{ margin: 0 }}>
            <strong>Assembly In Progress:</strong> {selectedComponentCount} component(s) installed. Spacecraft requires essential architectural subsystems and mission trajectory configuration before it can be flight-certified.
          </p>
        )}
      </div>

      {/* Verification Matrix: Assembly vs Engineering Feasibility */}
      <div className={styles.verificationMatrix}>
        <div className={styles.matrixItem}>
          <span className={styles.matrixLabel}>Visual Assembly</span>
          <span
            className={styles.matrixStatus}
            style={{ color: isAssemblyComplete ? "#2ed573" : "#00d2d3" }}
          >
            {isAssemblyComplete ? "✓ Complete (6/6)" : `${satisfiedCategories.length + (orbitSelected ? 1 : 0) + (launcherSelected ? 1 : 0)}/6 Criteria`}
          </span>
        </div>

        <div className={styles.matrixItem}>
          <span className={styles.matrixLabel}>Engineering Physics</span>
          <span
            className={styles.matrixStatus}
            style={{
              color: hasCriticalViolations
                ? "#ff4757"
                : engineeringFeasible
                ? "#2ed573"
                : "#ffa502",
            }}
          >
            {hasCriticalViolations
              ? "🚨 Violations Detected"
              : engineeringFeasible
              ? "✓ Budgets Nominal"
              : "⚠️ Unverified / Incomplete"}
          </span>
        </div>
      </div>

      {/* Subsystem & Parameter Checklist */}
      <div className={styles.checklistSection}>
        <span className={styles.checklistTitle}>Required Mission Architecture</span>
        <div className={styles.checklistGrid}>
          {REQUIRED_CATEGORIES.map((cat) => {
            const isMet = presentCategories.has(cat);
            return (
              <div
                key={cat}
                className={`${styles.checklistItem} ${isMet ? styles.checkMet : styles.checkMissing}`}
              >
                <span className={styles.checkIcon}>{isMet ? "✓" : "○"}</span>
                <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
              </div>
            );
          })}

          <div className={`${styles.checklistItem} ${orbitSelected ? styles.checkMet : styles.checkMissing}`}>
            <span className={styles.checkIcon}>{orbitSelected ? "✓" : "○"}</span>
            <span>Target Orbit</span>
          </div>

          <div className={`${styles.checklistItem} ${launcherSelected ? styles.checkMet : styles.checkMissing}`}>
            <span className={styles.checkIcon}>{launcherSelected ? "✓" : "○"}</span>
            <span>Launch Vehicle</span>
          </div>
        </div>
      </div>

      {/* Actionable Next Steps */}
      <div className={styles.actionBox}>
        <div className={styles.actionTitle}>Next Recommended Action:</div>
        <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
          {nextActions.map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
        {isAssemblyComplete && hasCriticalViolations && onSwitchToResources && (
          <button
            type="button"
            onClick={onSwitchToResources}
            style={{
              marginTop: "8px",
              background: "#0e2a52",
              border: "1px solid #2b5f9e",
              color: "#8cc8ff",
              padding: "4px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.72rem",
              fontWeight: 600,
            }}
          >
            📊 Jump to Resource Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
