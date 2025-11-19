#!/usr/bin/env bun

import { DOC_LOOKUP, DOCS } from "../../cli/src/docs-manifest";
import { McpSchema, McpServer } from "@effect/ai";
import { BunRuntime, BunSink, BunStream } from "@effect/platform-bun";
import { Effect, Layer, Schema } from "effect";

const SERVER_NAME = "effect-solutions";
const SERVER_VERSION = "0.1.0";
const DOC_URI_PREFIX = "effect-docs://";

const docCompletionValues = DOCS.map((doc) => doc.slug);

const lookupDocMarkdown = (slug: string) =>
  Effect.try(() => {
    const doc = DOC_LOOKUP[slug];
    if (!doc) {
      throw new Error(`Unknown doc slug: ${slug}`);
    }
    return `# ${doc.title} (${doc.slug})\n\n${doc.body}`.trimEnd();
  });

const listMarkdown = [
  "# Effect Solutions Documentation Index",
  "",
  ...DOCS.map((doc) => `- **${doc.slug}** — ${doc.title}: ${doc.description}`),
].join("\n");

const docSlugParam = McpSchema.param("slug", Schema.String);

const DocsIndexResource = McpServer.resource({
  uri: "effect-docs://docs/topics",
  name: "Effect Solutions Topics",
  description: "Markdown index of all Effect Solutions documentation slugs.",
  mimeType: "text/markdown",
  content: Effect.succeed(listMarkdown),
});

const DocsTemplate = McpServer.resource`effect-docs://${docSlugParam}`({
  name: "Effect Solutions Doc",
  description:
    "Fetch any Effect Solutions doc by slug (see completions for available slugs).",
  mimeType: "text/markdown",
  completion: {
    slug: () => Effect.succeed(docCompletionValues),
  },
  content: (_uri, slug: string) => lookupDocMarkdown(slug),
});

const serverLayer = Layer.mergeAll(
  DocsIndexResource,
  DocsTemplate,
).pipe(
  Layer.provide(
    McpServer.layerStdio({
      name: SERVER_NAME,
      version: SERVER_VERSION,
      stdin: BunStream.stdin,
      stdout: BunSink.stdout,
    }),
  ),
);

Layer.launch(serverLayer).pipe(BunRuntime.runMain);
