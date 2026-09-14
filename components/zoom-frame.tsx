"use client";

export function ZoomFrame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.setProperty("--zoom-x", `${x}%`);
    event.currentTarget.style.setProperty("--zoom-y", `${y}%`);
  }

  function onPointerLeave(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--zoom-x", "50%");
    event.currentTarget.style.setProperty("--zoom-y", "50%");
  }

  return (
    <div
      className={className}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>
  );
}
