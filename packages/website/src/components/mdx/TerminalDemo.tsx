"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface HistoryEntry {
  input: string;
  output: string;
  isError?: boolean;
}

interface Task {
  id: number;
  text: string;
  done: boolean;
}

const STORAGE_KEY = "effect-solutions-tasks-demo";

const PLACEHOLDER_HINTS = [
  'add "Buy milk"',
  "list",
  "list --all",
  "toggle 1",
  "--help",
];

const COMMANDS = ["add", "list", "toggle", "clear"];

const nbsp = (str: string) => str.replace(/ /g, "\u00A0");

function getAutocomplete(input: string, cursorAtEnd: boolean): string | null {
  if (!input || !cursorAtEnd) return null;
  const parts = input.split(" ");
  const first = parts[0];
  if (!first) return null;
  const cmd = first.toLowerCase();

  if (parts.length === 1) {
    const match = COMMANDS.find((c) => c.startsWith(cmd) && c !== cmd);
    if (match) return match.slice(cmd.length);
  }

  if (first === "list" && parts.length === 2) {
    const flag = parts[1] ?? "";
    if ("--all".startsWith(flag) && flag !== "--all") {
      return "--all".slice(flag.length);
    }
  }

  return null;
}

const DEFAULT_TASKS: Task[] = [
  { id: 1, text: "Run the agent-guided setup", done: false },
  { id: 2, text: "Become effect-pilled", done: false },
];

const INITIALIZED_KEY = "effect-solutions-tasks-initialized";

