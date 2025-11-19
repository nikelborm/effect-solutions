#!/usr/bin/env bun

import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Console, Effect, pipe } from "effect";
import { Args, Command } from "@effect/cli";
import { ENTRY, TOPIC_LOOKUP, TOPICS } from "./docs-manifest";
import pc from "picocolors";

const CLI_NAME = "effect-solutions";
const CLI_VERSION = "0.2.0";

const isTopicId = (value: string): value is keyof typeof TOPIC_LOOKUP =>
  value in TOPIC_LOOKUP;

const colorizeCodeReferences = (text: string): string => {
  return text
    // Commands in bold green
    .replace(/`bunx [^`]+`/g, (match) => pc.bold(pc.green(match)))
    .replace(/`bun run [^`]+`/g, (match) => pc.bold(pc.green(match)))
    // File references in cyan
    .replace(/`[^`]+\.(ts|json|toml|md)`/g, (match) => pc.cyan(match))
    // Other code in dim
    .replace(/`[^`]+`/g, (match) => pc.dim(match));
};

export const renderEntryDocument = () => {
  const lines = ENTRY.split("\n");
  const colored = lines.map((line) => {
    // Headers
    if (line.startsWith("Hello human")) {
      return pc.bold(pc.cyan(line));
    }
    if (line.startsWith("Hello agent")) {
      return pc.bold(pc.magenta(line));
    }

    // Bullet points
    if (line.startsWith("•")) {
      const content = colorizeCodeReferences(line.slice(2));
      return pc.dim("•") + " " + content;
    }

    // Indented list items (with -)
    if (line.trim().startsWith("-")) {
      let content = colorizeCodeReferences(line);
      // Dim the separator and the dash
      content = content.replace(/ — /, pc.dim(" — "));
      return content.replace(/^(\s+)-/, (match) => match.slice(0, -1) + pc.dim("-"));
    }

    return line;
  });
  return `${colored.join("\n")}\n`;
};

const formatRow = (idWidth: number, titleWidth: number) =>
  (id: string, title: string, summary: string) =>
    `${id.padEnd(idWidth)}  ${title.padEnd(titleWidth)}  ${summary}`;

export const renderTopicList = () => {
  const idWidth = Math.max("ID".length, ...TOPICS.map((topic) => topic.id.length));
  const titleWidth = Math.max(
    "Title".length,
    ...TOPICS.map((topic) => topic.title.length),
  );

  const format = formatRow(idWidth, titleWidth);
  const header = pc.bold(pc.cyan(format("ID", "Title", "Summary")));
  const separator = pc.dim(`${"-".repeat(idWidth)}  ${"-".repeat(titleWidth)}  ${"-".repeat(20)}`);

  const rows = TOPICS.map((topic) =>
    format(pc.green(topic.id), pc.yellow(topic.title), pc.dim(topic.summary)));

  const lines = [header, separator, ...rows];

  return `${lines.join("\n")}\n`;
};

export const renderTopics = (requested: ReadonlyArray<string>) => {
  const ids = requested.map((id) => id.trim()).filter(Boolean);

  if (ids.length === 0) {
    throw new Error("Please provide at least one topic id.");
  }

  const unknown = ids.filter((id) => !isTopicId(id));
  if (unknown.length > 0) {
    throw new Error(`Unknown topic id(s): ${unknown.join(", ")}`);
  }

  const uniqueIds = Array.from(new Set(ids));
  const blocks = uniqueIds.map((id) => {
    const topic = TOPIC_LOOKUP[id];
    const title = pc.bold(pc.cyan(`## ${topic.title}`)) + " " + pc.dim(`(${topic.id})`);
    return [title, "", topic.body.trim()]
      .filter(Boolean)
      .join("\n");
  });

  return `${blocks.join("\n\n" + pc.dim("---") + "\n\n")}\n`;
};

const printEntryDocument = Console.log(renderEntryDocument());

const listTopics = Console.log(renderTopicList());

const showTopics = (topics: ReadonlyArray<string>) =>
  Effect.try({
    try: () => renderTopics(topics),
  }).pipe(Effect.flatMap((output) => Console.log(output)));

const listCommand = Command.make("list").pipe(
  Command.withDescription("List Effect Solutions documentation topics"),
  Command.withHandler(() => listTopics),
);

const showCommand = Command.make("show", {
  topics: Args.text({ name: "topic-id" }).pipe(Args.atLeast(1)),
}).pipe(
  Command.withDescription("Show one or more Effect Solutions topics"),
  Command.withHandler(({ topics }) => showTopics(topics)),
);

export const cli = Command.make(CLI_NAME).pipe(
  Command.withDescription("Effect Solutions CLI"),
  Command.withHandler(() => printEntryDocument),
  Command.withSubcommands([listCommand, showCommand]),
);

export const runCli = (argv: ReadonlyArray<string>) =>
  Command.run(cli, {
    name: CLI_NAME,
    version: CLI_VERSION,
  })(argv);

if (import.meta.main) {
  pipe(
    runCli(process.argv),
    Effect.provide(BunContext.layer),
    BunRuntime.runMain,
  );
}
