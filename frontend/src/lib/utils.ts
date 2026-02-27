import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNGN(amount: number | bigint): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(timestamp: number | bigint): string {
  const ms = typeof timestamp === "bigint" ? Number(timestamp) / 1_000_000 : timestamp;
  if (!ms || ms === 0) return "N/A";
  return new Date(ms).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTimestamp(timestamp: number | bigint): string {
  const ms = typeof timestamp === "bigint" ? Number(timestamp) / 1_000_000 : timestamp;
  if (!ms || ms === 0) return "N/A";
  return new Date(ms).toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function detectDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

export const SERVICE_UNAVAILABLE_MSG = "Service temporarily unavailable. Please try again shortly.";

export function isCanisterStoppedError(error: unknown): boolean {
  if (!error) return false;

  // Check string representation
  const errStr = String(error);
  if (
    errStr.includes("IC0508") ||
    errStr.includes("is stopped") ||
    errStr.includes("non_replicated_rejection") ||
    errStr.includes("Canister is stopped") ||
    errStr.includes("canister is stopped") ||
    errStr.includes("reject_code: 5") ||
    errStr.includes("reject_code:5") ||
    errStr.includes("RejectCode.DestinationInvalid")
  ) {
    return true;
  }

  // Check JSON stringified version
  try {
    const jsonStr = JSON.stringify(error);
    if (
      jsonStr.includes("IC0508") ||
      jsonStr.includes("is stopped") ||
      jsonStr.includes("non_replicated_rejection") ||
      jsonStr.includes("reject_code") ||
      jsonStr.includes("DestinationInvalid")
    ) {
      return true;
    }
  } catch {
    // ignore
  }

  // Check error object properties
  if (typeof error === "object" && error !== null) {
    const errObj = error as Record<string, unknown>;

    // Check reject_code === 5
    if (errObj.reject_code === 5 || errObj.reject_code === BigInt(5)) return true;

    // Check nested message
    if (typeof errObj.message === "string") {
      const msg = errObj.message;
      if (
        msg.includes("IC0508") ||
        msg.includes("is stopped") ||
        msg.includes("non_replicated_rejection") ||
        msg.includes("DestinationInvalid")
      ) {
        return true;
      }
    }

    // Check error_code
    if (typeof errObj.error_code === "string" && errObj.error_code.includes("IC0508")) return true;

    // Check code property
    if (errObj.code === "IC0508") return true;
  }

  return false;
}
