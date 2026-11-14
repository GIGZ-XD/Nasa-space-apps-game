import { componentRepository } from "../repositories/component.repository";
export const listComponents = (category?: string) => componentRepository.list(category);
export const getComponent = (id: string) => componentRepository.findById(id);
