import { Effect, Console } from "effect"
import type { ValidationTarget, ValidationResult, Discrepancy } from "../types"
import * as fs from "node:fs/promises"
import * as path from "node:path"

/**
 * Validates a documentation file against its source repository
 */
export const validateDoc = (target: ValidationTarget): Effect.Effect<ValidationResult, Error> =>
  Effect.gen(function* () {
    yield* Console.log(`Validating: ${target.name}`)

    // Read local documentation
    const repoRoot = path.resolve(process.cwd(), "../..")
    const localDocPath = path.join(repoRoot, target.localDocPath)
    const localDoc = yield* Effect.tryPromise({
      try: () => fs.readFile(localDocPath, "utf-8"),
      catch: (error) => new Error(`Failed to read local doc: ${error}`),
    })

    // Fetch source repository file
    const sourceUrl = `https://raw.githubusercontent.com/${target.sourceRepo}/main/${target.sourcePath || "README.md"}`
    const sourceDoc = yield* Effect.tryPromise({
      try: async () => {
        const response = await fetch(sourceUrl)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.text()
      },
      catch: (error) => new Error(`Failed to fetch source doc: ${error}`),
    })

    // Use Claude Agent SDK to compare documents
    const comparisonResult = yield* compareDocuments(
      localDoc,
      sourceDoc,
      target.customPrompt,
    )

    // Parse findings into structured format
    const discrepancies = parseDiscrepancies(comparisonResult)

    return {
      targetName: target.name,
      passed: discrepancies.length === 0,
      discrepancies,
      rawFindings: comparisonResult,
    }
  })

/**
 * Uses Claude Agent SDK to compare two documents
 */
const compareDocuments = (
  localDoc: string,
  sourceDoc: string,
  customPrompt?: string,
): Effect.Effect<string, Error> =>
  Effect.gen(function* () {
    // Import Agent SDK dynamically to handle ESM
    const { default: Anthropic } = yield* Effect.tryPromise({
      try: () => import("@anthropic-ai/sdk"),
      catch: (error) => new Error(`Failed to import Anthropic SDK: ${error}`),
    })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return yield* Effect.fail(
        new Error("ANTHROPIC_API_KEY environment variable not set"),
      )
    }

    const client = new Anthropic({ apiKey })

    const defaultPrompt = `Compare these two documentation files and identify any discrepancies, outdated information, or missing best practices.

LOCAL DOCUMENTATION:
\`\`\`markdown
${localDoc.slice(0, 4000)}
\`\`\`

SOURCE DOCUMENTATION:
\`\`\`markdown
${sourceDoc.slice(0, 4000)}
\`\`\`

Return findings as JSON array:
[
  {
    "section": "Section name",
    "issue": "Description of discrepancy",
    "severity": "high|medium|low",
    "suggestedFix": "Optional fix suggestion"
  }
]

If no discrepancies found, return empty array: []`

    const prompt = customPrompt || defaultPrompt

    const response = yield* Effect.tryPromise({
      try: () =>
        client.messages.create({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        }),
      catch: (error) => new Error(`Claude API call failed: ${error}`),
    })

    const textContent = response.content.find((c) => c.type === "text")
    if (!textContent || textContent.type !== "text") {
      return yield* Effect.fail(new Error("No text response from Claude"))
    }

    return textContent.text
  })

/**
 * Parses Claude's response into structured discrepancies
 */
const parseDiscrepancies = (rawFindings: string): Discrepancy[] => {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = rawFindings.match(/```json\s*([\s\S]*?)\s*```/) ||
      rawFindings.match(/\[[\s\S]*\]/)

    if (!jsonMatch) {
      // If no structured data found, return empty (no discrepancies)
      return []
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    if (Array.isArray(parsed)) {
      return parsed
    }

    return []
  } catch (error) {
    console.error("Failed to parse discrepancies:", error)
    return []
  }
}
