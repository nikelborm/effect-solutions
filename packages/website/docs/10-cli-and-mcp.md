---
title: CLI & MCP Access
description: "Choose between the Effect Solutions CLI and the MCP server to pull docs into your workflow."
order: 10
---

# CLI & MCP Access

Effect Solutions exposes the same documentation through two delivery paths so both humans and AI copilots can stay in sync.

## CLI Quickstart

- `bunx effect-solutions list` prints every available slug with a one-line description.
- `bunx effect-solutions show <slug...>` streams any combination of docs to `stdout`. Use terminal paging (`| less -R`) to scroll.
- The CLI is perfect for grepping, redirecting into files, or running from scripts where STDOUT piping is handy.

## MCP Server Quickstart

1. Build once (optional): `bun run build:mcp`
2. Start the server in stdio mode: `bun run dev:mcp`
3. Point your MCP-aware client (ChatGPT desktop, Claude Desktop, OpenAI Agents SDK, etc.) to run `bun run dev:mcp` inside this repo.
4. Browse resources such as `effect-docs://topics` or open any doc via the `effect-docs://<slug>` template (auto-complete is provided).

The MCP server is implemented with `@effect/ai`’s `McpServer.layerStdio`, so it inherits Effect’s streaming, logging, and resource template support. Use it whenever your AI tooling can talk MCP and you want rich resource metadata plus completions.

## Choosing Between Them

- Prefer the CLI for shell pipelines, onboarding scripts, or quick terminal previews.
- Prefer MCP when you want agents to pull docs on demand, cache resource templates, or navigate via completions instead of parsing terminal output.

Both entrypoints read from the same docs manifest, so updating a markdown file automatically updates the CLI *and* MCP resources.

