import { nonSchemaIssues } from './list.ts'
import {
  FullTestIssuesReturn,
  Issue,
  IssueFile,
  IssueFileOutput,
  IssueOutput,
  Severity,
} from '../types/issues.ts'

// Code is deprecated, return something unusual but JSON serializable
const CODE_DEPRECATED = Number.MIN_SAFE_INTEGER

/**
 * Format an internal file reference with context as IssueFileOutput
 */
const issueFile = (issue: Issue, f: IssueFile): IssueFileOutput => {
  const evidence = f.evidence || ''
  const reason = issue.reason || ''
  const line = f.line || 0
  const character = f.character || 0
  return {
    key: issue.key,
    code: CODE_DEPRECATED,
    file: { path: f.path, name: f.name, relativePath: f.path },
    evidence,
    line,
    character,
    severity: issue.severity,
    reason,
    helpUrl: issue.helpUrl,
  }
}

interface DatasetIssuesAddParams {
  key: string
  reason: string
  // Defaults to error
  severity?: Severity
  // Defaults to an empty array if no files are provided
  files?: Array<IssueFile>
}

/**
 * Management class for dataset issues
 */
export class ldDatasetIssues extends Map<string, Issue> {
  constructor() {
    super()
  }

  add({
    key,
    reason,
    severity = 'error',
    files = [],
  }: DatasetIssuesAddParams): Issue {
    const existingIssue = this.get(key)
    // Handle both the shorthand BIDSFile array or full IssueFile
    if (existingIssue) {
      for (const f of files) {
        existingIssue.files.set(f.path, f)
      }
      return existingIssue
    } else {
      const newIssue = new Issue({
        key,
        severity,
        reason,
        files,
      })
      this.set(key, newIssue)
      return newIssue
    }
  }

  // Shorthand to test if an issue has occurred
  hasIssue({ key }: { key: string }): boolean {
    if (this.has(key)) {
      return true
    }
    return false
  }

  addNonSchemaIssue(key: string, files: Array<IssueFile>) {
    if (key in nonSchemaIssues) {
      this.add({
        key,
        reason: nonSchemaIssues[key].reason,
        severity: nonSchemaIssues[key].severity,
        files,
      })
    } else {
      throw new Error(
        `key: ${key} does not exist in non-schema issues definitions`,
      )
    }
  }

  fileInIssues(path: string): Issue[] {
    const matchingIssues = []
    for (const [key, issue] of this) {
      if (issue.files.get(path)) {
        matchingIssues.push(issue)
      }
    }
    return matchingIssues
  }

  /**
   * Report Issue keys related to a file
   * @param path File path relative to dataset root
   * @returns Array of matching issue keys
   */
  getFileIssueKeys(path: string): string[] {
    return this.fileInIssues(path).map((issue) => issue.key)
  }

  /**
   * Format output
   *
   * Converts from new internal representation to old IssueOutput structure
   */
  formatOutput(): FullTestIssuesReturn {
    const output: FullTestIssuesReturn = {
      errors: [],
      warnings: [],
    }
    for (const [key, issue] of this) {
      const outputIssue: IssueOutput = {
        severity: issue.severity,
        key: issue.key,
        code: CODE_DEPRECATED,
        additionalFileCount: 0,
        reason: issue.reason,
        files: Array.from(issue.files.values()).map((f) => issueFile(issue, f)),
        helpUrl: issue.helpUrl,
      }
      if (issue.severity === 'warning') {
        output.warnings.push(outputIssue)
      } else {
        output.errors.push(outputIssue)
      }
    }
    return output
  }
}

/*
  location - path that triggered rule
  nextIssue - if we want linked list for map collisions
 */
export interface _Issue {
  code: string
  subCode?: string
  severity?: Severity
  location?: string
  issueMessage?: string
  codeMessage?: string
  suggestion?: string
  affects?: string[]
  rule?: string
  nextIssue?: _Issue
}

//export class _DatasetIssues extends Map<[string, string, string?], _Issue> {
export class DatasetIssues {
  issues: _Issue[]
  codeMessages: Map<string, string>

  constructor() {
    this.issues = []
    this.codeMessages = new Map()
  }

  add(issue: _Issue) {
    if (!issue.codeMessage) {
      if (issue.code in nonSchemaIssues) {
        issue.codeMessage = nonSchemaIssues[issue.code].reason
        issue.severity ??= nonSchemaIssues[issue.code].severity
      } else {
        throw new Error(
          `key: ${issue.code} does not exist in non-schema issues definitions`,
        )
      }
    }
    issue.severity ??= 'error'
    if (!this.codeMessages.has(issue.code)) {
      this.codeMessages.set(issue.code, issue.codeMessage)
    }
    this.issues.push(issue)
  }

  get(issue: Partial<_Issue>): _Issue[] {
    let found: _Issue[] = this.issues
    for (const key in issue) {
      const value = issue[key as keyof _Issue]
      if (!value) {
        continue
      }
      found = found.filter((x) => x[key as keyof _Issue] === value)
    }
    return found
  }
  get size(): number {
    return this.issues.length
  }
}
