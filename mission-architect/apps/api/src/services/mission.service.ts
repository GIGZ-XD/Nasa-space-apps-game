import { missionRepository } from "../repositories/mission.repository";
export const listMissions = () => missionRepository.list();
export const getMission = (id: string) => missionRepository.findById(id);
