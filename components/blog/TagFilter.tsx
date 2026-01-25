"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TagBadge } from "./TagBadge";

interface TagFilterProps {
  tags: string[];
}

export function TagFilter({ tags }: TagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");

  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      // Remove tag filter
      router.push("/blog");
    } else {
      // Apply tag filter
      router.push(`/blog?tag=${encodeURIComponent(tag)}`);
    }
  };

  const handleClearFilter = () => {
    router.push("/blog");
  };

  if (tags.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Filter by tag:</span>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className="focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded-full"
          >
            <TagBadge tag={tag} active={activeTag === tag} size="md" />
          </button>
        ))}
        {activeTag && (
          <button
            onClick={handleClearFilter}
            className="ml-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>
    </div>
  );
}
