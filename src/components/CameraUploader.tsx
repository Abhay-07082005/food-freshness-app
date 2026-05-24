import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  UploadCloud,
  AlertCircle,
  Video,
  VideoOff,
  SwitchCamera,
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";
import { compressImage } from "../utils/imageCompressor";

interface CameraUploaderProps {
  onImageCaptured: (base64: string, mimeType: string) => void;
  isLoading: boolean;
}

export default function CameraUploader({
  onImageCaptured,
  isLoading,
}: CameraUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] =
    useState<string | null>(null);

  const [facingMode, setFacingMode] = useState<
    "user" | "environment"
  >("user");

  const [isFlashActive, setIsFlashActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // =========================
  // START CAMERA
  // =========================
  const startCamera = async () => {
    try {
      setCameraPermissionError(null);

      // Browser support check
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraPermissionError(
          "Camera API not supported in this browser."
        );
        return;
      }

      // Stop previous stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        mediaStreamRef.current = null;
      }

      // Reset video
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.load();
      }

      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;

      // Attach stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await new Promise((resolve) => {
          if (!videoRef.current) return resolve(true);

          videoRef.current.onloadedmetadata = () => {
            resolve(true);
          };
        });

        await videoRef.current.play();
      }

      setIsWebcamActive(true);
    } catch (err: any) {
      console.error("Camera start error:", err);

      setCameraPermissionError(
        err?.message || "Unable to access camera."
      );

      setIsWebcamActive(false);
    }
  };

  // =========================
  // STOP CAMERA
  // =========================
  const stopCamera = () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        mediaStreamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();

        videoRef.current.srcObject = null;

        videoRef.current.removeAttribute("src");

        videoRef.current.load();
      }

      setIsWebcamActive(false);
    } catch (err) {
      console.error("Stop camera error:", err);
    }
  };

  // =========================
  // SWITCH CAMERA
  // =========================
  const toggleFacingMode = async () => {
    const newMode =
      facingMode === "user" ? "environment" : "user";

    setFacingMode(newMode);

    try {
      // Stop old stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        mediaStreamRef.current = null;
      }

      // Start new stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.pause();

        videoRef.current.srcObject = null;

        videoRef.current.srcObject = stream;

        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera switch failed:", err);
    }
  };

  // =========================
  // CAPTURE IMAGE
  // =========================
  const captureSnapshot = async () => {
    if (!videoRef.current) return;

    setIsFlashActive(true);

    setTimeout(() => {
      setIsFlashActive(false);
    }, 200);

    try {
      const video = videoRef.current;

      const canvas = document.createElement("canvas");

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;

      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Mirror correction
        if (facingMode === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const rawBase64 = canvas.toDataURL("image/jpeg");

        stopCamera();

        const res = await compressImage(rawBase64);

        onImageCaptured(res.base64, res.mimeType);
      }
    } catch (err) {
      console.error("Capture error:", err);

      setUploadError(
        "Failed to process captured photo."
      );
    }
  };

  // =========================
  // DRAG HANDLERS
  // =========================
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      e.type === "dragenter" ||
      e.type === "dragover"
    ) {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  // =========================
  // DROP IMAGE
  // =========================
  const handleDrop = async (
    e: React.DragEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragActive(false);
    setUploadError(null);

    if (
      e.dataTransfer.files &&
      e.dataTransfer.files[0]
    ) {
      const file = e.dataTransfer.files[0];

      await processSelectedFile(file);
    }
  };

  // =========================
  // FILE CHANGE
  // =========================
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  // =========================
  // PROCESS FILE
  // =========================
  const processSelectedFile = async (
    file: File
  ) => {
    if (!file.type.startsWith("image/")) {
      setUploadError(
        "Invalid image format."
      );
      return;
    }

    try {
      const result = await compressImage(file);

      onImageCaptured(
        result.base64,
        result.mimeType
      );
    } catch (err) {
      console.error("File processing error:", err);

      setUploadError(
        "Failed to process image."
      );
    }
  };

  // =========================
  // FILE PICKER
  // =========================
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-white border border-gray-100 shadow-xl overflow-hidden p-6 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Camera size={18} />
          Freshness Scanner
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => {
              stopCamera();
              setCameraPermissionError(null);
            }}
            className="px-4 py-2 rounded-lg bg-gray-100 text-sm"
          >
            Upload
          </button>

          <button
            onClick={startCamera}
            className="px-4 py-2 rounded-lg bg-black text-white text-sm flex items-center gap-2"
          >
            <Video size={14} />
            Camera
          </button>
        </div>
      </div>

      {/* Errors */}
      {uploadError && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-sm flex gap-2">
          <AlertCircle size={16} />
          {uploadError}
        </div>
      )}

      {cameraPermissionError && (
        <div className="mb-4 bg-yellow-50 text-yellow-700 p-3 rounded-xl text-sm flex gap-2">
          <AlertCircle size={16} />
          {cameraPermissionError}
        </div>
      )}

      {/* Main Area */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 border">
        <AnimatePresence>
          {isFlashActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-50"
            />
          )}
        </AnimatePresence>

        {!isWebcamActive ? (
          <div
            className={`w-full h-full flex flex-col items-center justify-center cursor-pointer transition ${
              isDragActive
                ? "bg-indigo-50"
                : ""
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <UploadCloud
              size={40}
              className="text-indigo-600 mb-4"
            />

            <p className="text-gray-700 text-sm">
              Upload or drag image
            </p>
          </div>
        ) : (
          <div className="relative w-full h-full bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              disablePictureInPicture
              controls={false}
              className={`w-full h-full object-cover ${
                facingMode === "user"
                  ? "scale-x-[-1]"
                  : ""
              }`}
            />

            {/* Controls */}
            <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-4">
              <button
                onClick={toggleFacingMode}
                className="p-3 rounded-full bg-black/70 text-white"
              >
                <SwitchCamera size={18} />
              </button>

              <button
                onClick={captureSnapshot}
                className="w-14 h-14 rounded-full bg-white flex items-center justify-center"
              >
                <div className="w-5 h-5 rounded-full bg-red-600" />
              </button>

              <button
                onClick={stopCamera}
                className="p-3 rounded-full bg-black/70 text-white"
              >
                <VideoOff size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 flex items-center justify-center z-50"
            >
              <div className="text-center">
                <Camera
                  size={30}
                  className="mx-auto mb-3 animate-pulse"
                />

                <p className="text-sm text-gray-700">
                  Analyzing Freshness...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}