type OptimizeImageOptions = {
  width?: number;
  height?: number;
  quality?: number;
  format?: "auto" | "webp" | "avif";
};

/**
 * Optimizes Cloudinary URLs by injecting transformation params.
 * Falls back to the original URL for non-Cloudinary assets.
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  options: OptimizeImageOptions = {}
): string {
  if (!url) {
    return "";
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  const defaults: Required<OptimizeImageOptions> = {
    width: options.width ?? 1200,
    height: options.height ?? 800,
    quality: options.quality ?? 70,
    format: options.format ?? "auto",
  };

  // Only rewrite Cloudinary URLs.
  if (!trimmed.includes("res.cloudinary.com") && !trimmed.includes("cloudinary.com")) {
    return trimmed;
  }

  const cloudinaryUploadMarker = "/upload/";
  const markerIndex = trimmed.indexOf(cloudinaryUploadMarker);

  if (markerIndex === -1) {
    return trimmed;
  }

  const transformationParts = [
    "f_auto",
    "c_fill",
    `w_${Math.max(1, defaults.width)}`,
    `h_${Math.max(1, defaults.height)}`,
    `q_${Math.min(100, Math.max(1, defaults.quality))}`,
  ];

  if (defaults.format !== "auto") {
    transformationParts[0] = `f_${defaults.format}`;
  }

  const beforeUpload = trimmed.slice(0, markerIndex + cloudinaryUploadMarker.length);
  const afterUpload = trimmed.slice(markerIndex + cloudinaryUploadMarker.length);

  // Avoid stacking transformations when already present.
  if (afterUpload.startsWith("f_") || afterUpload.startsWith("c_")) {
    return trimmed;
  }

  return `${beforeUpload}${transformationParts.join(",")}/${afterUpload}`;
}
