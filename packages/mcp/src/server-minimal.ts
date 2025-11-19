#!/usr/bin/env bun

import { McpServer } from "@effect/ai";
import { BunRuntime, BunSink, BunStream } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

const TestResource = McpServer.resource({
  uri: "test://hello",
  name: "Test Resource",
  description: "Simple test",
  mimeType: "text/plain",
  content: Effect.succeed("Hello World")
});

const serverLayer = Layer.mergeAll(TestResource).pipe(
  Layer.provide(
    McpServer.layerStdio({
      name: "test-server",
      version: "0.1.0",
      stdin: BunStream.stdin,
      stdout: BunSink.stdout,
    }),
  ),
);

Layer.launch(serverLayer).pipe(BunRuntime.runMain);
