// Authentication error messages
export const AUTH_NETWORK_ERROR_MESSAGE =
  "🚫 Unable to connect to authentication service. Please disable your ad blocker for especially if you are on `localhost` and try again.";

// Helper to detect network errors
export const isNetworkError = (message: string) =>
  message === "Failed to fetch" ||
  message.includes("NetworkError") ||
  message.includes("Network request failed") ||
  message.includes("CORS") ||
  message.toLowerCase().includes("network");
