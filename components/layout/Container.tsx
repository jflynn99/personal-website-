import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  width?: "narrow" | "default" | "wide";
  className?: string;
}

const widthClasses = {
  narrow: "max-w-2xl",
  default: "max-w-4xl",
  wide: "max-w-6xl",
};

export function Container({
  children,
  width = "default",
  className = "",
}: ContainerProps) {
  return (
    <div className={`mx-auto px-4 sm:px-6 ${widthClasses[width]} ${className}`}>
      {children}
    </div>
  );
}
