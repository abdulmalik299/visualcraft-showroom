export type VideoDoc = {
  title: string;
  description: string;
  url: string;
  thumbUrl?: string;
  visible: boolean;
  createdAt?: unknown;
};

export type ModelKind = "3d" | "image";

export type ModelDoc = {
  kind: ModelKind;
  title: string;
  description: string;
  tags: string[];
  category: string;
  isFree: boolean;
  priceUSD?: number;

  // 3D fields
  fileUrl?: string;   // GLB/GLTF
  posterUrl?: string;

  // Image product fields
  imageUrl?: string;

  // Payment links (serverless)
  stripeLink?: string;
  paypalLink?: string;
  payoneerLink?: string;

  visible: boolean;
  createdAt?: unknown;
};
