---
title: Repo Setup
order: 1
---

# Repo Setup

## Effect Language Service

Install Effect Language Service for editor diagnostics and compile-time type checking.

### Installation

```bash
bun add -d @effect/language-service
```

Add the plugin to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@effect/language-service"
      }
    ]
  }
}
```

### VS Code Setup

1. Press F1 → "TypeScript: Select TypeScript version"
2. Choose "Use workspace version"
3. Add to `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "./node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Enable Build-Time Diagnostics

Patch TypeScript to get Effect diagnostics during compilation:

```bash
bunx effect-language-service patch
```

Add to `package.json` to persist across installs:

```json
{
  "scripts": {
    "prepare": "effect-language-service patch"
  }
}
```

**Full guide:** [Effect Language Service](https://github.com/Effect-TS/language-service)

## TypeScript Configuration

Effect projects benefit from strict TypeScript configuration for safety and performance.

**See:** [TypeScript Configuration Guide](./tsconfig.md)

Reference configuration from Effect v4:
[effect-smol tsconfig.base.jsonc](https://github.com/Effect-TS/effect-smol/blob/main/tsconfig.base.jsonc)
