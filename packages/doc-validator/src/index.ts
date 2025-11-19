#!/usr/bin/env bun

import { Effect, Console, Array } from "effect"
import { validationTargets } from "./validators.config"
import { validateDoc } from "./validators/doc-validator"
import { createIssue } from "./github/reporter"
import type { ValidationResult } from "./types"

/**
 * Main validation orchestrator
 * Runs all configured validators and reports findings
 */
const main = Effect.gen(function* () {
  yield* Console.log("🔍 Starting documentation validation...")
  yield* Console.log(`Checking ${validationTargets.length} target(s)\n`)

  // Run all validators in parallel
  const results: ValidationResult[] = yield* Effect.all(
    validationTargets.map(validateDoc),
    { concurrency: 3 },
  )

  // Print summary
  yield* Console.log("\n📊 Validation Summary:")
  for (const result of results) {
    const status = result.passed ? "✓" : "✗"
    const color = result.passed ? "green" : "red"
    yield* Console.log(
      `  ${status} ${result.targetName} - ${result.discrepancies.length} issue(s)`,
    )
  }

  // Report to GitHub if any failures
  const failedCount = results.filter((r) => !r.passed).length
  if (failedCount > 0) {
    yield* Console.log(`\n⚠️  ${failedCount} validation(s) failed`)

    // Check if we're in CI environment
    const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true"
    if (isCI) {
      yield* Console.log("Creating GitHub issue...")
      yield* createIssue(results)
    } else {
      yield* Console.log("(Skipping GitHub issue creation - not in CI)")
    }

    // Exit with error code in CI
    if (isCI) {
      process.exitCode = 1
    }
  } else {
    yield* Console.log("\n✓ All documentation is up to date!")
  }
})

// Run with error handling
Effect.runPromise(
  main.pipe(
    Effect.catchAll((error) =>
      Console.error(`\n❌ Validation failed: ${error.message}`).pipe(
        Effect.tap(() => Effect.sync(() => (process.exitCode = 1))),
      ),
    ),
  ),
)
