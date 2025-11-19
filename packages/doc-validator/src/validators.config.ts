/**
 * Configuration for documentation validators
 * Add new validation targets here
 */

export interface ValidationTarget {
  /** Name of the validation (used in reports) */
  name: string
  /** Path to the local documentation file to validate */
  localDocPath: string
  /** Source repository to compare against */
  sourceRepo: string
  /** Specific file or section to compare against (optional) */
  sourcePath?: string
  /** Custom validation prompt (optional) */
  customPrompt?: string
}

export const validationTargets: ValidationTarget[] = [
  {
    name: "Effect Language Service Setup",
    localDocPath: "packages/website/references/01-repo-setup.md",
    sourceRepo: "Effect-TS/effect-language-service",
    sourcePath: "README.md",
  },
]
