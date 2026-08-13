export const easing = [0.22, 1, 0.36, 1] as const;

export const duration = {
  fast: 0.14,
  base: 0.22,
  slow: 0.4,
};

export const springPop = { type: "spring" as const, stiffness: 520, damping: 28, mass: 0.7 };

export const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: easing } },
};

export const stagger = {
  show: {
    transition: { staggerChildren: 0.03, delayChildren: 0.04 },
  },
};
