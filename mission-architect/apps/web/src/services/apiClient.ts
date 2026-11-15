const rawUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, "");

export const API_BASE: string = rawUrl
  ? rawUrl.endsWith("/api")
    ? rawUrl
    : `${rawUrl}/api`
  : "/api";

export const apiClient = {
  baseUrl: API_BASE,
};
