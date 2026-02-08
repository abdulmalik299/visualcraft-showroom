export const ADMIN_UID = "DHmPOZd7wzUn0565vhkVZDcoyum2";

// For email-link sign-in. You can override in Vercel/CI/etc.
// For GitHub Pages, this defaults to window.location.origin + BASE_URL.
export const APP_URL =
  (import.meta.env.VITE_APP_URL as string | undefined) ?? "";
