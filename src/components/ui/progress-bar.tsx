import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger" | "gradient";
  animated?: boolean;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      className,
      showLabel = false,
      size = "md",
      variant = "default",
      animated = false,
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
      sm: "h-1.5",
      md: "h-2.5",
      lg: "h-4",
    };

    const variantClasses = {
      default: "bg-primary",
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-danger",
      gradient: "gradient-primary",
    };

    // Auto-determine variant based on percentage if not explicitly set
    const autoVariant =
      variant === "default"
        ? percentage <= 30
          ? "success"
          : percentage <= 70
            ? "warning"
            : "danger"
        : variant;

    return (
      <div className={cn("w-full", className)}>
        <div
          ref={ref}
          className={cn(
            "w-full overflow-hidden rounded-full bg-secondary",
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              variantClasses[autoVariant],
              animated && "progress-animated"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{value.toLocaleString("tr-TR")}</span>
            <span>{max.toLocaleString("tr-TR")}</span>
          </div>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
