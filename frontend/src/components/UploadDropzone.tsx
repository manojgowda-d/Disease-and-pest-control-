"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import {
  UploadCloud,
  FileImage,
  X,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  Eye,
  SlidersHorizontal,
  ChevronRight
} from "lucide-react";
import { analyzePlantImage, PredictResponse } from "@/lib/api";

interface UploadDropzoneProps {
  onAnalysisSuccess: (result: PredictResponse, originalFile: File) => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function UploadDropzone({ onAnalysisSuccess }: UploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);

    // Format validation
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setErrorMsg("Invalid file format. Please upload a JPG, JPEG, PNG, or WEBP image.");
      return false;
    }

    // Size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`);
      return false;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return true;
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMsg("Please select or drop a plant leaf image first.");
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);
    setAnalysisStage("Uploading image to FastAPI server...");

    try {
      // Realistic diagnostic progress stages
      const t1 = setTimeout(() => setAnalysisStage("Running PyTorch ResNet18 Disease Classification..."), 600);
      const t2 = setTimeout(() => setAnalysisStage("Executing Ultralytics YOLOv8 Pest Object Detection..."), 1300);
      const t3 = setTimeout(() => setAnalysisStage("Synthesizing Agronomic Guidance & Report..."), 2000);

      const result = await analyzePlantImage(selectedFile);

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      onAnalysisSuccess(result, selectedFile);
    } catch (err: unknown) {
      let msg = "Failed to analyze image. Please ensure the backend server is running.";
      if (err instanceof Error) {
        if (err.message.toLowerCase().includes("failed to fetch") || err.message.toLowerCase().includes("networkerror")) {
          msg = "Cannot connect to AI Backend (http://localhost:8000). Please start the backend server in terminal: python -m uvicorn app.main:app --app-dir backend --port 8000";
        } else {
          msg = err.message;
        }
      }
      setErrorMsg(msg);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage("");
    }
  };

  // Helper to load sample test images
  const loadSampleImage = async (sampleType: "healthy" | "powdery" | "rust") => {
    try {
      // Create a representative SVG/Canvas test leaf image client-side to test immediately
      const canvas = document.createElement("canvas");
      canvas.width = 448;
      canvas.height = 448;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Base leaf shape & background
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 448, 448);

      // Draw leaf background
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(224, 224, 130, 190, Math.PI / 12, 0, 2 * Math.PI);

      if (sampleType === "healthy") {
        ctx.fillStyle = "#22c55e"; // Lush green
        ctx.fill();
        // Veins
        ctx.strokeStyle = "#15803d";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(224, 400);
        ctx.lineTo(224, 50);
        ctx.stroke();
      } else if (sampleType === "powdery") {
        ctx.fillStyle = "#16a34a";
        ctx.fill();
        // Powdery mildew patches (white/gray fungal spots)
        ctx.fillStyle = "rgba(241, 245, 249, 0.85)";
        ctx.beginPath();
        ctx.arc(180, 160, 38, 0, 2 * Math.PI);
        ctx.arc(260, 220, 45, 0, 2 * Math.PI);
        ctx.arc(190, 290, 32, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        // Rust spots (orange-brown uredinial pustules)
        ctx.fillStyle = "#15803d";
        ctx.fill();
        ctx.fillStyle = "rgba(194, 65, 12, 0.9)";
        for (let i = 0; i < 15; i++) {
          const x = 160 + (i % 4) * 35;
          const y = 140 + Math.floor(i / 4) * 45;
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      ctx.restore();

      // Convert canvas to blob file
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], `sample_${sampleType}_leaf.jpg`, { type: "image/jpeg" });
        validateAndSetFile(file);
      }, "image/jpeg", 0.92);
    } catch (e) {
      console.error("Failed to generate sample image", e);
    }
  };

  return (
    <div className="w-full">
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        id="plant-file-input"
      />

      {/* Main Upload Drop Area */}
      {!previewUrl ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group ${
            dragActive
              ? "border-emerald-500 bg-emerald-50/80 scale-[1.01]"
              : "border-slate-300 hover:border-emerald-400 bg-white hover:bg-slate-50/60"
          }`}
        >
          <div className="max-w-md mx-auto flex flex-col items-center">
            {/* Cloud Icon with animated effect */}
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 group-hover:bg-emerald-100/60 transition-transform shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-800">
              Drag & Drop Plant Leaf Image Here
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              or click anywhere to browse from your computer or mobile camera
            </p>

            <button
              type="button"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <FileImage className="w-4 h-4" />
              <span>Browse Image Files</span>
            </button>

            {/* Supported formats & size info */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                JPG, JPEG, PNG, WEBP
              </span>
              <span>•</span>
              <span>Maximum 10 MB</span>
            </div>
          </div>
        </div>
      ) : (
        /* Image Preview Box */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Preview image */}
            <div className="relative w-full sm:w-56 h-56 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Selected plant preview"
                className="w-full h-full object-contain"
              />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-white text-[10px] rounded backdrop-blur-xs font-mono">
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : ""}
              </span>
            </div>

            {/* File info and Action controls */}
            <div className="flex-1 w-full space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <CheckCircle className="w-3.5 h-3.5" /> Ready for AI Analysis
                  </span>
                </div>
                <h4 className="mt-2 text-base font-bold text-slate-900 truncate">
                  {selectedFile?.name || "Uploaded Image"}
                </h4>
                <p className="text-xs text-slate-500">
                  Image validated. Click “Analyze Plant Image” to initiate ResNet18 disease diagnosis and YOLOv8 pest detection.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing AI Pipeline...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Plant Image</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Replace Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-50"
                  title="Remove selected image"
                >
                  <X className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>

          {/* Loading Progress Bar & Stage Indicator */}
          {isAnalyzing && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {analysisStage}
                </span>
                <span className="text-slate-400">Please wait</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full animate-pulse w-3/4 transition-all duration-500" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message Box */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="font-semibold block mb-0.5">Analysis Notice:</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Quick Test Demo Samples */}
      {!previewUrl && (
        <div className="mt-6 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-200 text-emerald-800 rounded uppercase">
              Quick Test
            </span>
            <span className="text-xs text-slate-700 font-medium">
              Don’t have a plant photo right now? Load a synthetic test leaf:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadSampleImage("healthy")}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100/50 transition-colors shadow-2xs"
            >
              🌿 Healthy Leaf
            </button>
            <button
              type="button"
              onClick={() => loadSampleImage("powdery")}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-amber-200 text-amber-700 hover:bg-amber-100/50 transition-colors shadow-2xs"
            >
              ⚪ Powdery Sample
            </button>
            <button
              type="button"
              onClick={() => loadSampleImage("rust")}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-orange-200 text-orange-700 hover:bg-orange-100/50 transition-colors shadow-2xs"
            >
              🍂 Rust Sample
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
