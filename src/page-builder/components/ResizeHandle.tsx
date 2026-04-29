import { useCallback, useRef } from "react";
import clsx from "clsx";

/**
 * Draggable resize handle between panels.
 * Shows a subtle line that highlights on hover/drag with a width indicator.
 */
export function ResizeHandle({
  side,
  className,
  onResize,
}: {
  /** Which side this handle is on — determines drag direction */
  side: "left" | "right";
  /** Optional extra class names */
  className?: string;
  /** Called with the delta (px) during drag */
  onResize: (delta: number) => void;
}) {
  const isDragging = useRef(false);
  const startX = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startX.current = e.clientX;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = moveEvent.clientX - startX.current;
        startX.current = moveEvent.clientX;
        // For right-side handle, dragging left = negative delta = shrink right panel
        onResize(side === "left" ? delta : -delta);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [onResize, side],
  );

  return (
    <div
      className={clsx(
        "relative z-20 flex w-[5px] shrink-0 cursor-col-resize items-center justify-center",
        "group hover:bg-[#634CF8]/10 active:bg-[#634CF8]/15 transition-colors",
        className,
      )}
      onMouseDown={handleMouseDown}
    >
      {/* Visual indicator line */}
      <div className="h-8 w-[3px] rounded-full bg-separator/40 group-hover:bg-[#634CF8]/50 group-active:bg-[#634CF8] transition-colors" />
    </div>
  );
}