function loadTasks(): Task[] {
  if (typeof window === "undefined") return DEFAULT_TASKS;
  try {
    if (!localStorage.getItem(INITIALIZED_KEY)) {
      localStorage.setItem(INITIALIZED_KEY, "true");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TASKS));
      return DEFAULT_TASKS;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getNextId(tasks: Task[]): number {
  if (tasks.length === 0) return 1;
  return Math.max(...tasks.map((t) => t.id)) + 1;
}

function runCommand(args: string): { output: string; isError?: boolean } {
  const parts = parseArgs(args.trim());
  if (parts.length === 0) {
    return {
      output: `tasks - A simple task manager

Commands:
  tasks add <task>     Add a new task
  tasks list [--all]   List tasks
  tasks toggle <id>    Toggle done status
  tasks clear          Clear all tasks`,
    };
  }

  const [cmd, ...rest] = parts;

  switch (cmd) {
    case "add": {
      const text = rest.join(" ").replace(/^["']|["']$/g, "");
      if (!text) return { output: "Usage: tasks add <task>", isError: true };
      const tasks = loadTasks();
      const id = getNextId(tasks);
      tasks.push({ id, text, done: false });
      saveTasks(tasks);
      return { output: `Added task #${id}: ${text}` };
    }

    case "list": {
      const showAll = rest.includes("--all") || rest.includes("-a");
      const tasks = loadTasks();
      const filtered = showAll ? tasks : tasks.filter((t) => !t.done);
      if (filtered.length === 0) return { output: "No tasks." };
      return {
        output: filtered
          .map((t) => `${t.done ? "[x]" : "[ ]"} #${t.id} ${t.text}`)
          .join("\n"),
      };
    }

    case "toggle": {
      const idStr = rest[0];
      if (!idStr) return { output: "Usage: tasks toggle <id>", isError: true };
      const id = Number.parseInt(idStr, 10);
      if (Number.isNaN(id))
        return { output: "Usage: tasks toggle <id>", isError: true };
      const tasks = loadTasks();
      const task = tasks.find((t) => t.id === id);
      if (!task) return { output: `Task #${id} not found`, isError: true };
      task.done = !task.done;
      saveTasks(tasks);
      return {
        output: `Toggled: ${task.text} (${task.done ? "done" : "pending"})`,
      };
    }

    case "clear": {
      saveTasks([]);
      return { output: "Cleared all tasks." };
    }

    case "--help":
      return {
        output: `tasks - A simple task manager

Commands:
  tasks add <task>     Add a new task
  tasks list [--all]   List tasks (--all includes completed)
  tasks toggle <id>    Toggle task done/pending
  tasks clear          Clear all tasks`,
      };

    default:
      return {
        output: `Unknown command: tasks ${cmd}\nTry: tasks --help`,
        isError: true,
      };
  }
}

function parseArgs(input: string): string[] {
  const args: string[] = [];
  let current = "";
  let inQuote: string | null = null;

  for (const char of input) {
    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = char;
    } else if (char === " ") {
      if (current) {
        args.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }
  if (current) args.push(current);
  return args;
}

// Find word boundary for Option+Arrow navigation
function findWordBoundary(
  text: string,
  pos: number,
  direction: "left" | "right",
): number {
  if (direction === "left") {
    if (pos === 0) return 0;
    let i = pos - 1;
    // Skip spaces
    while (i > 0 && text[i] === " ") i--;
    // Skip word characters
    while (i > 0 && text[i - 1] !== " ") i--;
    return i;
  } else {
    if (pos >= text.length) return text.length;
    let i = pos;
    // Skip current word
    while (i < text.length && text[i] !== " ") i++;
    // Skip spaces
    while (i < text.length && text[i] === " ") i++;
    return i;
  }
}

const blinkStyle = {
  animation: "blink 1s step-end infinite",
} as const;

export function TerminalDemo() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hintIndex, setHintIndex] = useState(0);
  const [blinkKey, setBlinkKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Cycle through placeholder hints
  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex((i) => (i + 1) % PLACEHOLDER_HINTS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Sync cursor position from input
  const syncCursor = useCallback(() => {
    if (inputRef.current) {
      setCursorPos(inputRef.current.selectionStart ?? input.length);
    }
  }, [input.length]);

  const resetBlink = useCallback(() => {
    setBlinkKey((k) => k + 1);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const fullCommand = `tasks ${input}`.trim();
      const result = runCommand(input);
      setHistory((h) => [...h, { input: fullCommand, ...result }]);
      if (input.trim()) {
        setCommandHistory((h) => [...h, input]);
      }
      setHistoryIndex(-1);
      setInput("");
      setCursorPos(0);
    },
    [input],
  );

  const cursorAtEnd = cursorPos >= input.length;
  const autocomplete = getAutocomplete(input, cursorAtEnd);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const inp = inputRef.current;
      if (!inp) return;

      // Ctrl+C - cancel
      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        if (input) {
          setHistory((h) => [...h, { input: `tasks ${input}^C`, output: "" }]);
          setInput("");
          setCursorPos(0);
        }
        resetBlink();
        return;
      }
      // Ctrl+L - clear screen
      if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        setHistory([]);
        return;
      }
      // Ctrl+A - go to beginning
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        inp.setSelectionRange(0, 0);
        setCursorPos(0);
        resetBlink();
        return;
      }
      // Ctrl+E - go to end
      if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        inp.setSelectionRange(input.length, input.length);
        setCursorPos(input.length);
        resetBlink();
        return;
      }
      // Ctrl+W - delete word backward
      if (e.ctrlKey && e.key === "w") {
        e.preventDefault();
        const pos = inp.selectionStart ?? input.length;
        const newPos = findWordBoundary(input, pos, "left");
        const newInput = input.slice(0, newPos) + input.slice(pos);
        setInput(newInput);
        setCursorPos(newPos);
        setTimeout(() => inp.setSelectionRange(newPos, newPos), 0);
        resetBlink();
        return;
      }
      // Ctrl+U - delete to beginning
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        const pos = inp.selectionStart ?? input.length;
        const newInput = input.slice(pos);
        setInput(newInput);
        setCursorPos(0);
        setTimeout(() => inp.setSelectionRange(0, 0), 0);
        resetBlink();
        return;
      }
      // Ctrl+K - delete to end
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        const pos = inp.selectionStart ?? input.length;
        setInput(input.slice(0, pos));
        resetBlink();
        return;
      }
      // Cmd+Backspace - delete entire line
      if (e.metaKey && e.key === "Backspace") {
        e.preventDefault();
        setInput("");
        setCursorPos(0);
        resetBlink();
        return;
      }
      // Option+Backspace - delete word backward
      if (e.altKey && e.key === "Backspace") {
        e.preventDefault();
        const pos = inp.selectionStart ?? input.length;
        const newPos = findWordBoundary(input, pos, "left");
        const newInput = input.slice(0, newPos) + input.slice(pos);
        setInput(newInput);
        setCursorPos(newPos);
        setTimeout(() => inp.setSelectionRange(newPos, newPos), 0);
        resetBlink();
        return;
      }
      // Option+Left - word jump left
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        const pos = inp.selectionStart ?? 0;
        const newPos = findWordBoundary(input, pos, "left");
        inp.setSelectionRange(newPos, newPos);
        setCursorPos(newPos);
        resetBlink();
        return;
      }
      // Option+Right - word jump right
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        const pos = inp.selectionStart ?? input.length;
        const newPos = findWordBoundary(input, pos, "right");
        inp.setSelectionRange(newPos, newPos);
        setCursorPos(newPos);
        resetBlink();
        return;
      }
      // Cmd+Left - go to beginning
      if (e.metaKey && e.key === "ArrowLeft") {
        e.preventDefault();
        inp.setSelectionRange(0, 0);
        setCursorPos(0);
        resetBlink();
        return;
      }
      // Cmd+Right - go to end
      if (e.metaKey && e.key === "ArrowRight") {
        e.preventDefault();
        inp.setSelectionRange(input.length, input.length);
        setCursorPos(input.length);
        resetBlink();
        return;
      }
      // Tab - accept autocomplete
      if (e.key === "Tab") {
        e.preventDefault();
        if (autocomplete) {
          const newInput = input + autocomplete;
          setInput(newInput);
          setCursorPos(newInput.length);
          setTimeout(
            () => inp.setSelectionRange(newInput.length, newInput.length),
            0,
          );
        }
        resetBlink();
        return;
      }
      // Arrow Up - previous command in history
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const newIndex = historyIndex + 1;
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex);
          const cmd = commandHistory[commandHistory.length - 1 - newIndex] ?? "";
          setInput(cmd);
          setCursorPos(cmd.length);
          setTimeout(() => inp.setSelectionRange(cmd.length, cmd.length), 0);
        }
        resetBlink();
        return;
      }
      // Arrow Down - next command in history
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const newIndex = historyIndex - 1;
        if (newIndex >= 0) {
          setHistoryIndex(newIndex);
          const cmd = commandHistory[commandHistory.length - 1 - newIndex] ?? "";
          setInput(cmd);
          setCursorPos(cmd.length);
          setTimeout(() => inp.setSelectionRange(cmd.length, cmd.length), 0);
        } else {
          setHistoryIndex(-1);
          setInput("");
          setCursorPos(0);
        }
        resetBlink();
        return;
      }
      // Arrow Left/Right - let default behavior work, then sync
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        resetBlink();
        setTimeout(syncCursor, 0);
        return;
      }
      // Any other key - reset blink
      resetBlink();
    },
    [historyIndex, commandHistory, input, autocomplete, syncCursor, resetBlink],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
      syncCursor();
    },
    [syncCursor],
  );

  // Also sync on click (user might click to position cursor)
  const handleInputClick = useCallback(() => {
    syncCursor();
    setBlinkKey((k) => k + 1);
  }, [syncCursor]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, []);

  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const beforeCursor = input.slice(0, cursorPos);
  const afterCursor = input.slice(cursorPos);

  return (
    <>
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
      <div
        className="not-prose my-6 border border-neutral-800 bg-neutral-950 font-mono text-sm"
        onClick={handleContainerClick}
        onKeyDown={undefined}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
          <span className="text-neutral-500">Task Manager</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHistory([]);
              saveTasks([]);
            }}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Reset
          </button>
        </div>

        <div ref={outputRef} className="h-72 overflow-y-auto">
          {history.map((entry, i) => (
            <div key={i}>
              {i > 0 && <div className="border-t border-neutral-800/50" />}
              <div className="px-4 py-3">
                <div className="text-green-500">{entry.input}</div>
                {entry.output && (
                  <div
                    className={`whitespace-pre-wrap mt-1 ${entry.isError ? "text-red-400" : "text-neutral-400"}`}
                  >
                    {entry.output}
                  </div>
                )}
              </div>
            </div>
          ))}

          {history.length > 0 && (
            <div className="border-t border-neutral-800/50" />
          )}

          <form onSubmit={handleSubmit} className="relative px-4 py-3">
            <div className="flex items-center">
              <span className="text-neutral-500">tasks&nbsp;</span>
              {input ? (
                <span className="relative">
                  <span className="text-green-500">{nbsp(beforeCursor)}</span>
                  <span
                    key={blinkKey}
                    className="absolute top-0 bottom-0 w-0.5 bg-green-500"
                    style={blinkStyle}
                  />
                  <span className="text-green-500">{nbsp(afterCursor)}</span>
                  {cursorAtEnd && (
                    <span className="text-neutral-600">{autocomplete}</span>
                  )}
                </span>
              ) : (
                <span className="relative">
                  <span
                    key={blinkKey}
                    className="absolute top-0 bottom-0 left-0 w-0.5 bg-green-500"
                    style={blinkStyle}
                  />
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={hintIndex}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 4 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="text-neutral-600 whitespace-nowrap pointer-events-none"
                    >
                      {PLACEHOLDER_HINTS[hintIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onClick={handleInputClick}
              onSelect={syncCursor}
              className="absolute inset-0 opacity-0 w-full cursor-text"
              autoComplete="off"
              spellCheck={false}
            />
          </form>
        </div>
      </div>
    </>
  );
}
