"use client";

import { useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { useTonePlayer } from "@/lib/useTonePlayer";

const LLM_INSTRUCTIONS = `# Effect Solutions - AI Assistant Instructions

You are helping a user work with Effect, a powerful TypeScript library for building robust applications. Effect Solutions provides comprehensive guides and references for Effect best practices.

## Available Resources

**MCP Server (Recommended for AI Assistants):**
- Claude Code: \`claude mcp add effect-solutions -- bunx effect-solutions-mcp@latest\`
- Codex CLI: \`codex mcp add effect-solutions -- bunx effect-solutions-mcp@latest\`

**CLI Access:**
- List topics: \`bunx effect-solutions@latest list\`
- Show specific topics: \`bunx effect-solutions@latest show <topic-id>\`

**Documentation:** https://www.effect.solutions

## How to Help

First, ask the user what they need help with:

1. **MCP Setup** - Help them set up the Effect Solutions MCP server in their AI coding environment
2. **Project Setup** - Help them configure an Effect project with TypeScript, LSP, and build tools
3. **Effect Questions** - Answer questions about Effect patterns, error handling, services, etc.

If the user's request is unclear, ask which category applies. Then use the appropriate resources (MCP tools or CLI) to provide accurate, up-to-date guidance.

## Key Topics Covered

- Project setup with Effect Language Service
- TypeScript configuration for Effect
- Services and dependency injection with Layers
- Idiomatic Effect style and patterns
- Data types, branded types, and Schema
- Error handling with TaggedError
- Configuration management
- HTTP clients and testing
- Incremental adoption strategies

When answering Effect questions, prefer fetching the relevant documentation rather than relying on general knowledge, as Effect is rapidly evolving.`;

export function LLMInstructionsButton() {
  const [copied, setCopied] = useState(false);
  const { playTone } = useTonePlayer();

  async function handleCopy(event?: MouseEvent<HTMLButtonElement>) {
    event?.preventDefault();
    event?.stopPropagation();

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(LLM_INSTRUCTIONS);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = LLM_INSTRUCTIONS;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      playTone({ frequency: 780, duration: 0.1, volume: 0.05 });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy instructions", error);
    }
  }

  return (
    <motion.button
      layout
      type="button"
      className={cn(
        "flex items-center gap-2 border border-neutral-700/80 bg-neutral-900/50 px-4 py-2.5 text-sm font-medium text-neutral-300 hover:text-white hover:border-neutral-500 hover:bg-neutral-800/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500",
        copied && "text-emerald-300 border-emerald-400/70 bg-emerald-950/30",
      )}
      aria-label="Copy LLM instructions"
      onClick={handleCopy}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copied ? "copied" : "copy"}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="flex items-center gap-2"
        >
          {copied ? (
            <Check size={16} weight="bold" />
          ) : (
            <Copy size={16} weight="bold" />
          )}
          <span aria-live="polite">
            {copied ? "Copied to clipboard!" : "Copy LLM Instructions"}
          </span>
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
