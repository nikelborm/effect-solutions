import { Args, Command, Options } from "@effect/cli";
import { Cause, Console, Effect, Exit, Option } from "effect";
import { TaskId, TaskRepo } from "./domain";
import { BrowserRuntime, makeConsoleMock } from "./services";

// =============================================================================
// CLI Commands
// =============================================================================

// add <task>
const textArg = Args.text({ name: "task" }).pipe(
  Args.withDescription("The task description"),
);

const addCommand = Command.make("add", { text: textArg }, ({ text }) =>
  Effect.gen(function* () {
    const repo = yield* TaskRepo;
    const task = yield* repo.add(text);
    yield* Console.log(`Added task #${task.id}: ${task.text}`);
  }),
).pipe(Command.withDescription("Add a new task"));

// list [--all]
const allOption = Options.boolean("all").pipe(
  Options.withAlias("a"),
  Options.withDescription("Show all tasks including completed"),
);

const listCommand = Command.make("list", { all: allOption }, ({ all }) =>
  Effect.gen(function* () {
    const repo = yield* TaskRepo;
    const tasks = yield* repo.list(all);

    if (tasks.length === 0) {
      yield* Console.log("No tasks.");
      return;
    }

    for (const task of tasks) {
      const status = task.done ? "[x]" : "[ ]";
      yield* Console.log(`${status} #${task.id} ${task.text}`);
    }
  }),
).pipe(Command.withDescription("List pending tasks"));

// toggle <id>
const idArg = Args.integer({ name: "id" }).pipe(
  Args.withSchema(TaskId),
  Args.withDescription("The task ID to toggle"),
);

const toggleCommand = Command.make("toggle", { id: idArg }, ({ id }) =>
  Effect.gen(function* () {
    const repo = yield* TaskRepo;
    const result = yield* repo.toggle(id);

    yield* Option.match(result, {
      onNone: () => Console.log(`Task #${id} not found`),
      onSome: (task) =>
        Console.log(
          `Toggled: ${task.text} (${task.done ? "done" : "pending"})`,
        ),
    });
  }),
).pipe(Command.withDescription("Toggle a task's done status"));

// clear
const clearCommand = Command.make("clear", {}, () =>
  Effect.gen(function* () {
    const repo = yield* TaskRepo;
    yield* repo.clear();
    yield* Console.log("Cleared all tasks.");
  }),
).pipe(Command.withDescription("Clear all tasks"));

// Root command with subcommands
export const app = Command.make("tasks", {}).pipe(
  Command.withDescription("A simple task manager"),
  Command.withSubcommands([
    addCommand,
    listCommand,
    toggleCommand,
    clearCommand,
  ]),
);

export const cli = Command.run(app, {
  name: "tasks",
  version: "1.0.0",
});

// =============================================================================
// Run CLI in Browser
// =============================================================================

export interface CliResult {
  output: string;
  isError?: boolean;
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

export async function runCliCommand(args: string): Promise<CliResult> {
  // Build argv: ["node", "tasks", ...args]
  const argv = ["node", "tasks", ...parseArgs(args)];

  // Create a fresh mock console per command to capture output
  const program = Effect.gen(function* () {
    const { console: mockConsole, getLines } = yield* makeConsoleMock;

    // Use Console.setConsole to properly override the default console
    const consoleLayer = Console.setConsole(mockConsole);

    const exit = yield* cli(argv).pipe(
      Effect.provide(consoleLayer),
      Effect.exit,
    );

    const lines = yield* getLines();
    const output = lines.join("\n");

    if (Exit.isFailure(exit)) {
      // Return captured output as error, or extract error from cause
      if (output) {
        return { output, isError: true };
      }
      const maybeError = Cause.failureOption(exit.cause);
      if (Option.isSome(maybeError)) {
        return { output: String(maybeError.value), isError: true };
      }
      return { output: String(exit.cause), isError: true };
    }

    return { output, isError: false };
  });

  // Use the managed runtime which has platform and repo layers baked in
  return BrowserRuntime.runPromise(program);
}
