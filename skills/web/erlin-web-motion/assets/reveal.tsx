// components/motion/reveal.tsx — Client Component
// Scroll-triggered reveal: opacity + upward drift when the wrapped node
// enters the viewport. Uses a manual IntersectionObserver with a failsafe
// timer instead of motion's whileInView — whileInView once proved unreliable
// in selected-lab (cards stuck at opacity:0, "项目卡片没了"). The observer
// fires immediately for in-view elements at mount; if it ever doesn't (edge
// case), the failsafe reveals the content after 2.5s so nothing can stay
// hidden. Reduced motion renders instantly. Pass `delay` to stagger siblings.
'use client';

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode;
  className?: string;
  /** stagger offset in seconds — pass i * step from the parent map */
  delay?: number;
  /** drift distance in px before reveal */
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // Start visible when there's nothing to animate: reduced motion, or a
  // browser without IntersectionObserver. Everything below only runs for
  // the animated path.
  const [inView, setInView] = useState(
    () => reduced || typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      // amount 0.15 + negative bottom margin: fires when the element is
      // clearly on screen, without waiting for most of it to cross.
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    // Failsafe — never leave content invisible, no matter what.
    const failsafe = window.setTimeout(() => setInView(true), 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [inView]);

  const ease = `cubic-bezier(${EASE.join(",")})`;
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : `translateY(${y}px)`,
        transition: `opacity 0.7s ${ease} ${delay}s, transform 0.7s ${ease} ${delay}s`,
        willChange: inView ? undefined : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
