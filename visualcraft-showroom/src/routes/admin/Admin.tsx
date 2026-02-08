import React, { useMemo, useState } from "react";
import { SectionTitle } from "../../components/SectionTitle";
import { useAuth } from "../../state/auth";
import { AdminVideos } from "./AdminVideos";
import { AdminGallery } from "./AdminGallery";
import { AdminModels } from "./AdminModels";

type Tab = "videos" | "images" | "models";

export function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("videos");

  const tabs = useMemo(
    () => [
      { k: "videos" as const, label: "Videos" },
      { k: "images" as const, label: "Image Products" },
      { k: "models" as const, label: "3D Models" }
    ],
    []
  );

  return (
    <div className="container-pad py-10">
      <SectionTitle
        title="Admin Panel"
        subtitle="Upload to Firebase Storage and publish content to Firestore. (Admin UID only)"
        right={<div className="badge">{user?.uid}</div>}
      />

      <div className="card p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.k}
              className={tab === t.k ? "btn-primary" : "btn-ghost"}
              onClick={() => setTab(t.k)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {tab === "videos" ? <AdminVideos /> : null}
        {tab === "images" ? <AdminGallery /> : null}
        {tab === "models" ? <AdminModels /> : null}
      </div>
    </div>
  );
}
