import React, { useState } from "react"
import "./App.css"
import { directoryOpen } from "https://esm.sh/browser-fs-access@0.35.0"
import confetti, { create } from 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.module.mjs';
import { fileListToTree, validate } from "../dist/validator/main.js"
import type { ValidationResult } from "../../src/types/validation-result.ts"
import { Collapse } from "./Collapse.tsx"
import { Summary } from "./Summary.tsx"

function Files({ issues }) {
  const unique = new Map(issues.map(({ location, issueMessage }) => {
    return [`${location}${issueMessage ?? ''}`, { location, issueMessage }]
  }))
  return (
    <ul>
      {[...unique.values()].map(({ location, issueMessage }) => {
        return <li key={location}>{location}
          { issueMessage && ` (${issueMessage})` }</li>
      })}
    </ul>
  )
}

function Issue({ data }) {
  const { code, severity } = data.issues[0]
  const ret = []
  for (const [subCode, subIssues] of data.groupBy('subCode')) {
    if (subIssues.size === 0) {
      continue
    }
    const label = `${severity}: ${code}` + (subCode === 'None' ? '' : ` (${subCode})`)
    ret.push(
      <div className={severity}>
        <Collapse label={label}>
          <div>{data.codeMessages.get(code)}</div>
          <Files issues={subIssues.issues}></Files>
          <p>
            <a href={`https://neurostars.org/search?q=${code}`}>
              Search for this issue on Neurostars.
            </a>
          </p>
        </Collapse>
      </div>
    )
  }
  return ret
}

function App() {
  const [validation, setValidation] = useState<ValidationResult>()

  async function validateDir() {
    const dirHandle = await directoryOpen({
      recursive: true,
    })
    const fileTree = await fileListToTree(dirHandle)
    setValidation(await validate(fileTree, {}))
  }

  let validatorOutput

  if (validation) {
    const errorList = []
    const warningList = []
    let success = ""
    for (const [code, issues] of validation.issues.filter({ severity: 'error' }).groupBy('code')) {
      if (code === 'None') {
        continue
      }
      errorList.push(...Issue({ data: issues }))
    }
    for (const [code, issues] of validation.issues.filter({ severity: 'warning' }).groupBy('code')) {
      if (code === 'None') {
        continue
      }
      warningList.push(...Issue({ data: issues }))
    }
    if (errorList.length === 0 && warningList.length === 0) {
      success = (
      <div className="success">
        <Collapse label="No Issues Detected!">
          <div>Thanks for Everything. I Have No Complaints Whatsoever.</div>
        </Collapse>
      </div>
      )
      confetti({
        particleCount: 500,
        spread: 180,
        ticks: 400
      });
    }
    validatorOutput = (
      <>
        <button onClick={validateDir}>Reselect Files</button>
        <div>
          <ul className="issues-list">
            {errorList}
            {warningList}
            {success}
          </ul>
          <Summary data={validation.summary} />
          <a
            href={`data:application/json:${JSON.stringify(validation)}`}
            target="_blank"
            download="bids-validator-output.json"
          >
            Save JSON log.
          </a>
        </div>
      </>
    )
    if (errorList.length === 0) {
    }
  } else {

    validatorOutput = (
      <>
        <h2>
          Select a{" "}
          <a href="https://bids.neuroimaging.io" target="_blank">
            BIDS dataset
          </a>{" "}
          to validate.
        </h2>
        <button onClick={validateDir}>Select Dataset Files</button>
      </>
    )
  }
  return (
    <>
      <h1>BIDS Validator</h1>
      {validatorOutput}
      <div>
        Note: Selecting a dataset only performs validation. Files are never
        uploaded.
      </div>
      <div>The legacy BIDS Validator is available <a href="https://bids-standard.github.io/legacy-validator/">here.</a></div>
    </>
  )
}

export default App
