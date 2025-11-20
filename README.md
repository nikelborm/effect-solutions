# Effect Solutions

Effect best practices and patterns for humans and AI agents — https://www.effect.solutions

## Project Structure

- `packages/website/` - Documentation site
- `packages/cli/` - CLI for local docs access
- `packages/mcp/` - MCP server for AI agent integration
- `.github/workflows/` - Automated validation & bots

## Quick Links

- **Website**: https://www.effect.solutions
- **CLI**: `bunx effect-solutions@latest list`
- **MCP**: See website for setup instructions

## Development

```bash
bun install          # Install dependencies
bun run dev          # Website dev server
bun run dev:cli      # CLI dev mode
bun run dev:mcp      # MCP server dev mode
bun run check        # Lint & typecheck
bun run format       # Format code
```

## Changesets & Publishing

```bash
bunx changeset       # Create changeset after discrete work
bun release          # Version, build, publish all packages
```

**Change types:**
- `patch` - Bug fixes, docs updates, minor tweaks
- `minor` - New features, backwards-compatible changes
- `major` - Breaking changes

## Workspace

Bun workspace with `workspaces: ["packages/*"]`. Effect Language Service configured via `tsconfig.base.json`.

## Design Notes

UI components use hard edges — no border radius (use `rounded-none` or omit rounding).
