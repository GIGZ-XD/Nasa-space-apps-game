import { useState, useMemo } from "react";
import type { ComponentCategory, Component } from "./component.types";
import {
  localCatalogueAdapter,
  getCatalogueComponentById,
  getCatalogueOrbitById,
  getCatalogueLauncherById,
} from "./componentData";
import { ComponentCard } from "./ComponentCard";
import { ComponentDetailPanel } from "./ComponentDetailPanel";
import { ComponentComparisonModal } from "./ComponentComparisonModal";
import {
  useSpacecraftStore,
  selectSelectedComponents,
} from "../../stores/spacecraftStore";
import styles from "./ComponentCatalogue.module.css";

/** Ordered tab list — "all" first, then each category */
const ALL_CATEGORIES: Array<{ key: "all" | ComponentCategory; label: string }> = [
  { key: "all",            label: "All" },
  { key: "structure",      label: "Structure" },
  { key: "power",          label: "Power" },
  { key: "propulsion",     label: "Propulsion" },
  { key: "thermal",        label: "Thermal" },
  { key: "communications", label: "Comms" },
  { key: "avionics",       label: "Avionics" },
  { key: "payload",        label: "Payload" },
];

/**
 * Required categories for a "complete" design — mirrors the store constant.
 */
const REQUIRED_CATEGORIES: ComponentCategory[] = [
  "structure",
  "power",
  "communications",
  "avionics",
];

const ALL_COMPONENTS = localCatalogueAdapter.getComponents();
const ALL_ORBITS = localCatalogueAdapter.getOrbits();
const ALL_LAUNCHERS = localCatalogueAdapter.getLaunchers();

function formatCost(credits: number): string {
  if (credits >= 1000) return `${(credits / 1000).toFixed(0)}k ¢`;
  return `${credits} ¢`;
}

type SortOption =
  | "default"
  | "name-asc"
  | "mass-asc"
  | "mass-desc"
  | "cost-asc"
  | "cost-desc"
  | "power-gen";

