import React from "react";
import { UploadCloud, Cpu, FileCheck, ArrowRight, CheckCircle2 } from "lucide-react";

export default function WorkflowSection() {
  const steps = [
    {
      step: "01",
      icon: UploadCloud,
      title: "Upload Foliage Image",
      description:
        "Capture or upload a crisp photograph of the plant leaf or affected foliage in standard JPG, PNG, or WEBP format.",
      tags: ["Drag & Drop", "Size < 10MB", "High-Resolution"],
    },
    {
      step: "02",
      icon: Cpu,
      title: "Dual AI Vision Pipeline",
      description:
        "ResNet18 analyzes cellular pathology for Healthy, Powdery, or Rust classes, while YOLOv8 scans for localized insect pests.",
      tags: ["ResNet18 PyTorch", "YOLOv8 Detection", "Inference Mode"],
    },
    {
      step: "03",
      icon: FileCheck,
      title: "Review Diagnostics & Actions",
      description:
        "Examine disease class probabilities, localized pest bounding boxes, and evidence-backed agronomic cultural guidelines.",
      tags: ["Visual Bounding Boxes", "Probabilities", "Agronomic Care"],
    },
  ];

  return (
    <section id="workflow" className="py-12 bg-white rounded-3xl border border-emerald-100/70 p-6 sm:p-10 shadow-xs">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
          System Architecture Workflow
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          How Computer Vision Diagnoses Your Crops
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Our dual-model pipeline pairs deep residual classification with real-time bounding-box object detection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="relative flex flex-col p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all duration-200 group"
            >
              {/* Header with Step Number & Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-slate-300 group-hover:text-emerald-400 transition-colors">
                  {item.step}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                {item.title}
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed grow">
                {item.description}
              </p>

              {/* Tags */}
              <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
