import type { Component, ComponentCategory } from "../component-catalogue/component.types";

/**
 * Visual slot identifiers on the 2D spacecraft preview canvas.
 */
export type VisualSlotId =
  | "bus-structure"
  | "solar-wings"
  | "solar-body"
  | "battery-module"
  | "propulsion-engine"
  | "propulsion-rcs"
  | "radiator-panels"
  | "mli-insulation"
  | "antenna-dish"
  | "antenna-patch"
  | "avionics-computer"
  | "avionics-adcs"
  | "payload-camera"
  | "payload-radar"
  | "payload-boom"
  | "aux-attachment";

/**
 * Visual layer metadata describing where and how a component mounts.
 */
export interface VisualSlotItem {
  slotId: VisualSlotId;
  componentId: string;
  instanceId: string;
  name: string;
  category: ComponentCategory;
  zIndex: number;
  label: string;
  subtype: string;
  specs?: Record<string, unknown>;
}

/**
 * Mapping configuration between catalogue components and 2D preview slots.
 */
export interface CategorySlotDefinition {
  category: ComponentCategory;
  defaultSlotId: VisualSlotId;
  label: string;
  zIndex: number;
  resolveSubtype: (component: Component) => string;
  resolveSlotId: (component: Component) => VisualSlotId;
}

/**
 * Reusable mapping registry for all 7 standard aerospace categories.
 */
export const CATEGORY_SLOT_REGISTRY: Record<ComponentCategory, CategorySlotDefinition> = {
  structure: {
    category: "structure",
    defaultSlotId: "bus-structure",
    label: "Spacecraft Bus",
    zIndex: 10,
    resolveSubtype: (c) => (c.specs?.formFactor === "ESPA" ? "espahigh" : "cubesat-3u"),
    resolveSlotId: () => "bus-structure",
  },
  power: {
    category: "power",
    defaultSlotId: "solar-wings",
    label: "Electrical Power",
    zIndex: 15,
    resolveSubtype: (c) => {
      if (c.id.includes("battery")) return "battery";
      if (c.id.includes("deployable")) return "deployable-array";
      return "body-mounted";
    },
    resolveSlotId: (c) => {
      if (c.id.includes("battery")) return "battery-module";
      if (c.id.includes("fixed")) return "solar-body";
      return "solar-wings";
    },
  },
  propulsion: {
    category: "propulsion",
    defaultSlotId: "propulsion-engine",
    label: "Propulsion Assembly",
    zIndex: 5,
    resolveSubtype: (c) => {
      if (c.id.includes("ion") || c.id.includes("hall")) return "ion-engine";
      if (c.id.includes("biprop") || c.id.includes("hydrazine")) return "chemical-engine";
      return "cold-gas";
    },
    resolveSlotId: (c) => {
      if (c.id.includes("cold-gas")) return "propulsion-rcs";
      return "propulsion-engine";
    },
  },
  thermal: {
    category: "thermal",
    defaultSlotId: "radiator-panels",
    label: "Thermal Control",
    zIndex: 20,
    resolveSubtype: (c) => (c.id.includes("mli") ? "mli-blanket" : "active-radiator"),
    resolveSlotId: (c) => (c.id.includes("mli") ? "mli-insulation" : "radiator-panels"),
  },
  communications: {
    category: "communications",
    defaultSlotId: "antenna-dish",
    label: "Communications",
    zIndex: 25,
    resolveSubtype: (c) => (c.id.includes("dish") ? "parabolic-dish" : "patch-antenna"),
    resolveSlotId: (c) => (c.id.includes("dish") ? "antenna-dish" : "antenna-patch"),
  },
  avionics: {
    category: "avionics",
    defaultSlotId: "avionics-computer",
    label: "Avionics & GNC",
    zIndex: 12,
    resolveSubtype: (c) => (c.id.includes("adcs") ? "reaction-wheels" : "flight-computer"),
    resolveSlotId: (c) => (c.id.includes("adcs") ? "avionics-adcs" : "avionics-computer"),
  },
  payload: {
    category: "payload",
    defaultSlotId: "payload-camera",
    label: "Science Payload",
    zIndex: 18,
    resolveSubtype: (c) => {
      if (c.id.includes("radar") || c.id.includes("sar")) return "synthetic-aperture-radar";
      if (c.id.includes("imager") || c.id.includes("camera")) return "optical-sensor";
      if (c.id.includes("magnetometer") || c.id.includes("-mag")) return "magnetometer-boom";
      return "optical-sensor";
    },
    resolveSlotId: (c) => {
      if (c.id.includes("radar") || c.id.includes("sar")) return "payload-radar";
      if (c.id.includes("imager") || c.id.includes("camera")) return "payload-camera";
      if (c.id.includes("magnetometer") || c.id.includes("-mag")) return "payload-boom";
      return "payload-camera";
    },
  },
};

/**
 * Maps a single component and its mounted instance reference to a visual slot item.
 * Gracefully handles missing or unknown categories.
 */
export function mapComponentToVisualSlot(
  component: Component,
  instanceId: string,
): VisualSlotItem {
  const definition = CATEGORY_SLOT_REGISTRY[component.category];

  if (!definition) {
    // Graceful degradation for future or unrecognized categories
    return {
      slotId: "aux-attachment",
      componentId: component.id,
      instanceId,
      name: component.name,
      category: component.category,
      zIndex: 14,
      label: component.name,
      subtype: "aux-component",
      specs: component.specs,
    };
  }

  return {
    slotId: definition.resolveSlotId(component),
    componentId: component.id,
    instanceId,
    name: component.name,
    category: component.category,
    zIndex: definition.zIndex,
    label: definition.label,
    subtype: definition.resolveSubtype(component),
    specs: component.specs,
  };
}

/**
 * Maps an array of component objects with instance IDs to sorted visual slot items.
 * Sorts by z-index so layers render in the correct visual depth order.
 */
export function mapSelectedComponentsToVisualSlots(
  installed: Array<{ component: Component; instanceId: string }>,
): VisualSlotItem[] {
  return installed
    .map(({ component, instanceId }) => mapComponentToVisualSlot(component, instanceId))
    .sort((a, b) => a.zIndex - b.zIndex);
}

/**
 * Returns the set of categories that currently have at least one installed component.
 */
export function getInstalledCategories(slots: VisualSlotItem[]): Set<ComponentCategory> {
  return new Set(slots.map((s) => s.category));
}
