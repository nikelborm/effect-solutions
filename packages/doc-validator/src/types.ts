export interface ValidationResult {
  /** Name of the validation target */
  targetName: string
  /** Whether validation passed */
  passed: boolean
  /** Discrepancies found (if any) */
  discrepancies: Discrepancy[]
  /** Raw findings from Claude */
  rawFindings?: string
}

export interface Discrepancy {
  /** Section or topic where discrepancy was found */
  section: string
  /** Description of the issue */
  issue: string
  /** Severity level */
  severity: "high" | "medium" | "low"
  /** Suggested fix (if available) */
  suggestedFix?: string
}

export interface GitHubIssueData {
  title: string
  body: string
  labels?: string[]
}
