import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export type UploadProgress = {
  bytesTransferred: number;
  totalBytes: number;
  pct: number;
};

export async function uploadFile(
  path: string,
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<string> {
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

  return await new Promise<string>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        onProgress?.({
          bytesTransferred: snap.bytesTransferred,
          totalBytes: snap.totalBytes,
          pct: snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0
        });
      },
      (err) => reject(err),
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}
