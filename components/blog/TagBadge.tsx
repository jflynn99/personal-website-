import Link from "next/link";

interface TagBadgeProps {
  tag: string;
  href?: string;
  active?: boolean;
  size?: "sm" | "md";
}

export function TagBadge({
  tag,
  href,
  active = false,
  size = "sm",
}: TagBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  const baseClasses = `inline-flex items-center rounded-full font-medium transition-colors ${sizeClasses[size]}`;

  const stateClasses = active
    ? "bg-accent text-background"
    : "bg-card text-muted hover:bg-card-hover hover:text-foreground";

  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${stateClasses}`}>
        {tag}
      </Link>
    );
  }

  return <span className={`${baseClasses} ${stateClasses}`}>{tag}</span>;
}
