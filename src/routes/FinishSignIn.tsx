import React, { useEffect, useState } from "react";
import { useAuth } from "../state/auth";
import { SectionTitle } from "../components/SectionTitle";
import { Toast } from "../components/Toast";
import { useNavigate } from "react-router-dom";
import { signInWithEmailLink, isSignInWithEmailLink } from "firebase/auth";
import { auth } from "../lib/firebase";

export function FinishSignIn() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState(window.localStorage.getItem("vc_emailForSignIn") ?? "");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; text: string; kind: "info" | "ok" | "err" }>({
    open: false,
    text: "",
    kind: "info"
  });

  useEffect(() => {
    if (user) nav("/", { replace: true });
  }, [user, nav]);

  async function finish() {
    const href = window.location.href;
    if (!isSignInWithEmailLink(auth, href)) {
      setToast({ open: true, text: "This page must be opened from the sign-in email link.", kind: "err" });
      return;
    }
    const e = email.trim();
    if (!e || !e.includes("@")) {
      setToast({ open: true, text: "Enter the same email you used to request the sign-in link.", kind: "err" });
      return;
    }
    setBusy(true);
    try {
      await signInWithEmailLink(auth, e, href);
      window.localStorage.removeItem("vc_emailForSignIn");
      setToast({ open: true, text: "Signed in successfully!", kind: "ok" });
      nav("/", { replace: true });
    } catch (err: any) {
      setToast({ open: true, text: err?.message ?? "Failed to finish sign-in.", kind: "err" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-pad py-10">
      <SectionTitle
        title="Finish sign-in"
        subtitle="Complete email-link verification and sign-in."
      />

      <div className="card p-6 max-w-xl">
        <div className="label">Email used</div>
        <input className="input mt-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <button className="btn-primary mt-4 w-full" onClick={finish} disabled={busy}>
          {busy ? "Finishing…" : "Finish sign-in"}
        </button>
        <p className="mt-3 text-xs text-slate-400">
          Security: if you opened the link on a different device, we ask for your email again to confirm it’s you.
        </p>
      </div>

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
