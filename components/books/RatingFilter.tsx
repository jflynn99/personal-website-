"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface RatingFilterProps {
  counts: Record<number, number>;
  total: number;
}

export function RatingFilter({ counts, total }: RatingFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeRating = searchParams.get("rating");

  const handleClick = (rating: number | null) => {
    if (rating === null || activeRating === String(rating)) {
      router.push("/books");
    } else {
      router.push(`/books?rating=${rating}`);
    }
  };

  const ratings = [5, 4, 3, 2, 1];

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => handleClick(null)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            !activeRating
              ? "bg-accent text-background"
              : "bg-card text-muted hover:text-foreground"
          }`}
        >
          All ({total})
        </button>
        {ratings.map((rating) => (
          <button
            key={rating}
            onClick={() => handleClick(rating)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              activeRating === String(rating)
                ? "bg-accent text-background"
                : "bg-card text-muted hover:text-foreground"
            }`}
          >
            {rating}★ ({counts[rating] || 0})
          </button>
        ))}
      </div>
    </div>
  );
}
