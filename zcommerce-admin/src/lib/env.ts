export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ??
  "http://localhost:4000/api/v1";

export const STORE_URL: string = (import.meta.env.VITE_STORE_URL as string | undefined)?.replace(/\/+$/, "") ??
  "http://localhost:3001";

export const IS_DEV = import.meta.env.DEV;
