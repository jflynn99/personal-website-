"use client";

import ReactMarkdown from "react-markdown";

interface DecisionBriefProps {
  content: string;
}

export function DecisionBrief({ content }: DecisionBriefProps) {
  if (!content) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
      <div className="prose prose-sm max-w-none sm:prose-base">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
