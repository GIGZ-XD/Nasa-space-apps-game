import type { Component, ComponentCategory } from "@mission-architect/shared";
import { components } from "../data/mock";

const byId = new Map(components.map((c) => [c.id, c]));

export const componentRepository = {
  list: (category?: ComponentCategory | string): Component[] =>
    category ? components.filter((c) => c.category === category) : components,
  findById: (id: string): Component | undefined => byId.get(id),
};
