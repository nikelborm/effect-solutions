---
title: HTTP Clients
description: "FetchHttpClient + Schema for typed REST calls"
order: 10
draft: true
---

# HTTP Clients (Draft)

Effect wraps Bun/Node fetch so you can build typed REST clients that share schemas with your domain models.

## Install

```bash
bun add @effect/platform
```

## Fetch JSON with Schema validation

```typescript
import { Effect, Schema } from "effect"
import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import { FetchHttpClient } from "@effect/platform/FetchHttpClient"

const User = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String
})
const decodeUser = Schema.decodeUnknownEffect(User)

const request = HttpClientRequest.get("https://api.example.com/users/42").pipe(
  HttpClientRequest.acceptJson,
  HttpClientRequest.bearerToken(process.env.API_TOKEN ?? "")
)

const fetchUser = HttpClient.execute(request).pipe(
  HttpClientResponse.schemaBodyJson(User),
  Effect.flatMap(decodeUser)
)

await fetchUser.pipe(Effect.provide(FetchHttpClient.layer), Effect.runPromise)
```

### Notes

- `HttpClientRequest.acceptJson` sets headers; use other helpers for query params, timeouts, retries, etc.
- `HttpClientResponse.schemaBodyJson` uses the schema to parse and validate the payload, so malformed responses fail fast with `ConfigError`.
- Compose middleware with `HttpClient.mapRequest` / `mapEffect` when you need retries, logging, or auth injection.

## Batching calls with Layers

```typescript
import * as Layer from "effect/Layer"
import * as HttpClient from "@effect/platform/HttpClient"
import { FetchHttpClient } from "@effect/platform/FetchHttpClient"
import { AppConfig } from "./AppConfig"

const HttpLive = FetchHttpClient.layer.pipe(Layer.provideMerge(AppConfig.layer))

const listUsers = HttpClient.get("https://api.example.com/users").pipe(
  HttpClientResponse.schemaBodyJson(Schema.Array(User))
)

const program = Effect.gen(function* () {
  const users = yield* listUsers
  return users.slice(0, 5)
}).pipe(Effect.provide(HttpLive))
```

This keeps HTTP wiring out of your business code and lets CLI, tests, and MCP server share the same typed client.
