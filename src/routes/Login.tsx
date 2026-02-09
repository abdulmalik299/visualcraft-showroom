import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionTitle } from "../components/SectionTitle";
import { Toast } from "../components/Toast";
import { useAuth } from "../state/auth";
import { isSignInWithEmailLink } from "firebase/auth";
import { auth } from "../lib/firebase";

export function Login() {
  const { user, sendEmailLink } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; text: string; kind: "info" | "ok" | "err" }>({
    open: false,
    text: "",
    kind: "info"
  });

  const submit = useCallback(async () => {
    const e = email.trim();
    if (!e || !e.includes("@")) {
      setToast({ open: true, text: "Enter a valid email address.", kind: "err" });
      return;
    }
    setBusy(true);
    try {
      await sendEmailLink(e);
      setToast({
        open: true,
        text: "Email sent! Open your inbox and click the sign-in link to verify and log in.",
        kind: "ok"
      });
    } catch (err: any) {
      setToast({ open: true, text: err?.message ?? "Failed to send email link.", kind: "err" });
    } finally {
      setBusy(false);
    }
  }, [email, sendEmailLink]);

  // If user opens /login with the link, guide them to finish page.
  const isLink = isSignInWithEmailLink(auth, window.location.href);

  return (
    <div className="container-pad py-10">
      <SectionTitle
        title="Login / Sign up"
        subtitle="Passwordless email-link sign-in (verification via link)."
      />

      {user ? (
        <div className="card p-8">
          <div className="text-sm text-slate-300">You are signed in as:</div>
          <div className="mt-1 text-lg font-extrabold">{user.email ?? "User"}</div>
          <button className="btn-primary mt-5" onClick={() => nav("/")}>Go to Home</button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card p-6">
            <div className="text-sm font-extrabold">Step 1 — request link</div>
            <div className="mt-4 space-y-2">
              <div className="label">Email</div>
              <input
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <button className="btn-primary w-full" onClick={submit} disabled={busy}>
                {busy ? "Sending…" : "Send sign-in link"}
              </button>
              <p className="text-xs text-slate-400">
                We send a secure sign-in link to your email. Clicking it verifies the email and signs you in.
              </p>
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-extrabold">Step 2 — click the link</div>
            <p className="mt-3 text-sm text-slate-300">
              After you click the email link, you’ll be redirected back to this site to finish signing in.
            </p>

            {isLink ? (
              <div className="mt-4 rounded-xl border border-sky-400/30 bg-sky-500/10 p-4 text-sm text-slate-200">
                This looks like a sign-in link. Go to <span className="badge">/finish-signin</span> to complete.
                <div className="mt-3">
                  <button className="btn-primary" onClick={() => nav("/finish-signin")}>Finish Sign-in</button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Waiting for your email link…
              </div>
            )}

            <div className="mt-4 text-xs text-slate-400">
              Pro tip: Add this sender to safe list: <span className="badge">noreply@visualcraft-portfolio-bf4c2.firebaseapp.com</span>
            </div>
          </div>
        </div>
      )}

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
