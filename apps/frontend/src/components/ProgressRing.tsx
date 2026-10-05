import type { ReactNode } from "react";
import { RING_COLOR } from "../utils/config";

// Ring thickness, in % of the wrapped element's size
const THICKNESS = 7;

/**
 * Ring drawn outside the wrapped element, filling clockwise from the top.
 * percent: 0 = empty, 100 = full circle.
 */
export const ProgressRing = ({
  percent = 0,
  className = "",
  children,
}: {
  percent?: number;
  className?: string;
  children?: ReactNode;
}) => {
  const progress = Math.min(100, Math.max(0, percent));

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full overflow-visible -rotate-90 pointer-events-none"
      >
        <circle
          cx={50}
          cy={50}
          r={50 + THICKNESS / 2}
          fill="none"
          stroke={RING_COLOR}
          strokeWidth={THICKNESS}
          pathLength={100}
          strokeDasharray={`${progress} 100`}
        />
      </svg>
      {children}
    </div>
  );
};
