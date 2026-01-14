"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
}

export default function ImageUploader({
  images,
  onImagesChange,
  maxImages = 10,
  folder = "bookmyvenue"
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const uploadPromises = files.map(file => uploadImage(file));
      const urls = await Promise.all(uploadPromises);
      onImagesChange([...images, ...urls]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      await handleFiles(files);
    }
  }, [images, maxImages]);

  const removeImage = async (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
            dragActive
              ? 'border-purple-600 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading || images.length >= maxImages}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="image-upload"
          />
          
          <div className="text-center">
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                <p className="text-sm text-gray-600">Uploading images...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-purple-100 p-4">
                  <Upload className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Drag & drop images here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, or WebP (max 10MB) • {images.length}/{maxImages} images
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </motion.div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Uploaded Images ({images.length}/{maxImages})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {images.map((url, index) => (
                <motion.div
                  key={url}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <img
                    src={url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 rounded-full bg-red-600 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Cover Image Badge (first image) */}
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 rounded-full bg-purple-600 px-2 py-1 text-xs font-semibold text-white">
                      Cover
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            💡 Tip: First image will be used as cover image
          </p>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <div className="text-center py-8">
          <div className="rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto mb-3">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}
