"use client";

import { useState } from "react";
import Modal from "./Modal";
import ApiKeysForm from "./ApiKeysForm";

interface ApiKeysPromptCardProps {
  accentColor?: "primary" | "cyan" | "blue";
  className?: string;
}

export default function ApiKeysPromptCard({
  accentColor = "primary",
  className = "",
}: ApiKeysPromptCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const colorClasses = {
    primary: {
      bg: "from-primary/5 to-primary/10",
      border: "border-primary/20",
      iconBg: "bg-primary/20",
      iconText: "text-primary",
      button: "bg-primary hover:bg-primary/90",
    },
    cyan: {
      bg: "from-cyan-500/10 to-blue-500/10",
      border: "border-cyan-500/20",
      iconBg: "bg-cyan-500/20",
      iconText: "text-cyan-400",
      button: "bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90",
    },
    blue: {
      bg: "from-blue-500/10 to-indigo-500/10",
      border: "border-blue-500/20",
      iconBg: "bg-blue-500/20",
      iconText: "text-blue-400",
      button: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90",
    },
  };

  const colors = colorClasses[accentColor];

  return (
    <>
      <div
        className={`glass-card rounded-2xl p-6 bg-gradient-to-br ${colors.bg} border ${colors.border} ${className}`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full ${colors.iconBg} flex items-center justify-center`}
          >
            <svg
              className={`w-5 h-5 ${colors.iconText}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold mb-1">
              Using Your Own API Keys?
            </h3>
            <p className="text-sm text-muted mb-4">
                Manage your API keys in settings to use your own OpenAI, Anthropic, or Google Gemini credits.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className={`inline-flex items-center px-4 py-2 ${colors.button} text-white text-sm font-medium rounded-lg transition-all`}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Manage API Keys
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Manage Your API Keys"
        size="lg"
      >
        <ApiKeysForm
          onSuccess={() => {
            setIsModalOpen(false);
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
}
