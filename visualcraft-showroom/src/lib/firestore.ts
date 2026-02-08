import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  getDocs,
  where
} from "firebase/firestore";
import { db } from "./firebase";
import type { ModelDoc, VideoDoc } from "./types";

export const colVideos = collection(db, "videos");
export const colModels = collection(db, "models");

export async function listVisibleVideos() {
  const q = query(colVideos, where("visible", "==", true), orderBy("createdAt", "desc"), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as VideoDoc) }));
}

export async function listVisibleModels() {
  const q = query(colModels, where("visible", "==", true), orderBy("createdAt", "desc"), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ModelDoc) }));
}

export async function getModelById(id: string) {
  const ref = doc(db, "models", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as ModelDoc;
  if (!data.visible) return null;
  return { id: snap.id, ...data };
}

// Admin helpers
export async function adminCreateVideo(data: VideoDoc) {
  const ref = await addDoc(colVideos, data);
  return ref.id;
}

export async function adminUpdateVideo(id: string, patch: Partial<VideoDoc>) {
  await updateDoc(doc(db, "videos", id), patch);
}

export async function adminDeleteVideo(id: string) {
  await deleteDoc(doc(db, "videos", id));
}

export async function adminCreateModel(data: ModelDoc) {
  const ref = await addDoc(colModels, data);
  return ref.id;
}

export async function adminUpdateModel(id: string, patch: Partial<ModelDoc>) {
  await updateDoc(doc(db, "models", id), patch);
}

export async function adminDeleteModel(id: string) {
  await deleteDoc(doc(db, "models", id));
}
