"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

type SourceType = "upload" | "screen_capture";
type AIProvider = "openai" | "gemini" | "anthropic";
type ModelTier = "tier1" | "tier2" | "tier3";

interface ImageItem {
  file: File;
  preview: string;
  id: string;
}

// Get upload limits from environment variables with sensible defaults
const MAX_IMAGES = parseInt(process.env.NEXT_PUBLIC_MAX_IMAGES || "10", 10);
const MAX_FILE_SIZE =
  parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || "10", 10) * 1024 * 1024;
const MAX_TOTAL_SIZE =
  parseInt(process.env.NEXT_PUBLIC_MAX_TOTAL_SIZE_MB || "50", 10) * 1024 * 1024;

export default function AnalyzePage() {
  const [sourceType, setSourceType] = useState<SourceType>("upload");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<AIProvider[]>([
    "openai",
  ]);
  const [masterProvider, setMasterProvider] = useState<AIProvider>(
    (process.env.NEXT_PUBLIC_DEFAULT_MASTER_PROVIDER as AIProvider) || "openai",
  );
  const [modelTier, setModelTier] = useState<ModelTier>("tier2");
  const [userApiKeys, setUserApiKeys] = useState({
    openai: "",
    anthropic: "",
    gemini: "",
  });
  const [websiteContext, setWebsiteContext] = useState<
    Partial<import("@/lib/ai/types").WebsiteContext>
  >({
    targetAge: [],
    targetGender: "any",
    educationLevel: "any",
    incomeLevel: "any",
    techFriendliness: "any",
    businessSector: [],
  });
  const [sectorInput, setSectorInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
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

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const errors: string[] = [];
      const valid: File[] = [];

      const currentCount = images.length;
      const currentSize = images.reduce((sum, img) => sum + img.file.size, 0);

      const maxFileSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
      const maxTotalSizeMB = Math.round(MAX_TOTAL_SIZE / (1024 * 1024));

      for (const file of files) {
        // Check file type
        if (!file.type.startsWith("image/")) {
          errors.push(`${file.name}: Not an image file`);
          continue;
        }

        // Check individual file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: File size exceeds ${maxFileSizeMB}MB`);
          continue;
        }

        // Check total count
        if (currentCount + valid.length >= MAX_IMAGES) {
          errors.push(`Maximum ${MAX_IMAGES} images allowed`);
          break;
        }

        // Check total size
        const newTotalSize =
          currentSize + valid.reduce((sum, f) => sum + f.size, 0) + file.size;
        if (newTotalSize > MAX_TOTAL_SIZE) {
          errors.push(`Total size exceeds ${maxTotalSizeMB}MB`);
          break;
        }

        valid.push(file);
      }

      return { valid, errors };
    },
    [images],
  );

  const addImages = useCallback(
    async (files: File[]) => {
      const { valid, errors } = validateFiles(files);

      if (errors.length > 0) {
        setError(errors.join(". "));
      } else {
        setError("");
      }

      if (valid.length === 0) return;

      // Create preview URLs for valid files
      const newImages: ImageItem[] = await Promise.all(
        valid.map(
          (file) =>
            new Promise<ImageItem>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                resolve({
                  file,
                  preview: e.target?.result as string,
                  id: generateId(),
                });
              };
              reader.readAsDataURL(file);
            }),
        ),
      );

      setImages((prev) => [...prev, ...newImages]);
      setSourceType("upload");
    },
    [validateFiles],
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      addImages(files);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addImages(files);
    }
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setError("");
  }

  function clearAllImages() {
    setImages([]);
    setError("");
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

      const file = new File([blob], `screenshot-${Date.now()}.png`, {
        type: "image/png",
      });

      // Validate the captured image
      const { valid, errors } = validateFiles([file]);
      if (errors.length > 0) {
        setError(errors.join(". "));
        return;
      }

      if (valid.length > 0) {
        const preview = canvas.toDataURL("image/png");
        setImages((prev) => [
          ...prev,
          { file: valid[0], preview, id: generateId() },
        ]);
        setSourceType("screen_capture");
      }
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

  // Website context helpers
  const toggleAgeGroup = (
    age: "kids" | "teenagers" | "middle_age" | "elderly",
  ) => {
    const currentAges = websiteContext.targetAge || [];
    const newAges = currentAges.includes(age)
      ? currentAges.filter((a) => a !== age)
      : [...currentAges, age];
    setWebsiteContext({ ...websiteContext, targetAge: newAges });
  };

  const handleSectorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && sectorInput.trim()) {
      e.preventDefault();
      const currentSectors = websiteContext.businessSector || [];
      if (!currentSectors.includes(sectorInput.trim())) {
        setWebsiteContext({
          ...websiteContext,
          businessSector: [...currentSectors, sectorInput.trim()],
        });
      }
      setSectorInput("");
    }
  };

  const removeSector = (sector: string) => {
    setWebsiteContext({
      ...websiteContext,
      businessSector: (websiteContext.businessSector || []).filter(
        (s) => s !== sector,
      ),
    });
  };

  async function handleAnalyze() {
    if (images.length === 0) {
      setError("Please upload or capture at least one image");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setUploadProgress("Preparing...");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Upload all images
      const imagePaths: string[] = [];
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(`Uploading image ${i + 1} of ${images.length}...`);

        const image = images[i];
        const fileName = `${user.id}/${Date.now()}-${i}-${image.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("analysis-images")
          .upload(fileName, image.file);

        if (uploadError) {
          throw new Error(
            `Failed to upload image ${i + 1}: ${uploadError.message}`,
          );
        }

        imagePaths.push(fileName);
      }

      setUploadProgress("Creating analysis...");

      // Create analysis record with multiple images
      const { data: analysis, error: insertError } = await supabase
        .from("analyses")
        .insert({
          user_id: user.id,
          source_type: sourceType,
          image_paths: imagePaths,
          image_count: imagePaths.length,
          providers_used: selectedProviders,
          master_provider: masterProvider,
          model_tier: modelTier,
          website_context:
            websiteContext.targetAge?.length! > 0 ||
            websiteContext.businessSector?.length! > 0 ||
            websiteContext.additionalContext
              ? websiteContext
              : null,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        throw new Error("Failed to create analysis: " + insertError.message);
      }

      setUploadProgress("Starting analysis...");

      // Trigger analysis via API with optional user keys
      const hasUserKeys = !!(
        userApiKeys.openai ||
        userApiKeys.anthropic ||
        userApiKeys.gemini
      );
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: analysis.id,
          ...(hasUserKeys && {
            userApiKeys: {
              ...(userApiKeys.openai && { openai: userApiKeys.openai }),
              ...(userApiKeys.anthropic && {
                anthropic: userApiKeys.anthropic,
              }),
              ...(userApiKeys.gemini && { gemini: userApiKeys.gemini }),
            },
          }),
        }),
      });

      console.log("[Client] API response status:", response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error("[Client] API error:", data);
        throw new Error(data.error || "Failed to start analysis");
      }

      // Redirect to results page where user can watch progress
      router.push(`/dashboard/results/${analysis.id}`);
    } catch (err) {
      console.error("[Client] Error in handleAnalyze:", err);
      setError((err as Error).message);
      setIsAnalyzing(false);
      setUploadProgress("");
    }
  }

  const totalSize = images.reduce((sum, img) => sum + img.file.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo />
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">1. Add your designs</h2>
            {images.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-muted">
                <span>
                  {images.length}/{MAX_IMAGES} images ({formatSize(totalSize)})
                </span>
                <button
                  onClick={clearAllImages}
                  className="text-error hover:text-error/80 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Upload Zone - always visible when under limit */}
          {images.length < MAX_IMAGES && (
            <div className="flex flex-col md:flex-row gap-4 mb-6">
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
                <p className="font-medium mb-1">Upload images</p>
                <p className="text-sm text-muted">
                  Drag & drop or click to browse (up to {MAX_IMAGES} images)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
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
          )}

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative group aspect-video bg-surface-light rounded-lg overflow-hidden"
                >
                  <img
                    src={image.preview}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Image index badge */}
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  {/* Remove button */}
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error"
                  >
                    ✕
                  </button>
                  {/* File info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                    {image.file.name} ({formatSize(image.file.size)})
                  </div>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && (
            <p className="text-center text-muted text-sm">
              No images added yet. Upload or capture screenshots to analyze.
            </p>
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

        {/* Model Tier Selection */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-semibold mb-4">
            3. Select Model Quality Tier
          </h2>
          <p className="text-muted text-sm mb-6">
            Choose the quality/cost balance for your analysis.
          </p>

          <div className="space-y-3">
            {[
              {
                id: "tier1" as ModelTier,
                name: "Budget (Cheapest)",
                description: "Fastest and most affordable",
              },
              {
                id: "tier2" as ModelTier,
                name: "Balanced (Moderate)",
                description: "Best cost-to-quality ratio",
              },
              {
                id: "tier3" as ModelTier,
                name: "Premium (Best Quality)",
                description: "Highest quality outcomes",
              },
            ].map((tier) => (
              <label
                key={tier.id}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                  modelTier === tier.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-border"
                }`}
              >
                <input
                  type="radio"
                  name="modelTier"
                  checked={modelTier === tier.id}
                  onChange={() => setModelTier(tier.id)}
                  className="w-5 h-5 accent-primary"
                />
                <div className="flex-1">
                  <p className="font-medium">{tier.name}</p>
                  <p className="text-sm text-muted">{tier.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* User API Keys (Optional) */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-semibold mb-4">4. API Keys (Optional)</h2>
          <p className="text-muted text-sm mb-6">
            Want to use your own API keys? Provide them here. They will be sent
            directly to the AI providers and not stored.
          </p>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm">
                <p className="font-medium mb-1">Privacy & Security</p>
                <ul className="text-muted space-y-1">
                  <li>
                    • Your keys are sent directly to AI providers (OpenAI,
                    Anthropic, Google)
                  </li>
                  <li>• We do not store or log your API keys</li>
                  <li>• Keys are only used for this single analysis</li>
                  <li>• If not provided, we'll use our server keys instead</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* OpenAI API Key */}
            <div>
              <label className="block text-sm font-medium mb-2">
                OpenAI API Key
                <span className="text-muted font-normal ml-2">(optional)</span>
              </label>
              <input
                type="password"
                placeholder="sk-..."
                value={userApiKeys.openai}
                onChange={(e) =>
                  setUserApiKeys({ ...userApiKeys, openai: e.target.value })
                }
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary transition-colors font-mono text-sm"
              />
            </div>

            {/* Anthropic API Key */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Anthropic API Key
                <span className="text-muted font-normal ml-2">(optional)</span>
              </label>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={userApiKeys.anthropic}
                onChange={(e) =>
                  setUserApiKeys({ ...userApiKeys, anthropic: e.target.value })
                }
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary transition-colors font-mono text-sm"
              />
            </div>

            {/* Gemini API Key */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Google Gemini API Key
                <span className="text-muted font-normal ml-2">(optional)</span>
              </label>
              <input
                type="password"
                placeholder="AI..."
                value={userApiKeys.gemini}
                onChange={(e) =>
                  setUserApiKeys({ ...userApiKeys, gemini: e.target.value })
                }
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary transition-colors font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Website Context (Optional but Recommended) */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-semibold mb-4">
            5. Website Context (Optional but Recommended)
          </h2>
          <p className="text-muted text-sm mb-6">
            Help us provide more targeted feedback by describing your website
            and target audience. This information enhances the AI's
            understanding of your specific use case.
          </p>

          <div className="space-y-6">
            {/* Target Age Groups */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Age Groups
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "kids", label: "Kids" },
                  { id: "teenagers", label: "Teenagers" },
                  { id: "middle_age", label: "Middle Age" },
                  { id: "elderly", label: "Elderly" },
                ].map((age) => (
                  <button
                    key={age.id}
                    type="button"
                    onClick={() =>
                      toggleAgeGroup(
                        age.id as
                          | "kids"
                          | "teenagers"
                          | "middle_age"
                          | "elderly",
                      )
                    }
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      websiteContext.targetAge?.includes(
                        age.id as
                          | "kids"
                          | "teenagers"
                          | "middle_age"
                          | "elderly",
                      )
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {age.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Business Sector Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Business Sector/Industry
              </label>
              <input
                type="text"
                value={sectorInput}
                onChange={(e) => setSectorInput(e.target.value)}
                onKeyDown={handleSectorKeyDown}
                placeholder="Type and press Enter to add (e.g., fintech, ecommerce, healthcare)"
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary transition-colors text-sm"
              />
              {websiteContext.businessSector &&
                websiteContext.businessSector.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {websiteContext.businessSector.map((sector) => (
                      <span
                        key={sector}
                        className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-2"
                      >
                        {sector}
                        <button
                          type="button"
                          onClick={() => removeSector(sector)}
                          className="hover:text-error transition-colors"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
            </div>

            {/* Additional Context */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Context
              </label>
              <textarea
                value={websiteContext.additionalContext || ""}
                onChange={(e) =>
                  setWebsiteContext({
                    ...websiteContext,
                    additionalContext: e.target.value,
                  })
                }
                placeholder="Any other relevant information about your website, target users, or specific concerns..."
                rows={4}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary transition-colors resize-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Multi-image info */}
        {images.length > 1 && (
          <div className="bg-primary/10 border border-primary/20 px-4 py-3 rounded-lg mb-6">
            <p className="text-sm">
              <strong>Multi-image analysis:</strong> All {images.length} images
              will be analyzed together. You&apos;ll receive both individual
              feedback for each image and an overall analysis of common
              patterns.
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleAnalyze}
          disabled={images.length === 0 || isAnalyzing}
          className="w-full btn-primary py-4 rounded-xl text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {uploadProgress || "Analyzing..."}
            </span>
          ) : (
            <>
              Start Analysis
              {images.length > 0 && (
                <span className="ml-2 opacity-75">
                  ({images.length} image{images.length !== 1 ? "s" : ""})
                </span>
              )}
            </>
          )}
        </button>
      </main>
    </div>
  );
}
