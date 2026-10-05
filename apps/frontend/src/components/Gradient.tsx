import type { CSSProperties, ReactNode } from "react";
import { GRADIENT_BLUE, GRADIENT_ORANGE } from "../utils/config";

/**
 * Vertical gradient background: 0 = 100% orange, 100 = 100% blue.
 * The gradient is 3x the container height (orange, transition, blue) and a
 * window slides over it, so both ends are a flat color.
 */
export const Gradient = ({
  percent = 0,
  className = "",
  children,
}: {
  percent?: number;
  className?: string;
  children?: ReactNode;
}) => {
  const style: CSSProperties = {
    backgroundImage: `linear-gradient(to bottom, ${GRADIENT_ORANGE} 0%, ${GRADIENT_ORANGE} 33.33%, ${GRADIENT_BLUE} 66.67%, ${GRADIENT_BLUE} 100%)`,
    backgroundSize: "100% 300%",
    backgroundPosition: `0 ${Math.min(100, Math.max(0, percent))}%`,
  };

  return (
    <div
      className={`transition-[background-position] duration-1000 ease-in-out ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};
