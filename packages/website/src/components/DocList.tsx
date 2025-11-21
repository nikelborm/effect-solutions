"use client";

import Link from "next/link";
import {
  type FocusEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { useLessonSfxHandlers } from "@/lib/useLessonNavSfx";
import { EffectOrFooter } from "./EffectOrFooter";

interface DocListProps {
  docs: Array<{
    slug: string;
    title: string;
    description?: string;
    draft?: boolean;
  }>;
}

type DocGroup = "Setup" | "Core Patterns" | "Drafts";

const GROUP_DISPLAY_ORDER: DocGroup[] = ["Setup", "Core Patterns", "Drafts"];

const SETUP_SLUGS = new Set(["overview", "project-setup", "tsconfig"]);

const SCROLL_MARGIN_PX = 80; // accounts for sticky header/footer (h-16 = 64px) with a little buffer

function assignGroup(doc: { slug: string; draft?: boolean }): DocGroup {
  if (doc.draft) return "Drafts";
  if (SETUP_SLUGS.has(doc.slug)) return "Setup";
  return "Core Patterns";
}

export function DocList({ docs }: DocListProps) {
  const {
    handleHover: playHoverSfx,
    handleClick: playClickSfx,
    handleFocusVisible,
  } = useLessonSfxHandlers();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const totalDocs = docs.length;

  const groupedDocs = useMemo(() => {
    return docs.reduce<Record<DocGroup, typeof docs>>(
      (acc, doc) => {
        const group = assignGroup(doc);
        acc[group] = acc[group] ? [...acc[group], doc] : [doc];
        return acc;
      },
      {} as Record<DocGroup, typeof docs>,
    );
  }, [docs]);

  // Keep refs array in sync with docs length
  useEffect(() => {
    linkRefs.current.length = totalDocs;
    setSelectedIndex((prev) => {
      if (prev === null) return null;
      if (totalDocs === 0) return null;
      return Math.min(prev, totalDocs - 1);
    });
  }, [totalDocs]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const el = linkRefs.current[selectedIndex];
    if (!el) return;

    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex]);

  useEffect(() => {
    if (totalDocs === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => {
          if (totalDocs === 0) return null;
          if (prev === null) return 0;
          return (prev + 1) % totalDocs;
        });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => {
          if (totalDocs === 0) return null;
          if (prev === null) return totalDocs - 1;
          return (prev - 1 + totalDocs) % totalDocs;
        });
      } else if (event.key === "Enter" && selectedIndex !== null) {
        const targetLink = linkRefs.current[selectedIndex];
        if (targetLink) {
          event.preventDefault();
          targetLink.click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, totalDocs]);

  const handleMouseEnter = useCallback(() => {
    playHoverSfx();
  }, [playHoverSfx]);

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLAnchorElement>) => {
      if (event.currentTarget.matches(":focus-visible")) {
        handleFocusVisible();
      }
    },
    [handleFocusVisible],
  );

  const handleClick = useCallback(() => {
    playClickSfx();
  }, [playClickSfx]);


  let runningIndex = -1;

  return (
    <section>
      {GROUP_DISPLAY_ORDER.filter((group) => groupedDocs[group]?.length).map(
        (group) => (
          <div key={group}>
            <div
              className="w-full h-6 border-b border-neutral-800 block"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, transparent, transparent 8px, rgb(38, 38, 38) 8px, rgb(38, 38, 38) 9px)",
              }}
            />
            <div className="px-6 pb-2 pt-2 text-xs font-semibold tracking-[0.16em] uppercase text-neutral-500">
              {group}
            </div>
            <div className="border-t border-neutral-800" />

            {groupedDocs[group]!.map((doc, index, arr) => {
              runningIndex += 1;
              const currentIndex = runningIndex;

              return (
                <div key={doc.slug}>
                  <Link
                    href={`/${doc.slug}`}
                    ref={(el) => {
                      linkRefs.current[currentIndex] = el;
                    }}
                    aria-selected={selectedIndex === currentIndex}
                    className={cn(
                      "block px-6 py-8 hover:bg-neutral-900/50 cursor-default focus:outline-none focus-visible:outline-none",
                      selectedIndex === currentIndex && "bg-neutral-900",
                    )}
                    style={{
                      scrollMarginTop: `${SCROLL_MARGIN_PX}px`,
                      scrollMarginBottom: `${SCROLL_MARGIN_PX}px`,
                    }}
                    onClick={handleClick}
                    onFocus={handleFocus}
                    onMouseEnter={handleMouseEnter}
                  >
                    <article>
                      <div className="flex items-center gap-3">
                        <h2 className="text-[1.05rem] font-semibold uppercase leading-snug text-neutral-100">
                          {doc.title}
                        </h2>
                        {doc.draft && (
                          <span className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            Draft
                          </span>
                        )}
                      </div>

                      {doc.description && (
                        <p className="mt-3 text-[1.05rem] leading-relaxed text-neutral-300">
                          {doc.description}
                        </p>
                      )}
                    </article>
                  </Link>
                  {index < arr.length - 1 && (
                    <hr className="border-t border-neutral-800" />
                  )}
                </div>
              );
            })}

            <div className="border-t border-neutral-800" />
          </div>
        ),
      )}
      <EffectOrFooter />
    </section>
  );
}
