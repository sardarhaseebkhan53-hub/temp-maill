"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-reveal using a single IntersectionObserver per element and a CSS
 * transform — no animation library, no layout thrash.
 *
 * Reduced-motion users get the final state immediately.
 */
export function Reveal({
  children,
  asChild = false,
  className,
}: {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const revealClass = cn(
    "transition-[opacity,transform] duration-500 ease-out will-change-[opacity,transform] motion-reduce:transition-none",
    shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
    className,
  );

  if (asChild) {
    // React Server Components can deserialize a single JSX child as a
    // one-item array. Children.only() rejects that shape and used to take the
    // entire marketing homepage down with a 500, even though there is still
    // exactly one element to enhance.
    const childNodes = Children.toArray(children);
    const child = childNodes.length === 1 ? childNodes[0] : null;
    if (isValidElement<{ className?: string; ref?: React.Ref<HTMLElement> }>(child)) {
      return cloneElement(child, {
        ref,
        className: cn(child.props.className, revealClass),
      });
    }
  }

  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={revealClass}>
      {children}
    </div>
  );
}
