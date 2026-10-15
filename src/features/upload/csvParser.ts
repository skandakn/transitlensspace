import type { LightCurvePoint } from '../../types'

export interface CsvParseStats {
  totalRows: number
  validRows: number
  skippedRows: number
  minTime: number
  maxTime: number
  minFlux: number
  maxFlux: number
  meanFlux: number
  durationDays: number
}

export interface CsvParseResult {
  success: boolean
  points: LightCurvePoint[]
  error?: string
  warnings: string[]
  detectedDelimiter?: string
  detectedHeaders?: string[]
  stats?: CsvParseStats
}

/**
 * Robust CSV/TSV/ASCII/JSON Photometry Parser & Validator
 * 
 * Supports:
 * - CSV (comma-delimited), TSV (tab-delimited), semicolon, or whitespace-separated columns
 * - Standard headers: time/bjd/t, flux/pdcsap_flux/f/sap_flux, flux_err/err/error/e
 * - Raw numerical rows without headers
 * - JSON arrays of objects with time/flux keys
 * - Comment lines starting with '#' or '//'
 * - Non-numeric row filtration, NaN checking, non-positive flux rejection
 * - Strict ascending chronological sorting
 * - Minimum cadence validation (>= 15 points for transit detection)
 */
export function parseAndValidateLightCurve(rawText: string, filename = 'uploaded_file.csv'): CsvParseResult {
  const warnings: string[] = []
  const trimmed = rawText.trim()

  if (!trimmed) {
    return {
      success: false,
      points: [],
      error: `File "${filename}" is completely empty. Please upload a valid CSV/TSV file with time and flux columns.`,
      warnings
    }
  }

  // 1. Check for JSON array payload
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      const arr = Array.isArray(parsed) ? parsed : parsed.data || parsed.points || []
      if (!Array.isArray(arr) || arr.length === 0) {
        return {
          success: false,
          points: [],
          error: `JSON file "${filename}" does not contain an array of data points.`,
          warnings
        }
      }

      const points: LightCurvePoint[] = []
      let skipped = 0

      for (const item of arr) {
        if (!item || typeof item !== 'object') {
          skipped++
          continue
        }
        const timeVal = item.time ?? item.Time ?? item.TIME ?? item.bjd ?? item.BJD ?? item.t
        const fluxVal = item.flux ?? item.Flux ?? item.FLUX ?? item.pdcsap_flux ?? item.f
        const errVal = item.flux_err ?? item.fluxErr ?? item.error ?? item.err ?? item.e

        const time = Number(timeVal)
        const flux = Number(fluxVal)
        const fluxError = errVal !== undefined ? Number(errVal) : undefined

        if (Number.isFinite(time) && Number.isFinite(flux) && flux > 0) {
          points.push({
            time: parseFloat(time.toFixed(6)),
            flux: parseFloat(flux.toFixed(6)),
            fluxError: Number.isFinite(fluxError) ? parseFloat((fluxError as number).toFixed(6)) : undefined,
            isTransit: false,
            isOutlier: false
          })
        } else {
          skipped++
        }
      }

      if (points.length < 5) {
        return {
          success: false,
          points: [],
          error: `JSON file contains insufficient valid photometric entries (${points.length} points parsed). At least 15 points are required.`,
          warnings
        }
      }

      // Sort chronological
      points.sort((a, b) => a.time - b.time)

      return buildSuccessResult(points, skipped, arr.length, 'json', ['time', 'flux'], warnings)
    } catch {
      // Fall through to line-based parsing
    }
  }

  // 2. Line-based delimiter parsing
  const rawLines = trimmed.split(/\r?\n/)
  // Filter out empty lines and comments
  const lines: { lineIndex: number; content: string }[] = []
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim()
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue
    }
    lines.push({ lineIndex: i + 1, content: line })
  }

  if (lines.length === 0) {
    return {
      success: false,
      points: [],
      error: `File "${filename}" contains only comments or blank lines with zero data rows.`,
      warnings
    }
  }

  // Detect delimiter from first row: comma, tab, semicolon, or whitespace
  const firstContent = lines[0].content
  let delimiter = ','
  if (firstContent.includes('\t')) {
    delimiter = '\t'
  } else if (firstContent.includes(';')) {
    delimiter = ';'
  } else if (!firstContent.includes(',') && /\s+/.test(firstContent)) {
    delimiter = ' '
  }

  const splitLine = (l: string): string[] => {
    if (delimiter === ' ') {
      return l.split(/\s+/).filter(Boolean)
    }
    return l.split(delimiter).map((s) => s.trim().replace(/^["']|["']$/g, ''))
  }

  const headerCandidate = splitLine(firstContent).map((c) => c.toLowerCase())
  let timeCol = -1
  let fluxCol = -1
  let errCol = -1
  let dataStartIndex = 0

  // Inspect first line for column header keywords
  const timeKeywords = ['time', 'bjd', 'barycentric', 't', 'cadence_time', 'days']
  const fluxKeywords = ['flux', 'pdcsap_flux', 'sap_flux', 'f', 'relative_flux', 'mag', 'brightness']
  const errKeywords = ['flux_err', 'fluxerr', 'error', 'err', 'e', 'uncertainty', 'sigma']

  const matchKeyword = (col: string, keywords: string[]): boolean => {
    return keywords.some((k) => (k.length <= 1 ? col === k : col === k || col.includes(k)))
  }

  for (let i = 0; i < headerCandidate.length; i++) {
    const col = headerCandidate[i]
    if (timeCol === -1 && matchKeyword(col, timeKeywords)) {
      timeCol = i
    } else if (fluxCol === -1 && matchKeyword(col, fluxKeywords)) {
      fluxCol = i
    } else if (errCol === -1 && matchKeyword(col, errKeywords)) {
      errCol = i
    }
  }

  const detectedHeaders = timeCol !== -1 && fluxCol !== -1 ? headerCandidate : undefined

  if (detectedHeaders) {
    dataStartIndex = 1
  } else {
    // If first line contains numbers, assume column 0 = time, column 1 = flux
    const firstColNum = Number(headerCandidate[0])
    const secondColNum = Number(headerCandidate[1])
    if (!isNaN(firstColNum) && !isNaN(secondColNum)) {
      timeCol = 0
      fluxCol = 1
      errCol = headerCandidate.length >= 3 && !isNaN(Number(headerCandidate[2])) ? 2 : -1
      dataStartIndex = 0
      warnings.push('No column header detected. Defaulted to Column 1 = Time, Column 2 = Flux.')
    } else {
      // Header text present but keywords didn't match
      dataStartIndex = 1
      timeCol = 0
      fluxCol = 1
      errCol = headerCandidate.length >= 3 ? 2 : -1
      warnings.push(`Unrecognized header names: [${headerCandidate.join(', ')}]. Assumed Column 1 = Time, Column 2 = Flux.`)
    }
  }

  const points: LightCurvePoint[] = []
  let skippedRows = 0

  for (let idx = dataStartIndex; idx < lines.length; idx++) {
    const { content } = lines[idx]
    const parts = splitLine(content)

    if (parts.length <= Math.max(timeCol, fluxCol)) {
      skippedRows++
      continue
    }

    const rawTime = parseFloat(parts[timeCol])
    const rawFlux = parseFloat(parts[fluxCol])
    const rawErr = errCol !== -1 && parts[errCol] ? parseFloat(parts[errCol]) : undefined

    if (Number.isFinite(rawTime) && Number.isFinite(rawFlux) && rawFlux > 0) {
      points.push({
        time: parseFloat(rawTime.toFixed(6)),
        flux: parseFloat(rawFlux.toFixed(6)),
        fluxError: Number.isFinite(rawErr) && (rawErr as number) > 0 ? parseFloat((rawErr as number).toFixed(6)) : undefined,
        isTransit: false,
        isOutlier: false
      })
    } else {
      skippedRows++
    }
  }

  if (points.length === 0) {
    return {
      success: false,
      points: [],
      error: `File "${filename}" did not contain any valid numerical (time, flux) rows. Please verify your file contains numeric measurements with flux > 0.`,
      warnings
    }
  }

  if (points.length < 5) {
    return {
      success: false,
      points: [],
      error: `File "${filename}" contained only ${points.length} valid points. At least 5 valid cadences are required for ingestion (and >= 15 to run detection).`,
      warnings
    }
  }

  // Chronological sort check
  let isSorted = true
  for (let i = 1; i < points.length; i++) {
    if (points[i].time < points[i - 1].time) {
      isSorted = false
      break
    }
  }

  if (!isSorted) {
    points.sort((a, b) => a.time - b.time)
    warnings.push('Timestamps were out of chronological order and have been automatically sorted ascending.')
  }

  if (points.length < 15) {
    warnings.push(
      `Dataset contains only ${points.length} cadences. The transit detection engine requires at least 15 cadences to execute.`
    )
  }

  return buildSuccessResult(
    points,
    skippedRows,
    lines.length - dataStartIndex,
    delimiter === '\t' ? 'TSV' : delimiter === ' ' ? 'Whitespace/ASCII' : 'CSV',
    detectedHeaders || ['Column 1 (Time)', 'Column 2 (Flux)'],
    warnings
  )
}

export function buildSuccessResult(
  points: LightCurvePoint[],
  skippedRows: number,
  totalParsed: number,
  delimiterName: string,
  headers: string[],
  warnings: string[]
): CsvParseResult {
  let minTime = Infinity
  let maxTime = -Infinity
  let minFlux = Infinity
  let maxFlux = -Infinity
  let sumFlux = 0

  for (const pt of points) {
    if (pt.time < minTime) minTime = pt.time
    if (pt.time > maxTime) maxTime = pt.time
    if (pt.flux < minFlux) minFlux = pt.flux
    if (pt.flux > maxFlux) maxFlux = pt.flux
    sumFlux += pt.flux
  }

  const meanFlux = points.length ? sumFlux / points.length : 1.0

  return {
    success: true,
    points,
    warnings,
    detectedDelimiter: delimiterName,
    detectedHeaders: headers,
    stats: {
      totalRows: totalParsed,
      validRows: points.length,
      skippedRows,
      minTime: parseFloat(minTime.toFixed(4)),
      maxTime: parseFloat(maxTime.toFixed(4)),
      minFlux: parseFloat(minFlux.toFixed(6)),
      maxFlux: parseFloat(maxFlux.toFixed(6)),
      meanFlux: parseFloat(meanFlux.toFixed(6)),
      durationDays: parseFloat((maxTime - minTime).toFixed(2))
    }
  }
}

/**
 * Creates downloadable sample CSV content for testing
 */
export function generateSampleCsvContent(type: 'transit' | 'flat' | 'sparse' | 'malformed'): { filename: string; content: string } {
  switch (type) {
    case 'transit': {
      const rows = ['# NASA TESS Calibrated Light Curve — Target: TOI-700', 'time,flux,flux_err']
      // 10 days of observations, 30 min cadence (0.02083 d)
      for (let i = 0; i < 480; i++) {
        const t = parseFloat((i * 0.020833).toFixed(4))
        // Transit every 3.74 days, duration 0.14 days, depth 0.0092
        const phase = (t % 3.74)
        const inTransit = phase < 0.14
        const dip = inTransit ? 0.0092 * Math.cos(((phase - 0.07) / 0.07) * (Math.PI / 2)) : 0
        const noise = (Math.random() - 0.5) * 0.0007
        const f = parseFloat((1.0 - dip + noise).toFixed(6))
        rows.push(`${t},${f},0.000650`)
      }
      return {
        filename: 'toi_700_sample_photometry.csv',
        content: rows.join('\n')
      }
    }
    case 'flat': {
      const rows = ['# Ground Photometric Control Star — Target: HD-219134', 'time,flux,flux_err']
      for (let i = 0; i < 400; i++) {
        const t = parseFloat((i * 0.025).toFixed(4))
        const noise = (Math.random() - 0.5) * 0.00065
        const f = parseFloat((1.0 + noise).toFixed(6))
        rows.push(`${t},${f},0.000650`)
      }
      return {
        filename: 'hd_219134_flat_control.csv',
        content: rows.join('\n')
      }
    }
    case 'sparse': {
      const rows = ['time,flux', '0.0,1.0001', '0.5,0.9998', '1.0,1.0002', '1.5,0.9999', '2.0,1.0000', '2.5,0.9997', '3.0,1.0003', '3.5,0.9998']
      return {
        filename: 'sparse_test_data.csv',
        content: rows.join('\n')
      }
    }
    case 'malformed': {
      return {
        filename: 'malformed_invalid.csv',
        content: 'observation_id,target_note\nABC-001,no numeric columns\nABC-002,corrupt data format'
      }
    }
  }
}
