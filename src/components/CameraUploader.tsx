import React, { useState, useRef, useEffect } from "react";
import { Camera, UploadCloud, RefreshCw, AlertCircle, Video, VideoOff, SwitchCamera } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { compressImage } from "../utils/imageCompressor";

interface CameraUploaderProps {
  onImageCaptured: (base64: string, mimeType: string) => void;
  isLoading: boolean;
}

export default function CameraUploader({ onImageCaptured, isLoading }: CameraUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop active stream whenever webcam active toggled off or component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Attach the stream to the <video> element once it has actually mounted
  useEffect(() => {
    if (activeStream && videoRef.current) {
      videoRef.current.srcObject = activeStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play();
      };
    }
  }, [activeStream, isWebcamActive]);

  const startCamera = async () => {
    stopCamera();
    setCameraPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      console.log(stream.getVideoTracks());
      mediaStreamRef.current = stream;
      setActiveStream(stream);
      setIsWebcamActive(true);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      // Give readable suggestions
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraPermissionError("Camera access denied. Please verify website permissions in your browser bar.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraPermissionError("No camera device found on this system.");
      } else {
        setCameraPermissionError("Could not access camera. Please upload an image instead.");
      }
      setIsWebcamActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActiveStream(null);
    setIsWebcamActive(false);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    // Restart camera with new settings after state updates
    setTimeout(() => {
      if (isWebcamActive) startCamera();
    }, 100);
  };

  const captureSnapshot = async () => {
    if (!videoRef.current) return;
    
    
    // Trigger visual screen flash
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Correct mirror image for front-facing camera
        if (facingMode === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        console.log("Video Width:", video.videoWidth);
console.log("Video Height:", video.videoHeight);
console.log("Video Ready State:", video.readyState);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const rawBase64 = canvas.toDataURL("image/jpeg");
        stopCamera();
        
        // Compress the taken picture
        const res = await compressImage(rawBase64);
        onImageCaptured(res.base64, res.mimeType);
      }
    } catch (err: any) {
      console.error("Snapshot capture or compression error:", err);
      setUploadError("Failed to process captured photo. Please try uploading.");
    }
  };

  // Drag-and-drop actions
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setUploadError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processSelectedFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file: File) => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Invalid file type. Please select a valid image file (PNG, JPG, WebP).");
      return;
    }
    
    try {
      // Compress immediately for super fast full-stack operations
      const result = await compressImage(file);
      onImageCaptured(result.base64, result.mimeType);
    } catch (err: any) {
      console.error("File reading error:", err);
      setUploadError("Error reading image file. Please try again or capture from camera.");
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div id="camera-uploader-container" className="w-full max-w-2xl mx-auto rounded-3xl bg-white border border-gray-100 shadow-xl overflow-hidden p-6 md:p-8">
      {/* Selection Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-5 mb-6 gap-3">
        <div>
          <h2 className="text-xl font-display font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 block">
              <Camera size={18} />
            </span>
            Source Produce Image
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Capture a fresh snapshot or upload an existing photo for immediate AI assessment.
          </p>
        </div>
        
        {/* Toggle options */}
        <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-auto">
          <button
            id="toggle-upload-tab"
            type="button"
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${
              !isWebcamActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
            onClick={() => {
              stopCamera();
              setCameraPermissionError(null);
            }}
            disabled={isLoading}
          >
            File Upload
          </button>
          <button
            id="toggle-webcam-tab"
            type="button"
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 ${
              isWebcamActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
            onClick={startCamera}
            disabled={isLoading}
          >
            <Video size={13} /> Live Camera
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="mb-4 bg-red-50 text-red-700 text-xs px-4 py-3 rounded-xl flex items-start gap-2 border border-red-100">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {cameraPermissionError && isWebcamActive && (
        <div className="mb-4 bg-amber-50 text-amber-800 text-xs px-4 py-3 rounded-xl flex items-start gap-2 border border-amber-100">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{cameraPermissionError}</span>
        </div>
      )}

      {/* Main interactive screen */}
      <div className="relative aspect-video sm:aspect-4/3 rounded-2xl w-full overflow-hidden bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
        {/* Flash Screen Transition */}
        <AnimatePresence>
          {isFlashActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {!isWebcamActive ? (
          /* File uploader workspace */
          <div
            className={`w-full h-full flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
              isDragActive ? "bg-indigo-50/50 scale-[0.99] border-indigo-500" : "hover:bg-gray-100/30"
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
              disabled={isLoading}
            />
            
            <div className="p-4 rounded-full bg-indigo-50 text-indigo-600 mb-4 shadow-sm">
              <UploadCloud size={32} />
            </div>
            
            <p className="font-display font-medium text-gray-800 text-sm md:text-base">
              Drag & drop photo here or <span className="text-indigo-600 underline">browse</span>
            </p>
            <p className="text-gray-400 text-xs mt-1 px-4 text-center">
              Supports JPG, PNG, WebP up to 15MB. Automatically optimized for swift AI processing.
            </p>
          </div>
        ) : (
          /* Webcam Preview & Actions */
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            {cameraPermissionError ? (
              <div className="text-center p-6 text-white max-w-sm flex flex-col items-center">
                <VideoOff size={36} className="text-gray-400 mb-3" />
                <p className="text-xs text-gray-300 antialiased mb-4">{cameraPermissionError}</p>
                <button
                  type="button"
                  className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-lg cursor-pointer transition"
                  onClick={triggerFileInput}
                >
                  Upload File Instead
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                />
                
                {/* Floating controls */}
                <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 px-4 z-40">
                  {/* Switch Camera */}
                  <button
                    type="button"
                    title="Switch Camera Orientation"
                    className="p-3 rounded-full bg-black/60 hover:bg-black/85 border border-white/10 text-white cursor-pointer transition"
                    onClick={toggleFacingMode}
                    disabled={isLoading}
                  >
                    <SwitchCamera size={18} />
                  </button>
                  
                  {/* Photo trigger */}
                  <button
                    id="capture-photo-button"
                    type="button"
                    className="w-14 h-14 rounded-full bg-white text-black font-semibold shadow-lg hover:scale-105 active:scale-95 cursor-pointer transition flex items-center justify-center border-4 border-white/20"
                    onClick={captureSnapshot}
                    disabled={isLoading}
                  >
                    <div className="w-5 h-5 rounded-full bg-red-600" />
                  </button>

                  {/* Disable Webcam View */}
                  <button
                    type="button"
                    title="Stop Video Stream"
                    className="p-3 rounded-full bg-black/60 hover:bg-black/85 border border-white/10 text-white cursor-pointer transition"
                    onClick={stopCamera}
                    disabled={isLoading}
                  >
                    <VideoOff size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="relative flex items-center justify-center w-20 h-20 mb-5">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-pulse" />
                <div className="absolute inset-x-0 inset-y-0 rounded-full border-4 border-t-indigo-600 animate-spin" style={{ animationDuration: "1s" }} />
                <Camera size={26} className="text-indigo-600" />
              </div>
              
              <h3 className="font-display font-semibold text-gray-900 text-lg">
                Inspecting Produce Freshness...
              </h3>
              <p className="text-gray-500 text-xs mt-1.5 max-w-sm leading-relaxed">
                Our horticultural AI model is reading physical contours, skin color bands, bruising, and evaluating remaining shelf-life. Please wait a moment.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-center gap-2 justify-center text-xs text-gray-400 font-medium">
        <span></span>
      </div>
    </div>
  );
}