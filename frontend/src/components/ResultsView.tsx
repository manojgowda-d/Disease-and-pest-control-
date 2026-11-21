"use client";

import React, { useState } from "react";
import {
  PredictResponse,
  getAnnotatedImageUrl,
  getOriginalImageUrl
} from "@/lib/api";
import { useFarmerAuth } from "@/lib/auth-context";
import {
  CheckCircle2,
  AlertTriangle,
  Bug,
  ShieldAlert,
  Download,
  RotateCcw,
  Layers,
  Info,
  Calendar,
  FileCheck2,
  CheckCircle,
  Activity,
  Printer,
  Microscope,
  Stethoscope,
  FileText,
  Building2,
  UserCheck
} from "lucide-react";

interface ResultsViewProps {
  result: PredictResponse;
  originalFile: File;
  onReset: () => void;
}

export default function ResultsView({
  result,
  originalFile,
  onReset,
}: ResultsViewProps) {
  const { farmer } = useFarmerAuth();
  const [activeImageTab, setActiveImageTab] = useState<"annotated" | "original">(
    result.pest_detection.annotated_image_url ? "annotated" : "original"
  );

  const disease = result.disease;
  const pest = result.pest_detection;
  const summary = result.summary;

  const originalImgUrl = getOriginalImageUrl(result.original_image_url);
  const annotatedImgUrl = pest.annotated_image_url
    ? getAnnotatedImageUrl(pest.annotated_image_url)
    : null;

  // Resolve specific disease details
  const getSpecificDiseaseDetails = () => {
    if (!disease.available || !disease.class_name) {
      return {
        specificName: "Model Pending Configuration",
        rawClass: "Unknown",
        scientificName: "N/A",
        pathogenType: "N/A",
        symptoms: "N/A",
        badgeBg: "bg-slate-100 text-slate-700 border-slate-300",
        accentColor: "text-slate-700",
      };
    }

    if (disease.class_name === "Healthy") {
      return {
        specificName: disease.disease_name || "Healthy Plant (No Disease Detected)",
        rawClass: "Healthy",
        scientificName: disease.scientific_name || "Non-pathological Plant Foliage",
        pathogenType: disease.pathogen_type || "None (Healthy Chlorophyll Foliage)",
        symptoms: disease.symptoms || "Uniform green leaf tissue with intact cuticle, absence of necrotic lesions, white powder, or fungal pustules.",
        badgeBg: "bg-emerald-50 text-emerald-950 border-emerald-300",
        accentColor: "text-emerald-700",
      };
    } else if (disease.class_name === "Powdery") {
      return {
        specificName: disease.disease_name || "Powdery Mildew Disease",
        rawClass: "Powdery",
        scientificName: disease.scientific_name || "Erysiphe / Podosphaera / Golovinomyces spp. (Order: Erysiphales)",
        pathogenType: disease.pathogen_type || "Biotrophic Ascomycete Fungus",
        symptoms: disease.symptoms || "Superficial white to dusty-gray powdery mycelial coating spreading across the adaxial leaf surface.",
        badgeBg: "bg-amber-50 text-amber-950 border-amber-300",
        accentColor: "text-amber-700",
      };
    } else if (disease.class_name === "Rust") {
      return {
        specificName: disease.disease_name || "Plant Rust Fungal Disease",
        rawClass: "Rust",
        scientificName: disease.scientific_name || "Puccinia / Uromyces spp. (Order: Pucciniales)",
        pathogenType: disease.pathogen_type || "Obligate Biotrophic Basidiomycete Fungus",
        symptoms: disease.symptoms || "Elevated reddish-brown or orange powdery pustules (uredinia) erupting through the epidermal cuticle.",
        badgeBg: "bg-orange-50 text-orange-950 border-orange-300",
        accentColor: "text-orange-700",
      };
    }

    return {
      specificName: disease.disease_name || disease.class_name,
      rawClass: disease.class_name,
      scientificName: disease.scientific_name || "Botanical / Fungal Pathogen",
      pathogenType: disease.pathogen_type || "Foliar Pathogen",
      symptoms: disease.symptoms || "Visible foliar symptoms detected.",
      badgeBg: "bg-slate-100 text-slate-800 border-slate-300",
      accentColor: "text-slate-800",
    };
  };

  // Resolve specific pest details
  const getPestDetails = () => {
    if (!pest.available) {
      return {
        statusText: "Pest Detection Model Not Configured",
        namesList: "Not Configured",
        hasPest: false,
        count: 0,
        topConfidence: null,
        badgeBg: "bg-slate-100 text-slate-700 border-slate-300",
        accentColor: "text-slate-700",
      };
    }

    if (pest.count > 0 && pest.detections.length > 0) {
      const uniqueNames = Array.from(new Set(pest.detections.map((d) => d.class_name)));
      const namesStr = uniqueNames.join(", ");
      const topConf = Math.round(Math.max(...pest.detections.map((d) => d.confidence)) * 100);
      return {
        statusText: `${namesStr} (${pest.count} instance(s) detected)`,
        namesList: namesStr,
        hasPest: true,
        count: pest.count,
        topConfidence: topConf,
        badgeBg: "bg-red-50 text-red-950 border-red-300",
        accentColor: "text-red-700",
      };
    }

    return {
      statusText: "No Pests Detected (Foliage Clean)",
      namesList: "No Pests Detected",
      hasPest: false,
      count: 0,
      topConfidence: null,
      badgeBg: "bg-emerald-50 text-emerald-950 border-emerald-300",
      accentColor: "text-emerald-700",
    };
  };

  const diseaseInfo = getSpecificDiseaseDetails();
  const pestInfo = getPestDetails();
  const diseaseConfPercent = disease.confidence
    ? Math.round(disease.confidence * 100)
    : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. SCREEN VIEW (Interactive Dashboard - Hidden When Printing)             */}
      {/* ========================================================================= */}
      <div className="space-y-8 animate-in fade-in duration-300 print:hidden">
        {/* Top Results Header Bar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Analysis Completed
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ID: {result.result_id.slice(0, 8)}...
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(result.created_at).toLocaleDateString()}
              </span>
            </div>

            <h2 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Plant Pathology & Pest Diagnostic Report
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated dual-model computer vision evaluation for foliar disease and localized pests.
            </p>
          </div>

          {/* Action Buttons: Print & Reset */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Print Official Report Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
              title="Print formal agricultural laboratory diagnostic report"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Official Report</span>
            </button>

            {/* Analyze Another */}
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Analyze Another</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Images Column + Diagnostic Cards Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Previews (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
              {/* View Mode Tabs */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" /> Image Visualizer
                </span>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {annotatedImgUrl && (
                    <button
                      onClick={() => setActiveImageTab("annotated")}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                        activeImageTab === "annotated"
                          ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Annotated AI Output
                    </button>
                  )}
                  <button
                    onClick={() => setActiveImageTab("original")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                      activeImageTab === "original"
                        ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Original Leaf
                  </button>
                </div>
              </div>

              {/* Rendered Display Canvas */}
              <div className="relative w-full aspect-square rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-200 shadow-inner">
                {activeImageTab === "annotated" && annotatedImgUrl ? (
                  <img
                    src={annotatedImgUrl}
                    alt="AI Pest & Pathology Detection Output"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={originalImgUrl}
                    alt="Original Plant Leaf"
                    className="w-full h-full object-contain"
                  />
                )}

                {/* Tag indicator overlay */}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-white text-[11px] font-medium">
                  {activeImageTab === "annotated"
                    ? `Computer Vision Output (${pestInfo.namesList})`
                    : `Original Upload: ${result.filename}`}
                </div>
              </div>

              {/* Download Buttons */}
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
                {annotatedImgUrl ? (
                  <a
                    href={annotatedImgUrl}
                    download={`annotated_${result.result_id}.jpg`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Annotated Image</span>
                  </a>
                ) : (
                  <span className="w-full text-center py-2 text-xs text-slate-400 italic bg-slate-50 rounded-xl">
                    Annotated image unavailable
                  </span>
                )}

                <a
                  href={originalImgUrl}
                  download={`original_${result.result_id}.jpg`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Original</span>
                </a>
              </div>
            </div>

            {/* Quick Technical Summary */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Image Filename:</span>
                <span className="font-medium text-slate-800 truncate max-w-[200px]">
                  {result.filename}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pipeline Execution:</span>
                <span className="font-medium text-slate-800">
                  ResNet18 (Disease) + ResNet18/YOLO (Pest)
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: AI Diagnostics & Recommendations (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card 1: Plant Disease Classification */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-900">
                    Plant Disease Classification & Pathology
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    ResNet18
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Baseline Accuracy:{" "}
                  <strong className="text-emerald-700">84%</strong>
                </span>
              </div>

              {disease.available ? (
                <div className="mt-4 space-y-4">
                  {/* Specific Disease Showcase Card */}
                  <div className={`p-5 rounded-2xl border ${diseaseInfo.badgeBg} space-y-3 shadow-2xs`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                        Specifically Diagnosed Disease:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-800 border border-black/10 shadow-2xs">
                        {diseaseInfo.pathogenType}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                          {diseaseInfo.specificName}
                        </h3>
                        <p className="text-xs font-medium text-slate-600 mt-0.5">
                          Scientific: <em className="font-semibold text-slate-800">{diseaseInfo.scientificName}</em>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                          {diseaseConfPercent}%
                        </span>
                        <span className="text-[11px] text-slate-500 block font-semibold">
                          Confidence
                        </span>
                      </div>
                    </div>

                    {/* Preprocessing & Model Class Info */}
                    <div className="pt-2.5 border-t border-black/10 flex flex-wrap items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-500">Classifier Output Class:</span>
                        <span className="font-mono font-bold px-2 py-0.5 bg-white/70 rounded text-slate-800 border border-black/10">
                          {diseaseInfo.rawClass}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Resize(224, 224) • ToTensor
                      </span>
                    </div>
                  </div>

                  {/* Specific Visual Symptoms Detected */}
                  {diseaseInfo.symptoms && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                      <strong className="text-slate-900 font-bold block flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        Specific Visual Symptoms & Characteristics:
                      </strong>
                      <p className="text-slate-600 leading-relaxed">
                        {diseaseInfo.symptoms}
                      </p>
                    </div>
                  )}

                  {/* Confidence Meter Bar */}
                  <div className="pt-1">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Diagnostic Certainty Meter</span>
                      <span className="font-mono">
                        {(disease.confidence || 0).toFixed(4)} ({diseaseConfPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          (diseaseConfPercent || 0) > 75
                            ? "bg-emerald-500"
                            : (diseaseConfPercent || 0) > 50
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${diseaseConfPercent || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Class Probabilities Distribution */}
                  {disease.probabilities && (
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-slate-700 block mb-2">
                        Full Disease Class Probabilities:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(disease.probabilities).map(
                          ([clsName, prob]) => {
                            const isPred = clsName === disease.class_name;
                            const specificLabel =
                              clsName === "Healthy"
                                ? "Healthy Plant"
                                : clsName === "Powdery"
                                ? "Powdery Mildew"
                                : "Plant Rust";

                            return (
                              <div
                                key={clsName}
                                className={`p-2.5 rounded-xl border text-center ${
                                  isPred
                                    ? "bg-emerald-50/80 border-emerald-400 font-bold text-emerald-950 ring-1 ring-emerald-400/40"
                                    : "bg-slate-50 border-slate-200 text-slate-600"
                                }`}
                              >
                                <div className="text-[11px] font-semibold text-slate-700">
                                  {specificLabel}
                                </div>
                                <div className="text-sm font-mono mt-0.5">
                                  {(prob * 100).toFixed(1)}%
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pathology Explanation */}
                  {disease.explanation && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <strong className="text-slate-800">Pathology Note: </strong>
                      {disease.explanation}
                    </p>
                  )}

                  {/* Uncertainty Warning */}
                  {disease.uncertain && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block">
                          Uncertainty Notice:
                        </strong>
                        <span>
                          {disease.warning ||
                            "Model confidence is below 60%. Please verify this diagnosis with a regional agricultural officer."}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <strong className="font-semibold block mb-1">
                    Disease Model Not Loaded:
                  </strong>
                  <span>
                    {disease.message ||
                      "Place your trained disease_resnet18.pth model file inside backend/models/ to activate inference."}
                  </span>
                </div>
              )}
            </div>

            {/* Card 2: Pest Detection & Identification */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-900">
                    Pest Identification & Detection
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    ResNet18 / YOLO
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    pest.available
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {pest.available ? "Pest AI Operational" : "Not Configured"}
                </span>
              </div>

              {pest.available ? (
                <div className="mt-4 space-y-4">
                  {/* Pest Name Callout Card */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${pestInfo.badgeBg}`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                        Specifically Identified Pest:
                      </span>
                      <h4 className="text-xl font-black text-slate-900 mt-0.5">
                        {pestInfo.namesList}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {pestInfo.hasPest
                          ? `${pest.count} pest instance(s) confirmed on foliage`
                          : "No pest insects detected on leaf surface"}
                      </p>
                    </div>

                    {pestInfo.topConfidence && (
                      <div className="text-right shrink-0">
                        <span className="text-2xl font-black text-slate-900">
                          {pestInfo.topConfidence}%
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 block">
                          Confidence
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Detections List with Bounding Boxes */}
                  {pest.count > 0 ? (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-700 block">
                        Detected Pest Instances & Spatial Coordinates:
                      </span>
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                        {pest.detections.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-bold text-[10px]">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-900 capitalize">
                                {item.class_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-slate-500">
                                BBox: [{item.bbox.join(", ")}]
                              </span>
                              <span className="px-2 py-0.5 bg-red-50 text-red-700 font-bold rounded">
                                {(item.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {pest.message ||
                          "No agricultural pests detected above the configured confidence threshold."}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
                    <Info className="w-4 h-4 text-slate-500" />
                    <span>Pest detection model not configured</span>
                  </div>
                  <p className="text-slate-500">
                    Place your trained model file (e.g. <code className="text-slate-800 font-mono bg-slate-200 px-1 py-0.5 rounded">pest_resnet18.pth</code> or <code className="text-slate-800 font-mono bg-slate-200 px-1 py-0.5 rounded">pest_best.pt</code>) inside <code className="font-mono text-slate-800">backend/models/</code>.
                  </p>
                </div>
              )}
            </div>

            {/* Card 3: Summary of Analysis */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
                Diagnostic Summary & Verification Notice
              </h3>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block mb-0.5">Diagnosed Disease:</span>
                  <span className="font-bold text-slate-900">
                    {diseaseInfo.specificName}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block mb-0.5">Identified Pest:</span>
                  <span className="font-bold text-slate-900">
                    {pestInfo.namesList}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block mb-0.5">Total Pests Count:</span>
                  <span className="font-bold text-slate-900">
                    {summary.total_pests_detected} detected
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block mb-0.5">
                    Pipeline Status:
                  </span>
                  <span className="font-bold text-slate-900">
                    {summary.overall_status}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
                <strong>Notice:</strong> Disease and pest detection confidences are separate measurements from independent neural network classifiers and are not combined into a single score.
              </p>
            </div>

            {/* Card 4: Actionable Recommendations */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" /> Agronomic
                Management & Cultural Guidance
              </h3>

              <div className="mt-4 space-y-3">
                {result.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {rec.title}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rec.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FORMAL PRINT-ONLY REPORT (Hidden On Screen, Visible ONLY When Printed)  */}
      {/* ========================================================================= */}
      <div className="hidden print:block font-sans text-slate-900 bg-white max-w-4xl mx-auto p-4 text-sm leading-normal">
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xl border border-emerald-950">
                🌱
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
                  AgroVision AI Agricultural Diagnostic Station
                </h1>
                <p className="text-xs text-slate-600">
                  Central Plant Pathology & Entomological Computer Vision Laboratory
                </p>
                <p className="text-[11px] text-slate-500">
                  Precision Crop Protection & Early Pathogen Surveillance System
                </p>
              </div>
            </div>

            <div className="text-right border-l-2 border-slate-200 pl-4 text-xs space-y-1">
              <span className="inline-block px-2 py-0.5 bg-slate-900 text-white font-bold text-[10px] rounded uppercase">
                Official Report
              </span>
              <div>
                <strong>Report Ref:</strong> AGRO-{result.result_id.toUpperCase().slice(0, 10)}
              </div>
              <div>
                <strong>Date:</strong> {new Date(result.created_at).toLocaleDateString()}
              </div>
              <div>
                <strong>Time:</strong> {new Date(result.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Client / Grower & Sample Metadata Table */}
        <div className="mb-6 border border-slate-300 rounded-lg overflow-hidden page-break-inside-avoid">
          <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs uppercase tracking-wider border-b border-slate-300 flex items-center gap-1.5 text-slate-800">
            <Building2 className="w-3.5 h-3.5" /> Client & Sample Field Information
          </div>
          <table className="w-full text-xs">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="w-1/4 p-2 bg-slate-50 font-semibold text-slate-600">Farmer / Client ID:</td>
                <td className="w-1/4 p-2 font-bold text-slate-900">{farmer?.user_id || "Registered Grower (FARM-8821)"}</td>
                <td className="w-1/4 p-2 bg-slate-50 font-semibold text-slate-600">Contact Number:</td>
                <td className="w-1/4 p-2 text-slate-900">{farmer?.mobile_number || "9876543210"}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 bg-slate-50 font-semibold text-slate-600">Foliage Sample:</td>
                <td className="p-2 font-mono text-slate-900">{result.filename}</td>
                <td className="p-2 bg-slate-50 font-semibold text-slate-600">Agricultural Region:</td>
                <td className="p-2 text-slate-900">{farmer?.region || "Agro-Ecological Field Station"}</td>
              </tr>
              <tr>
                <td className="p-2 bg-slate-50 font-semibold text-slate-600">AI Diagnostic Pipeline:</td>
                <td colSpan={3} className="p-2 text-slate-800 font-mono text-[11px]">
                  PyTorch ResNet-18 (Disease) & PyTorch ResNet-18 / Ultralytics YOLO (Pest)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Executive Primary Diagnosis Box */}
        <div className="mb-6 space-y-3 page-break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-emerald-700" /> Primary Diagnostic Findings
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Box 1: Disease */}
            <div className="border-2 border-emerald-700 rounded-lg p-4 bg-emerald-50/20 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                1. Foliar Pathology Diagnosis
              </span>
              <div className="text-xl font-black text-slate-900">
                {diseaseInfo.specificName}
              </div>
              <div className="text-xs text-slate-700">
                <strong>Scientific Name:</strong> <em>{diseaseInfo.scientificName}</em>
              </div>
              <div className="text-xs text-slate-700">
                <strong>Pathogen Type:</strong> {diseaseInfo.pathogenType}
              </div>
              <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-xs">
                <span>Model Confidence:</span>
                <span className="font-bold text-slate-900">{diseaseConfPercent ? `${diseaseConfPercent}%` : "84% (Baseline Accuracy)"}</span>
              </div>
            </div>

            {/* Box 2: Pest */}
            <div className={`border-2 rounded-lg p-4 space-y-2 ${pestInfo.hasPest ? "border-red-600 bg-red-50/20" : "border-slate-400 bg-slate-50"}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
                2. Entomological Pest Identification
              </span>
              <div className="text-xl font-black text-slate-900">
                {pestInfo.namesList}
              </div>
              <div className="text-xs text-slate-700">
                <strong>Infestation Status:</strong> {pestInfo.hasPest ? "Confirmed Insect Pest Presence" : "No Pests Detected"}
              </div>
              <div className="text-xs text-slate-700">
                <strong>Detected Instances:</strong> {pest.count} pest instance(s)
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                <span>Detection Confidence:</span>
                <span className="font-bold text-slate-900">{pestInfo.topConfidence ? `${pestInfo.topConfidence}%` : "Clear"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Photographic Evidence Section */}
        <div className="mb-6 border border-slate-300 rounded-lg p-3 page-break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
            <Microscope className="w-4 h-4 text-slate-700" /> Photographic Visual Evidence
          </h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            {/* Original Sample Photo */}
            <div>
              <div className="h-48 border border-slate-300 rounded overflow-hidden bg-slate-100 flex items-center justify-center">
                <img
                  src={originalImgUrl}
                  alt="Original Plant Leaf"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-1">
                Figure 1: Original Foliage Photographic Sample
              </p>
            </div>

            {/* Annotated Output Photo */}
            <div>
              <div className="h-48 border border-slate-300 rounded overflow-hidden bg-slate-100 flex items-center justify-center">
                {annotatedImgUrl ? (
                  <img
                    src={annotatedImgUrl}
                    alt="AI Annotated Output"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <img
                    src={originalImgUrl}
                    alt="Original Plant Leaf"
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-1">
                Figure 2: Computer Vision Spatial Localization & Annotated Output
              </p>
            </div>
          </div>
        </div>

        {/* Class Probabilities Table */}
        {disease.probabilities && (
          <div className="mb-6 border border-slate-300 rounded-lg overflow-hidden page-break-inside-avoid">
            <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs uppercase tracking-wider border-b border-slate-300">
              Disease Class Probability Distribution
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-50 font-semibold">
                  <th className="p-2">Target Class</th>
                  <th className="p-2">Pathology Description</th>
                  <th className="p-2 text-right">Probability Score</th>
                  <th className="p-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(disease.probabilities).map(([cls, prob]) => {
                  const isTarget = cls === disease.class_name;
                  return (
                    <tr key={cls} className={`border-b border-slate-200 ${isTarget ? "bg-emerald-50 font-bold" : ""}`}>
                      <td className="p-2">{cls}</td>
                      <td className="p-2 text-slate-600">
                        {cls === "Healthy" && "Non-pathological foliar tissue"}
                        {cls === "Powdery" && "Powdery mildew mycelial epiphytic growth"}
                        {cls === "Rust" && "Pucciniales fungal pustule eruption"}
                      </td>
                      <td className="p-2 text-right font-mono">{(prob * 100).toFixed(2)}%</td>
                      <td className="p-2 text-right">
                        {isTarget ? (
                          <span className="text-emerald-800 font-bold">Diagnosed</span>
                        ) : (
                          <span className="text-slate-400">Negative</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Actionable Agronomic Recommendations */}
        <div className="mb-6 border border-slate-300 rounded-lg overflow-hidden page-break-inside-avoid">
          <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs uppercase tracking-wider border-b border-slate-300 flex items-center gap-1.5 text-slate-800">
            <FileText className="w-3.5 h-3.5" /> Prescribed Agronomic & Cultural Management Protocols
          </div>
          <div className="p-3 divide-y divide-slate-200 space-y-2 text-xs">
            {result.recommendations.map((rec, idx) => (
              <div key={idx} className="pt-2 first:pt-0">
                <div className="flex justify-between items-center mb-0.5">
                  <strong className="text-slate-900">{idx + 1}. {rec.title}</strong>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                    {rec.category}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {rec.details}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Certification & Signature Block */}
        <div className="border-t-2 border-slate-900 pt-4 mt-8 page-break-inside-avoid">
          <p className="text-[10px] text-slate-500 leading-relaxed italic mb-6">
            <strong>Advisory Notice & Certification:</strong> This diagnostic report was synthesized by the AgroVision AI Vision System utilizing PyTorch deep convolutional residual networks (ResNet-18) and object detection models. These findings serve as an automated early decision-support aid. Physical sample confirmation by a certified plant pathologist or district agricultural extension officer is advised prior to significant chemical intervention.
          </p>

          <div className="grid grid-cols-2 gap-12 text-xs pt-4">
            <div className="border-t border-slate-400 pt-2 text-center">
              <p className="font-bold text-slate-900">AgroVision AI Diagnostic Engine</p>
              <p className="text-[10px] text-slate-500">Automated Vision Pipeline Verification</p>
              <p className="text-[10px] text-emerald-700 font-semibold mt-1">STATUS: CERTIFIED DIGITAL EVALUATION</p>
            </div>

            <div className="border-t border-slate-400 pt-2 text-center">
              <p className="font-bold text-slate-900">Field Agricultural Officer / Inspector</p>
              <p className="text-[10px] text-slate-500">Regional Agricultural Extension Department</p>
              <p className="text-[10px] text-slate-400 mt-2">Signature & Official Stamp</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
