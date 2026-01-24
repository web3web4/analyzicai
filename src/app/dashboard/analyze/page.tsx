"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type SourceType = "upload" | "screen_capture";
type AIProvider = "openai" | "gemini" | "anthropic";

export default function AnalyzePage() {
  const [sourceType, setSourceType] = useState<SourceType>("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<AIProvider[]>([
    "openai",
  ]);
  const [masterProvider, setMasterProvider] = useState<AIProvider>(
    (process.env.NEXT_PUBLIC_DEFAULT_MASTER_PROVIDER as AIProvider) || "openai",
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const providers: { id: AIProvider; name: string; description: string }[] = [
    {
      id: "openai",
      name: "OpenAI GPT",
      description: "Best for detailed observations",
    },
    {
      id: "gemini",
      name: "Gemini Pro Vision",
      description: "Great for visual patterns",
    },
    {
      id: "anthropic",
      name: "Claude 3 Sonnet",
      description: "Excellent for accessibility",
    },
  ];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }
      setError("");
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileChange({
          target: input,
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  }

  async function captureScreen() {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" } as MediaTrackConstraints,
        audio: false,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      // Wait a moment for video to be ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);

      // Stop all tracks
      stream.getTracks().forEach((track) => track.stop());

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/png");
      });

      const file = new File([blob], "screenshot.png", { type: "image/png" });
      setImageFile(file);
      setImagePreview(canvas.toDataURL("image/png"));
      setSourceType("screen_capture");
    } catch (err) {
      if ((err as Error).name !== "NotAllowedError") {
        setError("Failed to capture screen. Please try again.");
      }
    }
  }

  function toggleProvider(providerId: AIProvider) {
    setSelectedProviders((prev) => {
      if (prev.includes(providerId)) {
        // Don't allow deselecting the master provider or last provider
        if (providerId === masterProvider || prev.length === 1) {
          return prev;
        }
        return prev.filter((p) => p !== providerId);
      } else {
        return [...prev, providerId];
      }
    });
  }

  function handleMasterChange(providerId: AIProvider) {
    setMasterProvider(providerId);
    // Ensure master is in selected providers
    if (!selectedProviders.includes(providerId)) {
      setSelectedProviders((prev) => [...prev, providerId]);
    }
  }

  async function handleAnalyze() {
    if (!imageFile) {
      setError("Please upload or capture an image first");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Upload image
      const fileName = `${user.id}/${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("analysis-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        throw new Error("Failed to upload image");
      }

      // Create analysis record
      const { data: analysis, error: insertError } = await supabase
        .from("analyses")
        .insert({
          user_id: user.id,
          source_type: sourceType,
          image_path: fileName,
          providers_used: selectedProviders,
          master_provider: masterProvider,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        throw new Error("Failed to create analysis");
      }

      // Trigger analysis via API
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: analysis.id }),
      });

      console.log("[Client] API response status:", response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error("[Client] API error:", data);
        throw new Error(data.error || "Failed to start analysis");
      }

      const responseData = await response.json();

      // Redirect to results page where user can watch progress
      router.push(`/dashboard/results/${analysis.id}`);
    } catch (err) {
      console.error("[Client] Error in handleAnalyze:", err);
      setError((err as Error).message);
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="font-semibold">UXicAI</span>
          </Link>

          <Link
            href="/dashboard"
            className="text-muted hover:text-foreground transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">New Analysis</h1>

        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Image Input */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-semibold mb-4">1. Add your design</h2>

          {!imagePreview ? (
            <div className="flex flex-col md:flex-row gap-4">
              {/* Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex-1 border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📁</span>
                </div>
                <p className="font-medium mb-1">Upload an image</p>
                <p className="text-sm text-muted">
                  Drag & drop or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Screen Capture */}
              <button
                onClick={captureScreen}
                className="flex-1 border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📷</span>
                </div>
                <p className="font-medium mb-1">Capture screen</p>
                <p className="text-sm text-muted">
                  Share your screen or window
                </p>
              </button>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-96 mx-auto rounded-lg"
              />
              <button
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-error/20 transition-colors"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Provider Selection */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-semibold mb-4">2. Select AI providers</h2>
          <p className="text-muted text-sm mb-6">
            Choose which AI models to use. More providers = better analysis.
          </p>

          <div className="space-y-3">
            {providers.map((provider) => (
              <label
                key={provider.id}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                  selectedProviders.includes(provider.id)
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-border"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedProviders.includes(provider.id)}
                  onChange={() => toggleProvider(provider.id)}
                  className="w-5 h-5 rounded accent-primary"
                />
                <div className="flex-1">
                  <p className="font-medium">{provider.name}</p>
                  <p className="text-sm text-muted">{provider.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Master:</span>
                  <input
                    type="radio"
                    name="master"
                    checked={masterProvider === provider.id}
                    onChange={() => handleMasterChange(provider.id)}
                    className="w-4 h-4 accent-primary"
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleAnalyze}
          disabled={!imageFile || isAnalyzing}
          className="w-full btn-primary py-4 rounded-xl text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            "Start Analysis"
          )}
        </button>
      </main>
    </div>
  );
}
