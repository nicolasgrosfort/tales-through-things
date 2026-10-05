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
  pulsing = false,
  className = "",
  children,
}: {
  percent?: number;
  pulsing?: boolean;
  className?: string;
  children?: ReactNode;
}) => {
  // A full ring overshoots slightly: a dash of exactly 100 can leave a hairline gap
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
          className={`transition-[stroke-dasharray] duration-1000 ease-in-out ${
            pulsing ? "animate-[ring-pulse_2.4s_ease-in-out_infinite]" : ""
          }`}
          stroke={RING_COLOR}
          strokeWidth={THICKNESS}
          pathLength={100}
          strokeDasharray={`${progress >= 100 ? 101 : progress} 100`}
        />
      </svg>
      {children}
    </div>
  );
};
