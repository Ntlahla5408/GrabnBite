export type UserFacingError = {
  title: string;
  message: string;
  actionLabel?: string;
};

type ErrorWithStatus = Error & { status?: number; response?: { status?: number } };

/**
 * Converts technical API/network failures into language suitable for customers,
 * restaurants and drivers. Callers provide the action-specific fallback.
 */
export function getUserFacingError(
  error: unknown,
  fallback: UserFacingError,
): UserFacingError {
  const candidate = error as ErrorWithStatus | null;
  const status = candidate?.status ?? candidate?.response?.status;
  const technicalMessage = candidate?.message?.toLowerCase() ?? "";

  if (
    technicalMessage.includes("network request failed") ||
    technicalMessage.includes("failed to fetch") ||
    technicalMessage.includes("networkerror") ||
    technicalMessage.includes("timeout")
  ) {
    return {
      title: "Connection problem",
      message: "We couldn't connect to GrabnBite. Please check your internet connection and try again.",
      actionLabel: "Try again",
    };
  }

  if (status === 401) {
    return {
      title: "Please sign in again",
      message: "Your session may have expired. Please sign in again to continue.",
    };
  }

  if (status === 403) {
    return {
      title: "You can't complete this action",
      message: "Your account doesn't currently have permission to do this. If you think this is a mistake, please contact GrabnBite support.",
    };
  }

  if (status === 404) {
    return {
      title: "We couldn't find that",
      message: "The information you requested is no longer available. Please refresh the screen and try again.",
      actionLabel: "Try again",
    };
  }

  if (status === 408 || status === 429 || (status !== undefined && status >= 500)) {
    return {
      title: "GrabnBite is having trouble",
      message: "We couldn't complete your request right now. The problem is on our side. Please wait a moment and try again.",
      actionLabel: "Try again",
    };
  }

  // Never display raw server response text or exception details to end users.
  return fallback;
}

export function logAppError(context: string, error: unknown): void {
  // Keep diagnostics in developer logs; never include authentication tokens.
  console.error(`[GrabnBite] ${context}`, error);
}