export function ComponentCatalogue() {
  const [activeCategory, setActiveCategory] = useState<"all" | ComponentCategory>("all");
  const [detailComponentId, setDetailComponentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [showTipBanner, setShowTipBanner] = useState<boolean>(true);

  // Comparison State
  const [comparedCategory, setComparedCategory] = useState<ComponentCategory | null>(null);
  const [comparedComponentIds, setComparedComponentIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Spacecraft Name Edit State
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInputValue, setNameInputValue] = useState<string>("");

  // Store Subscriptions & Actions
  const selectedComponents = useSpacecraftStore(selectSelectedComponents);
  const selectedInstanceId  = useSpacecraftStore((s) => s.selectedInstanceId);
  const design              = useSpacecraftStore((s) => s.design);
  const addComponent        = useSpacecraftStore((s) => s.addComponent);
  const removeComponent     = useSpacecraftStore((s) => s.removeComponent);
  const selectComponent     = useSpacecraftStore((s) => s.selectComponent);
  const resetDesign         = useSpacecraftStore((s) => s.resetDesign);
  const setOrbit            = useSpacecraftStore((s) => s.setOrbit);
  const setLauncher         = useSpacecraftStore((s) => s.setLauncher);
  const setDesignName       = useSpacecraftStore((s) => s.setDesignName);

  // Set of componentIds currently in the design
  const addedIds = useMemo(
    () => new Set(selectedComponents.map((r) => r.componentId)),
    [selectedComponents],
  );

  // The componentId of the currently highlighted instance
  const highlightedComponentId = useMemo(() => {
    if (!selectedInstanceId) return null;
    return (
      selectedComponents.find((r) => r.instanceId === selectedInstanceId)?.componentId ?? null
    );
  }, [selectedInstanceId, selectedComponents]);

  // Selected component for detail panel
  const detailComponent = useMemo(
    () => (detailComponentId ? getCatalogueComponentById(detailComponentId) ?? null : null),
    [detailComponentId],
  );

  // Active Orbit and Launcher data
  const selectedOrbit = useMemo(
    () => (design.selectedOrbitId ? getCatalogueOrbitById(design.selectedOrbitId) ?? null : null),
    [design.selectedOrbitId],
  );

  const selectedLauncher = useMemo(
    () => (design.selectedLauncherId ? getCatalogueLauncherById(design.selectedLauncherId) ?? null : null),
    [design.selectedLauncherId],
  );

  // Filtered and Sorted Components List
  const visibleComponents = useMemo(() => {
    let result = ALL_COMPONENTS;

    // Filter by Category
    if (activeCategory !== "all") {
      result = result.filter((c) => c.category === activeCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((c) => {
        const inName = c.name.toLowerCase().includes(q);
        const inDesc = c.description.toLowerCase().includes(q);
        const inCat = c.category.toLowerCase().includes(q);
        const inForm = c.specs?.formFactor?.toLowerCase().includes(q);
        return inName || inDesc || inCat || inForm;
      });
    }

    // Sort
    if (sortBy !== "default") {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case "name-asc":
            return a.name.localeCompare(b.name);
          case "mass-asc":
            return a.massKg - b.massKg;
          case "mass-desc":
            return b.massKg - a.massKg;
          case "cost-asc":
            return a.costCredits - b.costCredits;
          case "cost-desc":
            return b.costCredits - a.costCredits;
          case "power-gen":
            return a.powerWatts - b.powerWatts;
          default:
            return 0;
        }
      });
    }

    return result;
  }, [activeCategory, searchQuery, sortBy]);

  // Group visible components by category when in "all" view without active search/sort
  const grouped = useMemo(() => {
    if (activeCategory !== "all" || searchQuery.trim() || sortBy !== "default") return null;
    const map = new Map<ComponentCategory, Component[]>();
    for (const comp of visibleComponents) {
      const bucket = map.get(comp.category) ?? [];
      bucket.push(comp);
      map.set(comp.category, bucket);
    }
    return map;
  }, [activeCategory, searchQuery, sortBy, visibleComponents]);

  // Completeness check — 4 required subsystem categories + orbit + launcher = 6 criteria total
  const presentCategories = useMemo(
    () =>
      new Set(
        selectedComponents
          .map((r) => getCatalogueComponentById(r.componentId)?.category)
          .filter(Boolean),
      ),
    [selectedComponents],
  );

  const requiredSubsystemsMet = REQUIRED_CATEGORIES.filter((c) => presentCategories.has(c)).length;
  const orbitMet = design.selectedOrbitId !== null ? 1 : 0;
  const launcherMet = design.selectedLauncherId !== null ? 1 : 0;
  const totalMetCriteria = requiredSubsystemsMet + orbitMet + launcherMet;
  const totalRequiredCriteria = REQUIRED_CATEGORIES.length + 2; // 6 criteria
  const completenessRatio = totalMetCriteria / totalRequiredCriteria;
  const isFlightReady = totalMetCriteria === totalRequiredCriteria;

  // Handlers passed down to cards
  function handleAdd(componentId: string) {
    addComponent(componentId);
  }

  function handleRemove(componentId: string) {
    const ref = selectedComponents.find((r) => r.componentId === componentId);
    if (ref) removeComponent(ref.instanceId);
  }

  function handleHighlight(componentId: string) {
    const ref = selectedComponents.find((r) => r.componentId === componentId);
    if (!ref) return;
    if (selectedInstanceId === ref.instanceId) {
      selectComponent(null);
    } else {
      selectComponent(ref.instanceId);
    }
  }

  function handleOpenDetail(componentId: string) {
    setDetailComponentId((prev) => (prev === componentId ? null : componentId));
  }

  function handleCloseDetail() {
    setDetailComponentId(null);
  }

  function handleSidebarItemClick(instanceId: string) {
    if (selectedInstanceId === instanceId) {
      selectComponent(null);
    } else {
      selectComponent(instanceId);
      const target = selectedComponents.find((r) => r.instanceId === instanceId);
      if (target) {
        setDetailComponentId(target.componentId);
      }
    }
  }

  function handleSidebarRemove(e: React.MouseEvent, instanceId: string) {
    e.stopPropagation();
    removeComponent(instanceId);
  }

  // ---- Comparison Handlers ----

  function handleToggleCompare(componentId: string) {
    const comp = getCatalogueComponentById(componentId);
    if (!comp) return;

    if (comparedCategory !== comp.category) {
      setComparedCategory(comp.category);
      setComparedComponentIds([componentId]);
    } else {
      if (comparedComponentIds.includes(componentId)) {
        const next = comparedComponentIds.filter((id) => id !== componentId);
        setComparedComponentIds(next);
        if (next.length === 0) {
          setComparedCategory(null);
        }
      } else {
        setComparedComponentIds([...comparedComponentIds, componentId]);
      }
    }
  }

  function handleCompareCategory(category: ComponentCategory, _componentId: string) {
    const categoryComps = localCatalogueAdapter.getComponentsByCategory(category);
    setComparedCategory(category);
    setComparedComponentIds(categoryComps.map((c) => c.id));
    setIsCompareModalOpen(true);
  }

  function handleClearComparison() {
    setComparedCategory(null);
    setComparedComponentIds([]);
    setIsCompareModalOpen(false);
  }

  function handleOpenComparisonModal() {
    if (comparedComponentIds.length >= 1 && comparedCategory) {
      if (comparedComponentIds.length === 1) {
        const categoryComps = localCatalogueAdapter.getComponentsByCategory(comparedCategory);
        setComparedComponentIds(categoryComps.map((c) => c.id));
      }
      setIsCompareModalOpen(true);
    }
  }

  function handleResetFilters() {
    setSearchQuery("");
    setSortBy("default");
    setActiveCategory("all");
  }

  // ---- Render helpers ----

  function renderGrid(components: Component[]) {
    return (
      <div className={styles.grid}>
        {components.map((comp) => (
          <ComponentCard
            key={comp.id}
            component={comp}
            isAdded={addedIds.has(comp.id)}
            isHighlighted={highlightedComponentId === comp.id}
            isDetailOpen={detailComponentId === comp.id}
            isCompared={comparedComponentIds.includes(comp.id)}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onHighlight={handleHighlight}
            onOpenDetail={handleOpenDetail}
            onToggleCompare={handleToggleCompare}
          />
        ))}
      </div>
    );
  }

  function renderBody() {
    if (visibleComponents.length === 0) {
      return (
        <div className={styles.emptySearch} role="region" aria-label="No results">
          <p className={styles.emptySearchTitle}>No Components Found</p>
          <p className={styles.emptySearchDesc}>
            No components matched &ldquo;{searchQuery}&rdquo; in the selected filter criteria.
          </p>
          <button
            type="button"
            className={styles.resetSearchBtn}
            onClick={handleResetFilters}
          >
            Reset Filters
          </button>
        </div>
      );
    }

    if (grouped) {
      return Array.from(grouped.entries()).map(([cat, comps]) => (
        <section key={cat} aria-label={cat}>
          <p className={styles.categoryLabel}>{cat.toUpperCase()}</p>
          {renderGrid(comps)}
        </section>
      ));
    }

    return renderGrid(visibleComponents);
  }

  return (
    <div className={styles.catalogue}>
      {/* ---- Header ---- */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Spacecraft Component Catalogue</h1>
            <span className={styles.subtitle}>
              Mission Architect · Spacecraft Builder & Subsystem Integration
            </span>
          </div>
        </div>

        {/* Search, Sort, and Summary Row */}
        <div className={styles.headerControls}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search components by name, description, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search components"
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.searchClearBtn}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search text"
              >
                ✕
              </button>
            )}
          </div>

          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort components by"
          >
            <option value="default">Sort: Default Catalog Order</option>
            <option value="name-asc">Sort: Name (A to Z)</option>
            <option value="mass-asc">Sort: Mass (Lowest first)</option>
            <option value="mass-desc">Sort: Mass (Highest first)</option>
            <option value="cost-asc">Sort: Cost (Lowest first)</option>
            <option value="cost-desc">Sort: Cost (Highest first)</option>
            <option value="power-gen">Sort: Power Generation (High to Low)</option>
          </select>

          <span className={styles.componentCountBadge}>
            Showing {visibleComponents.length} of {ALL_COMPONENTS.length} components
          </span>
        </div>

        {/* Category tabs */}
        <nav className={styles.tabs} aria-label="Filter by category" role="tablist">
          {ALL_CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.tab} ${activeCategory === key ? styles.tabActive : ""}`}
              onClick={() => setActiveCategory(key)}
              aria-selected={activeCategory === key}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* ---- Body: grid + sidebar ---- */}
      <div className={styles.body}>
        {/* Component grid */}
        <main className={styles.gridWrapper}>
          {showTipBanner && (
            <aside className={styles.tipBanner} role="note" aria-label="Usage guide">
              <span className={styles.tipText}>
                💡 <strong>Architect&apos;s Tip:</strong> Click any card to inspect full technical properties, or click <strong>⚖️ Compare</strong> to contrast options side-by-side.
              </span>
              <button
                type="button"
                className={styles.searchClearBtn}
                onClick={() => setShowTipBanner(false)}
                aria-label="Dismiss guide"
                title="Dismiss"
              >
                ✕
              </button>
            </aside>
          )}

          {renderBody()}
        </main>

        {/* Design summary sidebar */}
        <aside className={styles.sidebar} aria-label="Current spacecraft design">
          <p className={styles.sidebarTitle}>Spacecraft Design</p>

          {/* Editable Spacecraft Name */}
          <div className={styles.nameEditRow}>
            {isEditingName ? (
              <input
                className={styles.nameInput}
                value={nameInputValue}
                onChange={(e) => setNameInputValue(e.target.value)}
                onBlur={() => {
                  setDesignName(nameInputValue);
                  setIsEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setDesignName(nameInputValue);
                    setIsEditingName(false);
                  } else if (e.key === "Escape") {
                    setNameInputValue(design.name);
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                aria-label="Edit spacecraft name"
              />
            ) : (
              <>
                <div className={styles.designName}>{design.name}</div>
                <button
                  type="button"
                  className={styles.nameEditBtn}
                  onClick={() => {
                    setNameInputValue(design.name);
                    setIsEditingName(true);
                  }}
                  title="Rename Spacecraft"
                  aria-label="Rename Spacecraft"
                >
                  ✎
                </button>
              </>
            )}
          </div>

          {/* Mission Parameters (Orbit & Launcher Selection) */}
          <div className={styles.paramGroup}>
            <p className={styles.paramLabel}>Target Orbit</p>
            <select
              className={styles.paramSelect}
              value={design.selectedOrbitId ?? ""}
              onChange={(e) => setOrbit(e.target.value || null)}
              aria-label="Select target orbit"
            >
              <option value="">-- Choose Orbit --</option>
              {ALL_ORBITS.map((orb) => (
                <option key={orb.id} value={orb.id}>
                  {orb.name} ({orb.altitudeKm} km, ΔV: {orb.deltaVRequiredMps} m/s)
                </option>
              ))}
            </select>
            {selectedOrbit && (
              <span className={styles.paramInfo}>
                {selectedOrbit.type} · {selectedOrbit.inclinationDeg}° inc · {selectedOrbit.deltaVRequiredMps} m/s ΔV
              </span>
            )}
          </div>

          <div className={styles.paramGroup}>
            <p className={styles.paramLabel}>Launch Vehicle</p>
            <select
              className={styles.paramSelect}
              value={design.selectedLauncherId ?? ""}
              onChange={(e) => setLauncher(e.target.value || null)}
              aria-label="Select launch vehicle"
            >
              <option value="">-- Choose Launcher --</option>
              {ALL_LAUNCHERS.map((lnch) => (
                <option key={lnch.id} value={lnch.id}>
                  {lnch.name} (Max {lnch.payloadCapacityLeoKg} kg LEO · {formatCost(lnch.costCredits)})
                </option>
              ))}
            </select>
            {selectedLauncher && (
              <span className={styles.paramInfo}>
                LEO: {selectedLauncher.payloadCapacityLeoKg} kg · Fairing: ⌀{selectedLauncher.fairingDiameterM}m · {selectedLauncher.reliabilityPercent}% reliability
              </span>
            )}
          </div>

          {/* Selected components list */}
          <p className={styles.sidebarTitle} style={{ marginTop: "8px" }}>
            Installed Components ({selectedComponents.length})
          </p>

          {selectedComponents.length === 0 ? (
            <p className={styles.emptyState}>
              No components installed yet.
              <br />
              Select components from the catalogue to construct your spacecraft.
            </p>
          ) : (
            <ul className={styles.selectedList} aria-label="Added components">
              {selectedComponents.map((ref) => {
                const comp = getCatalogueComponentById(ref.componentId);
                if (!comp) return null;
                const isActive = selectedInstanceId === ref.instanceId;
                return (
                  <li
                    key={ref.instanceId}
                    className={`${styles.selectedItem} ${isActive ? styles.selectedItemActive : ""}`}
                    onClick={() => handleSidebarItemClick(ref.instanceId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleSidebarItemClick(ref.instanceId);
                      }
                    }}
                    aria-pressed={isActive}
                  >
                    <div>
                      <div className={styles.selectedItemName}>{comp.name}</div>
                      <div className={styles.selectedItemCategory}>{comp.category}</div>
                    </div>
                    <button
                      className={styles.removeItemBtn}
                      onClick={(e) => handleSidebarRemove(e, ref.instanceId)}
                      aria-label={`Remove ${comp.name}`}
                      type="button"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Completeness Section */}
          <div className={styles.completenessSection}>
            <div className={styles.completenessLabel}>
              <span>Subsystem Readiness</span>
              <span>{Math.round(completenessRatio * 100)}%</span>
            </div>
            <div
              className={styles.completenessBar}
              role="progressbar"
              aria-valuenow={Math.round(completenessRatio * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={styles.completenessFill}
                style={{ width: `${completenessRatio * 100}%` }}
              />
            </div>
            <ul className={styles.completenessChecklist} aria-label="Required subsystems">
              {REQUIRED_CATEGORIES.map((cat) => {
                const isMet = presentCategories.has(cat);
                return (
                  <li key={cat} className={`${styles.checkItem} ${isMet ? styles.met : ""}`}>
                    <span className={styles.checkDot} aria-hidden="true" />
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </li>
                );
              })}
              <li className={`${styles.checkItem} ${design.selectedOrbitId ? styles.met : ""}`}>
                <span className={styles.checkDot} aria-hidden="true" />
                Orbit Target
              </li>
              <li className={`${styles.checkItem} ${design.selectedLauncherId ? styles.met : ""}`}>
                <span className={styles.checkDot} aria-hidden="true" />
                Launch Vehicle
              </li>
            </ul>

            {isFlightReady && (
              <div className={styles.flightReadyBadge}>
                <span>🚀 Spacecraft Flight Ready!</span>
              </div>
            )}
          </div>

          {/* Reset */}
          <button
            className={styles.resetBtn}
            onClick={resetDesign}
            type="button"
            aria-label="Reset spacecraft design"
          >
            ↺ Reset Design
          </button>
        </aside>
      </div>

      {/* Detail panel & backdrop */}
      {detailComponent && (
        <>
          <div
            className={styles.detailBackdrop}
            onClick={handleCloseDetail}
            aria-hidden="true"
          />
          <ComponentDetailPanel
            component={detailComponent}
            isAdded={addedIds.has(detailComponent.id)}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onClose={handleCloseDetail}
            onCompareCategory={handleCompareCategory}
          />
        </>
      )}

      {/* Floating comparison dock */}
      {comparedCategory && comparedComponentIds.length > 0 && !isCompareModalOpen && (
        <aside className={styles.floatingBar} role="region" aria-label="Comparison dock">
          <div className={styles.floatingBarInfo}>
            <span>⚖️ Comparing</span>
            <span className={styles.floatingBarBadge}>
              {comparedComponentIds.length} {comparedCategory}
            </span>
          </div>
          <div className={styles.floatingBarActions}>
            <button
              type="button"
              className={styles.openCompareBtn}
              onClick={handleOpenComparisonModal}
            >
              {comparedComponentIds.length >= 2
                ? "View Side-by-Side Comparison"
                : `Compare all in ${comparedCategory}`}
            </button>
            <button
              type="button"
              className={styles.clearCompareBtn}
              onClick={handleClearComparison}
            >
              Clear
            </button>
          </div>
        </aside>
      )}

      {/* Side-by-Side Comparison Modal */}
      {isCompareModalOpen && comparedCategory && (
        <ComponentComparisonModal
          category={comparedCategory}
          availableComponents={localCatalogueAdapter.getComponentsByCategory(comparedCategory)}
          comparedIds={comparedComponentIds}
          addedIds={addedIds}
          onToggleComparedId={(id) => {
            if (comparedComponentIds.includes(id)) {
              setComparedComponentIds(comparedComponentIds.filter((item) => item !== id));
            } else {
              setComparedComponentIds([...comparedComponentIds, id]);
            }
          }}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onClose={() => setIsCompareModalOpen(false)}
        />
      )}
    </div>
  );
}
