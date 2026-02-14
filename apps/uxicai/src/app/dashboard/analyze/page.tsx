"use client";

import { createBrowserClient, useApiKeyAccess } from "@web3web4/shared-platform";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MultiSelectButtonGroup, ApiKeysPromptCard } from "@web3web4/shared-platform";
import { BusinessSectorSelector } from "@web3web4/ai-ui-library";
import { getProviderTierOptions, ModelTierConfig } from "@web3web4/ai-core/model-tiers";
import { getModelConfig } from "@/lib/config/models";
import { NoApiKeysPrompt } from "@web3web4/shared-platform/components";

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
    "anthropic", // Only Anthropic selected by default (user has active subscription)
  ]);
  const [masterProvider, setMasterProvider] = useState<AIProvider>(
    (process.env.NEXT_PUBLIC_DEFAULT_MASTER_PROVIDER as AIProvider) ||
      "anthropic",
  );
  const [modelTier, setModelTier] = useState<ModelTier>("tier1");
  const [modelConfig, setModelConfig] = useState<ModelTierConfig | null>(null);

  // Per-provider model tiers (new)
  const [providerModelTiers, setProviderModelTiers] = useState<
    Record<AIProvider, ModelTier>
  >({
    openai: "tier1",
    gemini: "tier1",
    anthropic: "tier1",
  });
  const [websiteContext, setWebsiteContext] = useState<
    Partial<import("@web3web4/ai-core").WebsiteContext>
  >({
    targetAge: [],
    targetGender: [],
    educationLevel: [],
    incomeLevel: [],
    techFriendliness: [],
    businessSector: [],
  });
  const [sectorInput, setSectorInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { hasAccess, isLoading: checkingAccess } = useApiKeyAccess();

  // Load model configuration from database on mount
  useEffect(() => {
    getModelConfig()
      .then(setModelConfig)
      .catch((err) => {
        console.error("Failed to load model config:", err);
        setError("Failed to load model configuration. Please refresh the page.");
      });
  }, []);

  // Helper function (not a hook, can be anywhere)
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // All hooks must be called before any conditional returns
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

  // Don't render provider tier dropdowns until config is loaded
  if (!modelConfig && !error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <DashboardHeader />
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading configuration...</p>
        </div>
      </div>
    );
  }

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
        // Don't allow deselecting the last provider
        if (prev.length === 1) {
          return prev;
        }

        const newProviders = prev.filter((p) => p !== providerId);

        // If removing master, auto-assign to first remaining provider
        if (providerId === masterProvider && newProviders.length > 0) {
          setMasterProvider(newProviders[0]);
        }

        return newProviders;
      } else {
        const newProviders = [...prev, providerId];

        // If adding first provider, make it master
        if (prev.length === 0) {
          setMasterProvider(providerId);
        }

        return newProviders;
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

  // Website context helpers - Multi-select toggles
  const toggleGender = (gender: "male" | "female" | "other") => {
    const current = websiteContext.targetGender || [];
    const newGenders = current.includes(gender)
      ? current.filter((g) => g !== gender)
      : [...current, gender];
    setWebsiteContext({ ...websiteContext, targetGender: newGenders });
  };

  const toggleEducation = (
    edu: "basic" | "high_school" | "college" | "advanced",
  ) => {
    const current = websiteContext.educationLevel || [];
    const newEdu = current.includes(edu)
      ? current.filter((e) => e !== edu)
      : [...current, edu];
    setWebsiteContext({ ...websiteContext, educationLevel: newEdu });
  };

  const toggleIncome = (income: "low" | "middle" | "high") => {
    const current = websiteContext.incomeLevel || [];
    const newIncome = current.includes(income)
      ? current.filter((i) => i !== income)
      : [...current, income];
    setWebsiteContext({ ...websiteContext, incomeLevel: newIncome });
  };

  const toggleTech = (
    tech: "beginners" | "average" | "tech_savvy" | "geeks",
  ) => {
    const current = websiteContext.techFriendliness || [];
    const newTech = current.includes(tech)
      ? current.filter((t) => t !== tech)
      : [...current, tech];
    setWebsiteContext({ ...websiteContext, techFriendliness: newTech });
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
      const supabase = createBrowserClient();
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

        // Save the uploaded file path
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
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        throw new Error("Failed to create analysis: " + insertError.message);
      }

      setUploadProgress("Starting analysis...");

      // Trigger analysis via API with per-provider model tiers
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: analysis.id,
          providers: selectedProviders,
          masterProvider,
          providerModelTiers, // Use per-provider tiers
          ...(Object.keys(websiteContext).length > 0 && {
            websiteContext,
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

  // Show loading while checking access
  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Checking account...</p>
        </div>
      </div>
    );
  }

  // Show prompt if no access (no API keys, not admin, no subscription)
  if (!hasAccess) {
    return <NoApiKeysPrompt />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

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

        {/* Website Context (Optional but Recommended) */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-semibold mb-4">
            2. Website Context (Optional but Recommended)
          </h2>
          <p className="text-muted text-sm mb-6">
            Help us provide more targeted feedback by describing your website
            and target audience. This information enhances the AI's
            understanding of your specific use case.
          </p>

          <div className="space-y-6">
            {/* Target Age Groups */}
            <MultiSelectButtonGroup
              label="Target Age Groups"
              options={[
                { id: "kids", label: "Kids" },
                { id: "teenagers", label: "Teenagers" },
                { id: "middle_age", label: "Middle Age" },
                { id: "elderly", label: "Elderly" },
              ]}
              selectedValues={websiteContext.targetAge || []}
              onToggle={toggleAgeGroup}
              onSetAll={(values) =>
                setWebsiteContext({ ...websiteContext, targetAge: values })
              }
            />

            {/* Target Gender */}
            <MultiSelectButtonGroup
              label="Target Gender"
              options={[
                { id: "male", label: "Male" },
                { id: "female", label: "Female" },
                { id: "other", label: "Other" },
              ]}
              selectedValues={websiteContext.targetGender || []}
              onToggle={toggleGender}
              onSetAll={(values) =>
                setWebsiteContext({ ...websiteContext, targetGender: values })
              }
            />

            {/* Education Level */}
            <MultiSelectButtonGroup
              label="Education Level"
              options={[
                { id: "basic", label: "Basic" },
                { id: "high_school", label: "High School" },
                { id: "college", label: "College" },
                { id: "advanced", label: "Advanced" },
              ]}
              selectedValues={websiteContext.educationLevel || []}
              onToggle={toggleEducation}
              onSetAll={(values) =>
                setWebsiteContext({
                  ...websiteContext,
                  educationLevel: values,
                })
              }
            />

            {/* Income Level */}
            <MultiSelectButtonGroup
              label="Income Level"
              options={[
                { id: "low", label: "Low" },
                { id: "middle", label: "Middle" },
                { id: "high", label: "High" },
              ]}
              selectedValues={websiteContext.incomeLevel || []}
              onToggle={toggleIncome}
              onSetAll={(values) =>
                setWebsiteContext({ ...websiteContext, incomeLevel: values })
              }
            />

            {/* Tech Friendliness */}
            <MultiSelectButtonGroup
              label="Tech Friendliness"
              options={[
                { id: "beginners", label: "Beginners" },
                { id: "average", label: "Average" },
                { id: "tech_savvy", label: "Tech Savvy" },
                { id: "geeks", label: "Geeks" },
              ]}
              selectedValues={websiteContext.techFriendliness || []}
              onToggle={toggleTech}
              onSetAll={(values) =>
                setWebsiteContext({
                  ...websiteContext,
                  techFriendliness: values,
                })
              }
            />

            {/* Business Sector */}
            <BusinessSectorSelector
              selectedSectors={websiteContext.businessSector || []}
              onAdd={(sector) =>
                setWebsiteContext({
                  ...websiteContext,
                  businessSector: [
                    ...(websiteContext.businessSector || []),
                    sector,
                  ],
                })
              }
              onRemove={removeSector}
            />

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

        {/* Provider Selection */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-semibold mb-4">3. Select AI providers</h2>
          <p className="text-muted text-sm mb-6">
            Choose which AI models to use. More providers = better analysis.
          </p>

          <div className="space-y-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`p-4 rounded-xl border transition-colors ${
                  selectedProviders.includes(provider.id)
                    ? "border-primary bg-primary/10"
                    : "border-border"
                }`}
              >
                {/* Provider header with checkbox and master radio */}
                <label className="flex items-center gap-4 cursor-pointer">
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

                {/* Model Tier Dropdown - shown only when provider is selected */}
                {selectedProviders.includes(provider.id) && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <label className="block text-xs text-muted mb-2">
                      Model Quality Tier
                    </label>
                    <select
                      value={providerModelTiers[provider.id]}
                      onChange={(e) =>
                        setProviderModelTiers({
                          ...providerModelTiers,
                          [provider.id]: e.target.value as ModelTier,
                        })
                      }
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                    >
                      {modelConfig && getProviderTierOptions(modelConfig, provider.id).map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User API Keys - Inline Modal */}
        <ApiKeysPromptCard accentColor="primary" className="mb-8" />

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
