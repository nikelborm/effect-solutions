# Documentation Validator

Automated documentation validation tool that checks if your docs are up-to-date with source repositories.

## How It Works

1. **Configuration**: Define validation targets in `src/validators.config.ts`
2. **Validation**: Uses Claude AI to compare local docs vs source repositories
3. **Reporting**: Creates GitHub issues when discrepancies are found
4. **Automation**: Runs daily via GitHub Actions

## Setup

### 1. Add Validation Targets

Edit `src/validators.config.ts`:

```typescript
export const validationTargets: ValidationTarget[] = [
  {
    name: "Effect Language Service Setup",
    localDocPath: "packages/website/references/effect-lsp.md",
    sourceRepo: "Effect-TS/effect-language-service",
    sourcePath: "README.md",
  },
  // Add more targets...
]
```

### 2. Configure GitHub Secrets

Add to your repository secrets:

- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `GITHUB_TOKEN` - Auto-provided by GitHub Actions

### 3. Run Locally

```bash
# Install dependencies
bun install

# Run validation
bun run validate

# Set API key first
export ANTHROPIC_API_KEY=your_key_here
bun run validate
```

### 4. GitHub Actions

The workflow at `.github/workflows/validate-docs.yml` runs:

- Daily at midnight UTC (cron schedule)
- Manually via workflow_dispatch
- Optionally on pushes to main

## Architecture

```
packages/doc-validator/
├── src/
│   ├── index.ts                  # Main orchestrator
│   ├── types.ts                  # TypeScript types
│   ├── validators.config.ts      # Validation targets
│   ├── validators/
│   │   └── doc-validator.ts      # Core validation logic
│   └── github/
│       └── reporter.ts           # GitHub issue creation
```

## Environment Variables

- `ANTHROPIC_API_KEY` - Required for Claude API
- `GITHUB_TOKEN` - Required for creating issues (auto-set in Actions)
- `CI` - Detected automatically to enable GitHub reporting

## Output

When discrepancies are found, creates issues like:

```markdown
## Automated Documentation Validation Report

### Effect Language Service Setup

**Status:** ❌ Failed

**Discrepancies:**
- **[HIGH]** Installation Instructions
  - Issue: Setup steps outdated, missing new CLI flag
  - Suggested Fix: Update to use --patch flag

## Next Steps
1. Review the discrepancies above
2. Update local documentation
3. Close issue once resolved
```

## Future Enhancements

- [ ] Auto-create PRs with fixes (not just issues)
- [ ] Support more source types (npm packages, APIs)
- [ ] Slack/Discord notifications
- [ ] Configurable validation prompts per target
