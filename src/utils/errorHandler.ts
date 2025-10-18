import { toast } from "sonner";

export type ApiErrorCode = 400 | 401 | 403 | 404 | 500 | 503;

const errorMessages: Record<ApiErrorCode, string> = {
  400: "Invalid request. Please check your input.",
  401: "Session expired. Please log in again.",
  403: "You don't have permission to perform this action.",
  404: "Item not found.",
  500: "Server error. Please try again later.",
  503: "Service temporarily unavailable. Please try again later.",
};

export function handleApiError(error: any) {
  console.error("API Error:", error);

  // Check if it's a network error
  if (!navigator.onLine) {
    toast.error("No internet connection. Please check your network.");
    return;
  }

  // Handle Supabase errors
  if (error?.code) {
    if (error.code === "PGRST301") {
      toast.error("Session expired. Please log in again.");
      // Redirect to login
      window.location.href = "/auth";
      return;
    }
  }

  // Handle HTTP status codes
  const status = error?.response?.status || error?.status;
  if (status && errorMessages[status as ApiErrorCode]) {
    toast.error(errorMessages[status as ApiErrorCode]);
    return;
  }

  // Handle specific error messages
  if (error?.message) {
    toast.error(error.message);
    return;
  }

  // Fallback error message
  toast.error("An unexpected error occurred. Please try again.");
}

export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const attempt = (retryCount: number) => {
      fn()
        .then(resolve)
        .catch((error) => {
          if (retryCount >= maxRetries) {
            reject(error);
            return;
          }

          const backoffDelay = delay * Math.pow(2, retryCount);
          console.log(`Retrying in ${backoffDelay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);

          setTimeout(() => {
            attempt(retryCount + 1);
          }, backoffDelay);
        });
    };

    attempt(0);
  });
}

export function isTransientError(error: any): boolean {
  const transientCodes = [408, 429, 500, 502, 503, 504];
  const status = error?.response?.status || error?.status;
  return transientCodes.includes(status);
}

export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options: {
    retryOnTransient?: boolean;
    maxRetries?: number;
    onError?: (error: any) => void;
  } = {}
): Promise<T | null> {
  const { retryOnTransient = true, maxRetries = 3, onError } = options;

  try {
    if (retryOnTransient) {
      return await retryWithBackoff(apiCall, maxRetries);
    } else {
      return await apiCall();
    }
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      handleApiError(error);
    }
    return null;
  }
}
