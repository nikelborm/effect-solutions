#!/usr/bin/env bun

import { $ } from "bun"

// Release script that handles everything:
// 1. Generate OG images
// 2. Generate CLI manifest
// 3. Commit any uncommitted changes
// 4. Run changeset version + tag
// 5. Push with tags

async function run() {
  console.log("📸 Generating OG images...")
  await $`bun --cwd packages/website run generate:og`

  console.log("\n📦 Generating CLI manifest...")
  await $`bun --cwd packages/cli scripts/generate-manifest.ts`

  // Check for uncommitted changes
  const status = await $`git status --porcelain`.text()
  if (status.trim()) {
    console.log("\n📝 Committing generated files...")
    await $`git add -A`
    await $`git commit -m "Generate OG images and manifest"`
  }

  // Check if there are changesets to consume
  const changesets = await $`ls .changeset/*.md 2>/dev/null | grep -v README.md || true`.text()
  if (!changesets.trim()) {
    console.log("\n⚠️  No changesets found. Create one with:")
    console.log('   bun scripts/changeset-named.ts "description"')
    process.exit(1)
  }

  console.log("\n🔖 Running changeset version...")
  const token = await $`gh auth token`.text()
  await $`GITHUB_TOKEN=${token.trim()} bunx changeset version`

  console.log("\n🏷️  Creating tags...")
  await $`bunx changeset tag`

  console.log("\n🚀 Pushing with tags...")
  await $`git push --follow-tags`

  console.log("\n✅ Release complete!")
}

run().catch((err) => {
  console.error("❌ Release failed:", err.message)
  process.exit(1)
})
