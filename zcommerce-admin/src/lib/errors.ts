import axios from "axios";
import { toast } from "sonner";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiErrorBody, ApiErrorDetail } from "@/types";

export class ApiError extends Error {
  code: string;
  status: number;
  details: ApiErrorDetail[];

  constructor(message: string, code = "INTERNAL_ERROR", status = 0, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function isErrorBody(v: unknown): v is ApiErrorBody {
  return (
    typeof v === "object" &&
    v !== null &&
    "error" in v &&
    typeof (v as { error: unknown }).error === "object" &&
    (v as { error: unknown }).error !== null
  );
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    const body: unknown = err.response?.data;
    if (isErrorBody(body)) {
      return new ApiError(
        body.error.message || "Request failed",
        body.error.code || "INTERNAL_ERROR",
        status,
        Array.isArray(body.error.details) ? body.error.details : [],
      );
    }
    if (!err.response) {
      return new ApiError("Cannot reach the API server. Is the backend running?", "NETWORK_ERROR", 0);
    }
    return new ApiError(err.message || "Request failed", "INTERNAL_ERROR", status);
  }
  if (err instanceof Error) return new ApiError(err.message);
  return new ApiError("Something went wrong");
}

export function errorMessage(err: unknown): string {
  return toApiError(err).message;
}

export function toastError(err: unknown, fallback?: string) {
  const e = toApiError(err);
  toast.error(fallback && !e.message ? fallback : e.message);
}

/**
 * Map API validation `details` onto react-hook-form field errors.
 * Returns true if at least one field error was applied. Any remaining errors are toasted.
 */
export function applyApiErrors<T extends FieldValues>(err: unknown, setError?: UseFormSetError<T>): boolean {
  const e = toApiError(err);
  let applied = false;
  if (setError && e.code === "VALIDATION_ERROR" && e.details.length) {
    for (const d of e.details) {
      if (!d.path) continue;
      const path = d.path.replace(/\[(\d+)\]/g, ".$1");
      setError(path as Path<T>, { type: "server", message: d.message });
      applied = true;
    }
  }
  if (applied) {
    toast.error(e.message || "Please fix the highlighted fields");
  } else {
    const extra = e.details.length ? `: ${e.details.map((d) => `${d.path} ${d.message}`).join(", ")}` : "";
    toast.error(`${e.message}${extra}`);
  }
  return applied;
}
