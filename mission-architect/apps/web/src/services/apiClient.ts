export const API_BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") || "/api";

export const apiClient = {
  baseUrl: API_BASE,
};
