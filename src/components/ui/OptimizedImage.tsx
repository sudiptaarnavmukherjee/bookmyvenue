"use client";

import Image from "next/image";
import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  objectFit?: "cover" | "contain" | "fill" | "none";
  onClick?: () => void;
}

// Blur placeholder for loading state
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f0f0f0" offset="20%" />
      <stop stop-color="#e0e0e0" offset="50%" />
      <stop stop-color="#f0f0f0" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f0f0f0" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

// Fallback image for errors
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EImage not available%3C/text%3E%3C/svg%3E";

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  priority = false,
  sizes,
  quality = 75,
  objectFit = "cover",
  onClick,
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Handle invalid or empty src
  const imageSrc = !src || src.trim() === "" || error ? FALLBACK_IMAGE : src;

  // Default sizes for responsive images
  const defaultSizes = fill
    ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    : undefined;

  const imageStyle = {
    objectFit,
    transition: "opacity 0.3s ease-in-out",
    opacity: loaded ? 1 : 0,
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={
        !fill && width && height
          ? { width, height }
          : fill
          ? { position: "relative" as const, width: "100%", height: "100%" }
          : undefined
      }
      onClick={onClick}
    >
      {/* Shimmer placeholder */}
      {!loaded && (
        <div
          className="absolute inset-0 bg-gray-100 animate-pulse"
          style={{ zIndex: 1 }}
        />
      )}

      <Image
        src={imageSrc}
        alt={alt}
        {...(fill
          ? { fill: true }
          : { width: width || 400, height: height || 300 })}
        sizes={sizes || defaultSizes}
        quality={quality}
        priority={priority}
        placeholder="blur"
        blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(width || 400, height || 300))}`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        style={imageStyle}
        className={fill ? "object-cover" : ""}
      />
    </div>
  );
}

// Thumbnail component for gallery
export function ThumbnailImage({
  src,
  alt,
  isSelected,
  onClick,
}: {
  src: string;
  alt: string;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
        isSelected
          ? "border-pink-500 ring-2 ring-pink-300"
          : "border-transparent hover:border-gray-300"
      }`}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="80px"
        quality={60}
      />
    </button>
  );
}

// Hero image with gradient overlay
export function HeroImage({
  src,
  alt,
  className = "",
  gradient = true,
}: {
  src: string;
  alt: string;
  className?: string;
  gradient?: boolean;
}) {
  return (
    <div className={`relative w-full h-full ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority
        sizes="100vw"
        quality={85}
      />
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      )}
    </div>
  );
}

// Card image with aspect ratio
export function CardImage({
  src,
  alt,
  aspectRatio = "4/3",
  className = "",
}: {
  src: string;
  alt: string;
  aspectRatio?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        quality={75}
      />
    </div>
  );
}
