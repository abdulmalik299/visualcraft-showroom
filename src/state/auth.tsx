import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  User
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { ADMIN_UID, APP_URL } from "../lib/constants";

type AuthState = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  sendEmailLink: (email: string) => Promise<void>;
  finishEmailLinkSignInIfNeeded: () => Promise<"done" | "not-a-link" | "missing-email">;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

function getContinueUrl() {
  // For GitHub Pages project sites, keep base path.
  const base = import.meta.env.BASE_URL;
  const origin = window.location.origin;
  const fallback = origin + base;
  const configured = APP_URL ? APP_URL : fallback;
  // Always finish on /finish-signin route
  const u = new URL(configured);
  u.pathname = (u.pathname.endsWith("/") ? u.pathname.slice(0, -1) : u.pathname) + "/finish-signin";
  return u.toString();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const isAdmin = !!user && user.uid === ADMIN_UID;

  async function sendEmailLink(email: string) {
    const continueUrl = getContinueUrl();
    const actionCodeSettings = {
      url: continueUrl,
      handleCodeInApp: true
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem("vc_emailForSignIn", email);
  }

  async function finishEmailLinkSignInIfNeeded() {
    const href = window.location.href;
    if (!isSignInWithEmailLink(auth, href)) return "not-a-link";
    let email = window.localStorage.getItem("vc_emailForSignIn");
    if (!email) {
      // no OTP, so we ask the user to type email they used
      return "missing-email";
    }
    await signInWithEmailLink(auth, email, href);
    window.localStorage.removeItem("vc_emailForSignIn");
    return "done";
  }

  async function logout() {
    await signOut(auth);
  }

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isAdmin,
      sendEmailLink,
      finishEmailLinkSignInIfNeeded,
      logout
    }),
    [user, loading, isAdmin]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
