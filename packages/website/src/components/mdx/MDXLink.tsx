"use client";

import Link from "next/link";
import { ArrowRight, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import type { AnchorHTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { useLessonNavSfx } from "@/lib/useLessonNavSfx";
import { cn } from "@/lib/cn";

interface MDXLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  children: ReactNode;
}

export function MDXLink(props: MDXLinkProps) {
  const {
    children,
    className,
    href,
    onMouseEnter,
    onClick,
    ...anchorProps
  } = props;
  const { playHoverTone, playTapTone } = useLessonNavSfx();
  const isInternal =
    (href?.startsWith("/") && !href.startsWith("//")) || href?.startsWith("./");
  const isExternal =
    href?.startsWith("http://") || href?.startsWith("https://");
  const iconClassName = "text-blue-400/60 font-bold";

  const linkClassName = cn(
    "text-blue-400 hover:text-blue-300 no-underline cursor-pointer inline-flex items-center gap-1",
    className,
  );

  const handleMouseEnter: MouseEventHandler<HTMLAnchorElement> = (event) => {
    onMouseEnter?.(event);
    playHoverTone();
  };

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    onClick?.(event);
    playTapTone();
  };

  if (isInternal && href) {
    return (
      <Link
        href={href}
        className={linkClassName}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
      >
        {children}
        <ArrowRight size={16} weight="bold" className={iconClassName} />
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={linkClassName}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      {...anchorProps}
    >
      {children}
      {isExternal && (
        <ArrowSquareOut size={16} weight="bold" className={iconClassName} />
      )}
    </a>
  );
}
