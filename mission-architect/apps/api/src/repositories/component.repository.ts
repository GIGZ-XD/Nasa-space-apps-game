import type { Component, ComponentCategory } from "@mission-architect/shared";
import { components } from "../data/mock";

// Reads live data each call (catalogue is small) so there is no stale index to invalidate.
export const componentRepository = {
  list: (category?: ComponentCategory | string): Component[] =>
    category ? components.filter((c) => c.category === category) : components,
  findById: (id: string): Component | undefined => components.find((c) => c.id === id),
};
