import React, { useMemo } from "react";
import { useSpacecraftStore } from "../../stores/spacecraftStore";
import { getCatalogueComponentById } from "../component-catalogue/componentData";
import type { Component, ComponentCategory } from "../component-catalogue/component.types";
import { SpacecraftPreview } from "./SpacecraftPreview";
import { ReadinessSummary } from "./ReadinessSummary";
import { ComponentCatalogue } from "../component-catalogue/ComponentCatalogue";
import { useResourceBudget } from "../resource-management/useResourceBudget";
import styles from "./BuilderWorkspace.module.css";

export interface BuilderWorkspaceProps {
  onSwitchToResources?: () => void;
}

export function BuilderWorkspace({ onSwitchToResources }: BuilderWorkspaceProps) {
  const design = useSpacecraftStore((s) => s.design);
  const selectedInstanceId = useSpacecraftStore((s) => s.selectedInstanceId);
  const selectComponent = useSpacecraftStore((s) => s.selectComponent);
  const removeComponent = useSpacecraftStore((s) => s.removeComponent);

  const resourceReport = useResourceBudget();

  // Resolve installed components for the visual preview
  const installedComponents = useMemo(() => {
    return design.selectedComponents
      .map((ref) => {
        const comp = getCatalogueComponentById(ref.componentId);
        if (!comp) return null;
        return { component: comp, instanceId: ref.instanceId };
      })
      .filter((c): c is { component: Component; instanceId: string } => c !== null);
  }, [design.selectedComponents]);

  // Set of installed categories
  const presentCategories = useMemo(() => {
    return new Set(installedComponents.map((item) => item.component.category));
  }, [installedComponents]);

  const hasCriticalViolations = resourceReport.warnings.some((w) => w.severity === "CRITICAL");
  const isEngineeringFeasible = resourceReport.feasibility.status === "FEASIBLE";

  return (
    <div className={styles.workspaceShell}>
      {/* Header Bar */}
      <header className={styles.workspaceHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.workspaceTitle}>
            Spacecraft Assembly Bay
            <span className={styles.spacecraftTag}>
              🛰️ {design.name || "Unnamed Spacecraft"}
            </span>
          </h1>
          <p className={styles.workspaceSubtitle}>
            Interactive Visual Assembly, Subsystem Mounting &amp; Architectural Readiness
          </p>
        </div>

        {onSwitchToResources && (
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.resourceNavBtn}
              onClick={onSwitchToResources}
              aria-label="Open Resource Management Dashboard"
            >
              📊 Resource &amp; Physics Dashboard →
            </button>
          </div>
        )}
      </header>

      {/* Main Split Layout */}
      <main className={styles.workspaceLayout}>
        {/* Left Assembly Column */}
        <section className={styles.assemblyStage} aria-label="Spacecraft Visual Assembly Stage">
          {/* Layered 2D Visual Preview */}
          <SpacecraftPreview
            installedComponents={installedComponents}
            selectedInstanceId={selectedInstanceId}
            onSelectComponent={selectComponent}
            onRemoveComponent={removeComponent}
          />

          {/* Architectural Readiness Summary */}
          <ReadinessSummary
            selectedComponentCount={installedComponents.length}
            presentCategories={presentCategories}
            orbitSelected={design.selectedOrbitId !== null}
            launcherSelected={design.selectedLauncherId !== null}
            engineeringFeasible={isEngineeringFeasible}
            hasCriticalViolations={hasCriticalViolations}
            onSwitchToResources={onSwitchToResources}
          />
        </section>

        {/* Right Catalogue & Selection Column */}
        <section className={styles.catalogueStage} aria-label="Component Catalogue and Mounting Controls">
          <ComponentCatalogue onSwitchToResources={onSwitchToResources} />
        </section>
      </main>
    </div>
  );
}
