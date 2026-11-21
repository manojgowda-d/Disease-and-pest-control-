"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UploadDropzone from "@/components/UploadDropzone";
import ResultsView from "@/components/ResultsView";
import { PredictResponse } from "@/lib/api";
import { useFarmerAuth } from "@/lib/auth-context";
import {
  Sprout,
  ShieldAlert,
  Sparkles,
  User,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function AnalyzePage() {
  const { farmer } = useFarmerAuth();
  const [analysisResult, setAnalysisResult] = useState<PredictResponse | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleAnalysisSuccess = (result: PredictResponse, file: File) => {
    setAnalysisResult(result);
    setUploadedFile(file);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 bg-grid-pattern">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Crop Foliage AI Diagnostic Station
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Upload a clear plant leaf image to detect fungal pathology (ResNet18) and pest infestations (YOLOv8).
            </p>
          </div>

          {/* Farmer Status Pill */}
          {farmer ? (
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-2 text-emerald-800">
              <User className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-bold">{farmer.name}</span>
                <span className="text-emerald-600 block text-[10px]">
                  ID: {farmer.user_id} • Active Grower Session
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              Operating as <strong className="text-slate-700">Guest Grower</strong>.{" "}
              <Link href="/login" className="text-emerald-700 font-semibold underline">
                Log in
              </Link>
            </div>
          )}
        </div>

        {/* Dynamic Display: Dropzone vs Results */}
        {!analysisResult || !uploadedFile ? (
          <div className="space-y-6">
            <UploadDropzone onAnalysisSuccess={handleAnalysisSuccess} />

            {/* Advisory Reminder */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 flex items-start gap-3 shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-700">Photo Capture Best Practices:</strong>
                <p className="mt-0.5">
                  Ensure the leaf is in focus with balanced natural lighting. Fill at least 70% of the camera frame with the leaf surface. Avoid blurry, backlit, or distant field shots for maximum diagnostic accuracy.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ResultsView
            result={analysisResult}
            originalFile={uploadedFile}
            onReset={handleReset}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
