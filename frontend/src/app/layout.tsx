import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "AI Plant Disease & Pest Detection System | Computer Vision",
  description:
    "An AI-powered agricultural diagnosis platform for real-time plant disease classification (ResNet18) and pest object detection (YOLOv8).",
  keywords: [
    "Plant Disease Detection",
    "Computer Vision",
    "ResNet18",
    "YOLO",
    "Agriculture AI",
    "Pest Detection",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

