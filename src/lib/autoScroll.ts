export interface AutoScrollController {
  update: (el: HTMLElement, speed: number) => void;
  stop: () => void;
}

export function createAutoScroll(): AutoScrollController {
  let rafId: number | null = null;
  let currentEl: HTMLElement | null = null;
  let currentSpeed = 0;

  const tick = () => {
    if (currentEl) currentEl.scrollTop += currentSpeed;
    rafId = requestAnimationFrame(tick);
  };

  return {
    update(el, speed) {
      currentEl = el;
      currentSpeed = speed;
      if (rafId === null) rafId = requestAnimationFrame(tick);
    },
    stop() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      currentEl = null;
      currentSpeed = 0;
    },
  };
}

export function computeEdgeScrollSpeed(
  clientY: number,
  containerRect: DOMRect,
  threshold = 60,
  maxSpeed = 10,
): number {
  if (clientY < containerRect.top + threshold) {
    const dist = Math.max(0, clientY - containerRect.top);
    const t = 1 - dist / threshold;
    return -Math.max(2, Math.round(maxSpeed * t));
  }
  if (clientY > containerRect.bottom - threshold) {
    const dist = Math.max(0, containerRect.bottom - clientY);
    const t = 1 - dist / threshold;
    return Math.max(2, Math.round(maxSpeed * t));
  }
  return 0;
}
