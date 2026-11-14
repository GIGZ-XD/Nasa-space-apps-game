/** What the client sends. Never include client-computed totals or scores. */
export interface DesignInput {
  missionId: string;
  name?: string;
  componentIds: string[];
  orbitId: string;
  launchVehicleId: string;
}

export interface Spacecraft extends DesignInput {
  id: string;
  createdAt: string;
}
