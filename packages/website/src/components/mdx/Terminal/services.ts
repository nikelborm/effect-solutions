import * as FileSystem from "@effect/platform/FileSystem";
import { KeyValueStore } from "@effect/platform/KeyValueStore";
import * as Path from "@effect/platform/Path";
import { Terminal } from "@effect/platform/Terminal";
import { BrowserKeyValueStore } from "@effect/platform-browser";
import {
  Console,
  Context,
  Effect,
  Layer,
  ManagedRuntime,
  Option,
  Ref,
} from "effect";
import { Task, TaskId, TaskList, TaskRepo } from "./domain";

// =============================================================================
// Browser TaskRepo (KeyValueStore)
// =============================================================================

const STORAGE_KEY = "effect-solutions-tasks-demo";
const INITIALIZED_KEY = "effect-solutions-tasks-initialized";

const DEFAULT_TASKS = TaskList.make({
  tasks: [
    Task.make({
      id: TaskId.make(1),
      text: "Run the agent-guided setup",
      done: false,
    }),
    Task.make({
      id: TaskId.make(2),
      text: "Become effect-pilled",
      done: false,
    }),
  ],
});

const browserTaskRepoLayer = Layer.effect(
  TaskRepo,
  Effect.gen(function* () {
    const kv = (yield* KeyValueStore).forSchema(TaskList);

    const loadTaskList = Effect.gen(function* () {
      const initialized = yield* kv.has(INITIALIZED_KEY);
      if (!initialized) {
        yield* kv.set(INITIALIZED_KEY, TaskList.empty);
        yield* kv.set(STORAGE_KEY, DEFAULT_TASKS);
        return DEFAULT_TASKS;
      }
      const stored = yield* kv.get(STORAGE_KEY);
      return Option.getOrElse(stored, () => TaskList.empty);
    }).pipe(Effect.orElseSucceed(() => TaskList.empty));

    const saveTaskList = (list: TaskList) =>
      kv.set(STORAGE_KEY, list).pipe(Effect.ignore);

    return TaskRepo.of({
      list: Effect.fn("TaskRepo.list")(function* (all?: boolean) {
        const taskList = yield* loadTaskList;
        return all ? taskList.tasks : taskList.tasks.filter((t) => !t.done);
      }),
      add: Effect.fn("TaskRepo.add")(function* (text: string) {
        const list = yield* loadTaskList;
        const [newList, task] = list.add(text);
        yield* saveTaskList(newList);
        return task;
      }),
      toggle: Effect.fn("TaskRepo.toggle")(function* (id: TaskId) {
        const list = yield* loadTaskList;
        const [newList, task] = list.toggle(id);
        yield* saveTaskList(newList);
        return task;
      }),
      clear: Effect.fn("TaskRepo.clear")(function* () {
        yield* saveTaskList(TaskList.empty);
      }),
    });
  }),
).pipe(Layer.provide(BrowserKeyValueStore.layerLocalStorage));

// =============================================================================
// Mock Console (captures output) - based on Effect's test services
// =============================================================================

export interface MockConsole extends Console.Console {
  readonly getLines: () => Effect.Effect<ReadonlyArray<string>>;
}

const MockConsoleTag = Context.GenericTag<Console.Console, MockConsole>(
  "effect/Console",
);

export const makeConsoleMock = Effect.gen(function* () {
  const lines = yield* Ref.make<string[]>([]);

  const getLines: MockConsole["getLines"] = () => Ref.get(lines);

  const log: MockConsole["log"] = (...args) =>
    Ref.update(lines, (l) => [...l, ...args.map(String)]);

  return {
    console: MockConsoleTag.of({
      [Console.TypeId]: Console.TypeId,
      getLines,
      log,
      unsafe: globalThis.console,
      assert: () => Effect.void,
      clear: Effect.void,
      count: () => Effect.void,
      countReset: () => Effect.void,
      debug: () => Effect.void,
      dir: () => Effect.void,
      dirxml: () => Effect.void,
      error: log, // Also capture errors
      group: () => Effect.void,
      groupEnd: Effect.void,
      info: () => Effect.void,
      table: () => Effect.void,
      time: () => Effect.void,
      timeEnd: () => Effect.void,
      timeLog: () => Effect.void,
      trace: () => Effect.void,
      warn: () => Effect.void,
    }),
    getLines,
  };
});

// =============================================================================
// Mock Platform Services (minimal browser stubs)
// =============================================================================

// Terminal mock - only implement what we need, others throw UnimplementedError
const mockTerminalLayer = Layer.mock(Terminal, {
  columns: Effect.succeed(80),
  display: (text: string) => Console.log(text),
});

// FileSystem.layerNoop provides a no-op FileSystem where all operations fail by default
const mockFileSystemLayer = FileSystem.layerNoop({});

// Path.layer is a built-in cross-platform Path implementation that works in browsers
const mockPathLayer = Path.layer;

// Combined browser platform layer
const browserPlatformLayer = Layer.mergeAll(
  mockTerminalLayer,
  mockFileSystemLayer,
  mockPathLayer,
);

// Combined layer for all browser services
const browserLiveLayer = Layer.mergeAll(
  browserPlatformLayer,
  browserTaskRepoLayer,
);

// Managed runtime with all browser services baked in
export const BrowserRuntime = ManagedRuntime.make(browserLiveLayer);

export { STORAGE_KEY, INITIALIZED_KEY };
