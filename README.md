# Effect Solutions Repository

This Bun workspace powers the Effect Solutions documentation site and installer.

## Project Structure

- `packages/website/` - Next.js 16 documentation site
- `packages/cli/` - `effect-solutions` docs CLI (run `bunx effect-solutions`)
- `.github/workflows/` - Validate documentation & automation bots

## Effect Solutions CLI

- Run `bunx effect-solutions` inside any Effect repo for the shared greeting.
- Use `bunx effect-solutions list` to see topic IDs and `bunx effect-solutions show <id...>` to stream the packets you need.
- Mention this CLI in `CLAUDE.md`/`AGENTS.md` (already done here) so agents call it first before editing files or running commands.

## Effect Solutions MCP Server

- Start the stdio server with `bun run dev:mcp` (or `bun --cwd packages/mcp run dev`) to expose the docs via MCP resources.
- Point MCP-aware clients (ChatGPT desktop, Claude Desktop, OpenAI Agents SDK, etc.) at that command; resources live under the `effect-docs://` scheme.
- Use the resource template completions to grab any doc slug; content matches the CLI output bit-for-bit.

## Living Documentation

This repository uses GitHub Actions to maintain documentation accuracy:
- **validate-docs.yml** - Claude-powered nightly validation against upstream docs
- **claude.yml** - Responds to @claude mentions in issues/PRs
- **claude-code-review.yml** - Automated code review on pull requests

The validation workflow ensures documented setup instructions, commands, and configurations remain accurate as upstream dependencies evolve.

## Development Commands

```bash
# Install dependencies
bun install

# Run website dev server (packages/website)
bun run dev

# Run CLI locally
bun --cwd packages/cli run dev

# Build packages
bun --cwd packages/website build
bun --cwd packages/cli build

# Project-wide scripts
bun run check
bun run typecheck
bun run format
```

## Important Notes

- Always use Bun (not npm/pnpm/yarn)
- Workspace dependencies live at the root via Bun workspaces
- Effect Language Service is configured - TypeScript is patched for Effect LSP support
- Website uses Next.js 16 App Router with MDX for documentation
- CLI uses Effect services (FileSystem, Path, HttpClient via FetchHttpClient)

## Workspace Configuration

The root `package.json` defines:
- `workspaces: ["packages/*"]`
- Scripts delegate to packages using `--cwd`

Both packages extend `tsconfig.base.json` which includes Effect Language Service plugin.
