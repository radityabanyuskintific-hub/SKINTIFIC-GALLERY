"use client";
import { useState } from "react";
import type { GalleryImage } from "@/lib/gallery-api";

export function PrivateImage({image}: {image: GalleryImage}) {
  const [failed, setFailed] = useState(false);
  if (!image.url || failed) return <span className="image-fallback">Preview unavailable. Open details to download the original.</span>;
  // Keep private signed URLs out of Next's shared image optimizer cache.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={image.url} alt={image.title} width={image.width} height={image.height} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
