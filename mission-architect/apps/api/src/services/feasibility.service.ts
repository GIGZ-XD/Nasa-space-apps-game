import type { Component, FeasibilityCheck, ResourceTotals } from "@mission-architect/shared";
import type { MissionRules } from "../types/scoring";

/** Hard constraints, independent of score. All checks always run and are all reported. */
export function checkFeasibility(
  rules: MissionRules, parts: Component[], orbit: Component, launcher: Component, totals: ResourceTotals,
): FeasibilityCheck[] {
  const present = new Set<string>([...parts.map((p) => p.category), orbit.category, launcher.category]);
  const missing = rules.mandatoryCategories.filter((c) => !present.has(c));

  const required = totals.powerDrawW * rules.powerReserveFactor;
  const supported = launcher.supportedOrbitIds;

  const checks: FeasibilityCheck[] = [
    { id: "mandatory", passed: missing.length === 0,
      message: missing.length ? `Missing required subsystems: ${missing.join(", ")}.` : "All required subsystems are present." },
    { id: "mass", passed: totals.massKg <= totals.launcherCapacityKg,
      message: totals.massKg <= totals.launcherCapacityKg
        ? `Spacecraft mass ${totals.massKg} kg fits the launcher (${totals.launcherCapacityKg} kg).`
        : `Spacecraft mass ${totals.massKg} kg exceeds the launcher capacity of ${totals.launcherCapacityKg} kg.` },
    { id: "power", passed: totals.powerOutputW >= required,
      message: totals.powerOutputW >= required
        ? `Power output ${totals.powerOutputW} W covers the ${totals.powerDrawW} W draw with reserve.`
        : `Power output ${totals.powerOutputW} W is below the ${round(required)} W needed (draw ${totals.powerDrawW} W plus reserve).` },
    { id: "orbit-launcher", passed: !!supported && supported.includes(orbit.id),
      message: supported?.includes(orbit.id)
        ? `${launcher.name} can reach ${orbit.name}.`
        : `${launcher.name} cannot reach ${orbit.name}.` },
  ];
  if (rules.allowedOrbitIds) {
    const ok = rules.allowedOrbitIds.includes(orbit.id);
    checks.push({ id: "orbit-allowed", passed: ok,
      message: ok ? `${orbit.name} is suitable for this mission.` : `${orbit.name} is not an allowed orbit for this mission.` });
  }
  return checks;
}
const round = (n: number) => Math.round(n * 100) / 100;
