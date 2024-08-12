/**
 * Utilities for formatting human readable output (CLI or other UIs)
 */
import { prettyBytes } from '../deps/prettyBytes.ts'
import { Table } from '../deps/cliffy.ts'
import { colors } from '../deps/fmt.ts'
import { SummaryOutput, ValidationResult } from '../types/validation-result.ts'
import { Issue, Severity } from '../types/issues.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'

interface LoggingOptions {
  verbose: boolean
}

/**
 * Format for Unix consoles
 *
 * Returns the full output string with newlines
 */
export function consoleFormat(
  result: ValidationResult,
  options?: LoggingOptions,
): string {
  const output = []
  if (result.issues.size === 0) {
    output.push(colors.green('This dataset appears to be BIDS compatible.'))
  } else {
    (['warning', 'error'] as Severity[]).map(severity => {
      output.push(...formatIssues(result.issues.filter({severity}), options, severity))
    })
  }
  output.push('')
  output.push(formatSummary(result.summary))
  output.push('')
  return output.join('\n')
}

function formatIssues(dsIssues: DatasetIssues, options?: LoggingOptions, severity = 'error'): string[] {
  let output = []
  const color = severity === 'error' ? 'red' : 'yellow'

  for (const [code, issues] of dsIssues.groupBy('code').entries()) {
    if (issues.size === 0 || typeof code !== 'string') {
      continue
    }
    const codeMessage = issues.codeMessages.get(code) ?? ''
    output.push(
      '\t' +
        colors[color](
          `[${severity.toUpperCase()}] ${code} ${codeMessage}`,
        ),
    )

    let subCodes = issues.groupBy('subCode')
    if (subCodes.size === 1 && subCodes.has('None')) {
      output.push(...formatFiles(issues))
    } else {
      for (const [subCode, subIssues] of subCodes) {
        if (subIssues.size === 0) {
          continue
        }
        output.push('\t\t' + colors[color](`${subCode}`))
        output.push(...formatFiles(subIssues, options))
      }
    }
  }
  return output
}

function formatFiles(issues: DatasetIssues, options?: LoggingOptions): string[] {
  let output = []
  const issueDetails: Array<keyof Issue> = ['location', 'issueMessage', 'rule']
  const fileCount = options?.verbose ? undefined : 2

  let toPrint = issues.issues.slice(0, fileCount)
  toPrint.map((issue: Issue) => {
    let fileOut: string[] = []
      issueDetails.map(key => {
      if (Object.hasOwn(issue, key) && issue[key]) {
        fileOut.push(`${issue[key]}`)
      }
    })
    output.push('\t\t' + fileOut.join(' - '))
  })
  if (fileCount && fileCount < issues.size) {
    output.push('')
    output.push(`\t\t${issues.size - fileCount} more files with the same issue`)
  }
  return output
}

/**
 * Format for the summary
 */
function formatSummary(summary: SummaryOutput): string {
  const output = []
  const numSessions = summary.sessions.length > 0 ? summary.sessions.length : 1

  // data
  const column1 = [
      summary.totalFiles + ' ' + 'Files' + ', ' + prettyBytes(summary.size),
      summary.subjects.length +
      ' - ' +
      'Subjects ' +
      numSessions +
      ' - ' +
      'Sessions',
    ],
    column2 = summary.tasks,
    column3 = summary.modalities

  const longestColumn = Math.max(column1.length, column2.length, column3.length)
  const pad = '       '

  // headers
  const headers = [
    pad,
    colors.magenta('Summary:') + pad,
    colors.magenta('Available Tasks:') + pad,
    colors.magenta('Available Modalities:'),
  ]

  // rows
  const rows = []
  for (let i = 0; i < longestColumn; i++) {
    const val1 = column1[i] ? column1[i] + pad : ''
    const val2 = column2[i] ? column2[i] + pad : ''
    const val3 = column3[i] ? column3[i] : ''
    rows.push([pad, val1, val2, val3])
  }
  const table = new Table()
    .header(headers)
    .body(rows)
    .border(false)
    .padding(1)
    .indent(2)
    .toString()

  output.push(table)

  output.push('')

  //Neurostars message
  output.push(
    colors.cyan(
      '\tIf you have any questions, please post on https://neurostars.org/tags/bids.',
    ),
  )

  return output.join('\n')
}
