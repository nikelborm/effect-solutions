"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface NavTitleCyclerProps {
  title: string;
  className?: string;
}

const TITLE_VARIANTS = {
  initial: {
    y: -24,
    opacity: 0.9,
    filter: "blur(6px)",
  },
  animate: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: {
    y: 24,
    opacity: 0.9,
    filter: "blur(6px)",
  },
} as const;

export function NavTitleCycler({ title, className }: NavTitleCyclerProps) {
  const [renderedTitle, setRenderedTitle] = useState(title);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (title === renderedTitle) {
      return;
    }

    setRenderedTitle(title);
    setAnimationKey((key) => key + 1);
  }, [title, renderedTitle]);

  return (
    <div className={cn("relative flex-1 min-w-0", className)}>
      <div className="relative overflow-hidden px-1.5 py-1">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={animationKey}
            layout="position"
            variants={TITLE_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              type: "spring",
              visualDuration: 0.4,
              bounce: 0.3,
            }}
            className="block leading-tight will-change-transform"
          >
            {renderedTitle}
          </motion.span>
        </AnimatePresence>
        <FadeOverlays />
      </div>
    </div>
  );
}

function FadeOverlays() {
  const fadeClass =
    "pointer-events-none absolute left-0 right-0 bg-neutral-950 group-hover:bg-neutral-900/50";

  return (
    <>
      <div
        className={cn(fadeClass, "top-0")}
        style={{
          height: 12,
          maskImage: "linear-gradient(180deg, black 0%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, black 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className={cn(fadeClass, "bottom-0")}
        style={{
          height: 12,
          maskImage: "linear-gradient(0deg, black 0%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(0deg, black 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
