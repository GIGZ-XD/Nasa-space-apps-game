import React from "react";
import type { EngineeringWarning } from "./resource.types";
import styles from "./ResourceDashboard.module.css";

interface EngineeringWarningsPanelProps {
  warnings: EngineeringWarning[];
}

export function EngineeringWarningsPanel({ warnings }: EngineeringWarningsPanelProps) {
  const criticalWarnings = warnings.filter((w) => w.severity === "CRITICAL");
  const marginWarnings = warnings.filter((w) => w.severity === "WARNING");
  const infoWarnings = warnings.filter((w) => w.severity === "INFO");

  return (
    <div className={styles.warningsCard} aria-labelledby="warnings-heading">
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <span className={styles.cardIcon}>🛠️</span>
          <div>
            <h2 id="warnings-heading" className={styles.cardTitle}>
              Engineering Assessment & Advisories
            </h2>
            <span className={styles.cardSubtitle}>
              Physical Constraints, Safety Margins & Catalogue Recommendations
            </span>
          </div>
        </div>

        <span className={styles.warningCountBadge}>
          {criticalWarnings.length > 0 ? (
            <span className={styles.textDanger}>{criticalWarnings.length} Critical</span>
          ) : marginWarnings.length > 0 ? (
            <span className={styles.textWarning}>{marginWarnings.length} Warnings</span>
          ) : (
            <span className={styles.textSuccess}>0 Violations</span>
          )}
        </span>
      </div>

      {warnings.length === 0 ? (
        <div className={styles.calloutSuccess}>
          <strong>All Systems Nominal:</strong> Spacecraft configuration satisfies all aerospace constraints with healthy margins. No engineering violations or warnings detected.
        </div>
      ) : (
        <div className={styles.warningGroupsContainer}>
          {/* 1. Critical Violations */}
          {criticalWarnings.length > 0 && (
            <div className={styles.warningGroup}>
              <div className={styles.groupHeaderDanger}>
                <span>🚨 Fatal Engineering Violations ({criticalWarnings.length})</span>
              </div>
              <div className={styles.warningCardsList}>
                {criticalWarnings.map((warn) => (
                  <div key={warn.id} className={styles.warningItemDanger}>
                    <div className={styles.warningItemHeader}>
                      <span className={styles.warningItemTitle}>{warn.title}</span>
                      <span className={styles.warningCategoryTag}>{warn.category}</span>
                    </div>
                    <p className={styles.warningItemMessage}>{warn.message}</p>
                    {warn.recommendation && (
                      <div className={styles.warningRecommendation}>
                        <span className={styles.recommendationIcon}>💡 Recommendation:</span>{" "}
                        {warn.recommendation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Approaching Limits / Margins */}
          {marginWarnings.length > 0 && (
            <div className={styles.warningGroup}>
              <div className={styles.groupHeaderWarning}>
                <span>⚠️ Approaching Limits & Narrow Margins ({marginWarnings.length})</span>
              </div>
              <div className={styles.warningCardsList}>
                {marginWarnings.map((warn) => (
                  <div key={warn.id} className={styles.warningItemWarning}>
                    <div className={styles.warningItemHeader}>
                      <span className={styles.warningItemTitle}>{warn.title}</span>
                      <span className={styles.warningCategoryTag}>{warn.category}</span>
                    </div>
                    <p className={styles.warningItemMessage}>{warn.message}</p>
                    {warn.recommendation && (
                      <div className={styles.warningRecommendation}>
                        <span className={styles.recommendationIcon}>💡 Recommendation:</span>{" "}
                        {warn.recommendation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Architectural Guidance & Missing Selections */}
          {infoWarnings.length > 0 && (
            <div className={styles.warningGroup}>
              <div className={styles.groupHeaderInfo}>
                <span>ℹ️ Mission Architecture Checklist ({infoWarnings.length})</span>
              </div>
              <div className={styles.warningCardsList}>
                {infoWarnings.map((warn) => (
                  <div key={warn.id} className={styles.warningItemInfo}>
                    <div className={styles.warningItemHeader}>
                      <span className={styles.warningItemTitle}>{warn.title}</span>
                      <span className={styles.warningCategoryTag}>{warn.category}</span>
                    </div>
                    <p className={styles.warningItemMessage}>{warn.message}</p>
                    {warn.recommendation && (
                      <div className={styles.warningRecommendation}>
                        <span className={styles.recommendationIcon}>💡 Action:</span>{" "}
                        {warn.recommendation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
