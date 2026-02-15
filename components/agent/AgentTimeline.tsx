"use client";

import type { UIMessage } from "ai";

interface AgentTimelineProps {
  messages: UIMessage[];
  isLoading: boolean;
}

function ToolIcon({ toolName }: { toolName: string }) {
  if (toolName === "web_search") {
    return (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
    );
  }
  if (toolName === "web_fetch") {
    return (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
        />
      </svg>
    );
  }
  // note
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
  );
}

function getToolLabel(toolName: string, input: Record<string, unknown>) {
  if (!input) return toolName;
  if (toolName === "web_search") return input.query ? `Searching: "${input.query}"` : "Searching...";
  if (toolName === "web_fetch") {
    const url = input.url as string | undefined;
    if (!url) return "Fetching...";
    try {
      return `Fetching: ${new URL(url).hostname}`;
    } catch {
      return `Fetching: ${url}`;
    }
  }
  if (toolName === "note") {
    const insight = input.insight as string | undefined;
    if (!insight) return "Recording insight...";
    return insight.length > 100 ? insight.slice(0, 100) + "..." : insight;
  }
  return toolName;
}

function extractToolName(partType: string): string {
  // Typed tools: "tool-web_search" → "web_search"
  if (partType.startsWith("tool-")) {
    return partType.slice(5);
  }
  return partType;
}

type TimelineItem =
  | { type: "text"; content: string }
  | { type: "tool"; toolName: string; input: Record<string, unknown> };

export function AgentTimeline({ messages, isLoading }: AgentTimelineProps) {
  const timelineItems: TimelineItem[] = [];

  for (const message of messages) {
    if (message.role !== "assistant") continue;

    for (const part of message.parts) {
      if (part.type === "text") {
        const text = part.text.trim();
        // Skip the final decision brief — it'll be rendered by DecisionBrief
        if (text && !text.startsWith("# Decision Brief")) {
          timelineItems.push({ type: "text", content: text });
        }
      } else if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
        const p = part as Record<string, unknown>;
        const toolName =
          part.type === "dynamic-tool" ? (p.toolName as string) : extractToolName(part.type);
        const input = (p.input ?? p.args ?? {}) as Record<string, unknown>;
        timelineItems.push({
          type: "tool",
          toolName,
          input,
        });
      }
    }
  }

  if (timelineItems.length === 0 && !isLoading) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
        Research Progress
      </h2>
      <div className="relative space-y-2 border-l-2 border-border pl-4">
        {timelineItems.map((item, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[calc(1rem+5px)] top-1.5 h-2 w-2 rounded-full bg-accent" />

            {item.type === "tool" ? (
              <div className="flex items-start gap-2 rounded-md bg-card p-2 text-sm">
                <span className="mt-0.5 shrink-0 text-accent">
                  <ToolIcon toolName={item.toolName} />
                </span>
                <span className="text-muted-foreground">
                  {getToolLabel(item.toolName, item.input)}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{item.content}</p>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="relative">
            <div className="absolute -left-[calc(1rem+5px)] top-1.5 h-2 w-2 animate-pulse rounded-full bg-accent" />
            <div className="flex items-center gap-2 p-2 text-sm text-muted">
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
