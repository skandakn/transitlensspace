import type { LightCurvePoint } from '../../types'
import { buildSuccessResult, type CsvParseResult } from './csvParser'

interface FitsColumn {
  name: string
  format: string
  byteOffset: number
  byteLength: number
  type: 'D' | 'E' | 'J' | 'I' | 'K' | 'A' | 'OTHER'
}

/**
 * Robust Client-Side FITS Light Curve Parser
 * 
 * Supports NASA Kepler, K2, and TESS Standard Pipeline Products:
 * - HDU 0: Primary header
 * - HDU 1: BINTABLE extension containing TIME, PDCSAP_FLUX / SAP_FLUX, and errors
 * - Big-endian binary decoding (IEEE-754 double and single precision floats)
 * - Automatic flux normalization if raw counts / e-/s are supplied
 * - Graceful error handling for non-light curve FITS files
 */
export function parseFitsLightCurve(
  buffer: ArrayBuffer,
  filename = 'observation.fits'
): CsvParseResult {
  const warnings: string[] = []
  const bytes = new Uint8Array(buffer)

  if (bytes.length < 2880) {
    return {
      success: false,
      points: [],
      error: `File "${filename}" is smaller than a single 2880-byte FITS block (${bytes.length} bytes). Invalid FITS file.`,
      warnings
    }
  }

  // 1. Verify FITS signature: first card must start with SIMPLE  =
  const magic = new TextDecoder('ascii').decode(bytes.subarray(0, 30))
  if (!magic.startsWith('SIMPLE  =')) {
    return {
      success: false,
      points: [],
      error: `File "${filename}" does not appear to be a standard FITS file (missing "SIMPLE  =" signature).`,
      warnings
    }
  }

  try {
    let offset = 0

    // Helper: read 80-byte cards until END is found, advance offset to next 2880-byte boundary
    const readHduHeader = (): { cards: string[]; nextOffset: number } => {
      const cards: string[] = []
      let foundEnd = false

      while (offset < bytes.length) {
        for (let i = 0; i < 36; i++) {
          const cardOffset = offset + i * 80
          if (cardOffset + 80 > bytes.length) break
          const cardStr = new TextDecoder('ascii').decode(bytes.subarray(cardOffset, cardOffset + 80))
          cards.push(cardStr)
          if (cardStr.startsWith('END ')) {
            foundEnd = true
            break
          }
        }
        offset += 2880
        if (foundEnd) break
      }
      return { cards, nextOffset: offset }
    }

    // Helper: extract card value
    const getCardValue = (cards: string[], key: string): string | null => {
      const prefix = key.padEnd(8, ' ') + '= '
      const matched = cards.find((c) => c.startsWith(prefix) || c.startsWith(key.padEnd(8, ' ') + '='))
      if (!matched) return null
      const eqIdx = matched.indexOf('=')
      const commentIdx = matched.indexOf('/', eqIdx)
      const raw = commentIdx !== -1 ? matched.slice(eqIdx + 1, commentIdx) : matched.slice(eqIdx + 1)
      return raw.trim().replace(/^['"]|['"]$/g, '').trim()
    }

    // HDU 0: Primary Header
    readHduHeader()

    if (offset >= bytes.length) {
      return {
        success: false,
        points: [],
        error: `FITS file "${filename}" contains only a primary header with no table extensions.`,
        warnings
      }
    }

    // HDU 1: BinTable Extension Header
    const hdu1 = readHduHeader()
    const hdu1Cards = hdu1.cards

    const xtension = getCardValue(hdu1Cards, 'XTENSION')?.toUpperCase()
    if (!xtension || (!xtension.includes('BINTABLE') && !xtension.includes('TABLE'))) {
      return {
        success: false,
        points: [],
        error: `FITS file "${filename}" extension 1 is not a BINTABLE (found: "${xtension || 'NONE'}").`,
        warnings
      }
    }

    const rowWidth = parseInt(getCardValue(hdu1Cards, 'NAXIS1') || '0', 10)
    const numRows = parseInt(getCardValue(hdu1Cards, 'NAXIS2') || '0', 10)
    const numFields = parseInt(getCardValue(hdu1Cards, 'TFIELDS') || '0', 10)

    if (rowWidth <= 0 || numRows <= 0 || numFields <= 0) {
      return {
        success: false,
        points: [],
        error: `FITS table in "${filename}" has invalid dimensions: ${numRows} rows, ${rowWidth} bytes/row, ${numFields} fields.`,
        warnings
      }
    }

    // Parse column definitions
    const columns: FitsColumn[] = []
    let currentByteOffset = 0

    for (let f = 1; f <= numFields; f++) {
      const colName = getCardValue(hdu1Cards, `TTYPE${f}`) || `COL${f}`
      const colForm = getCardValue(hdu1Cards, `TFORM${f}`) || ''

      let colType: FitsColumn['type'] = 'OTHER'
      let colBytes = 4

      if (colForm.includes('D')) {
        colType = 'D'
        colBytes = 8
      } else if (colForm.includes('E')) {
        colType = 'E'
        colBytes = 4
      } else if (colForm.includes('J')) {
        colType = 'J'
        colBytes = 4
      } else if (colForm.includes('I')) {
        colType = 'I'
        colBytes = 2
      } else if (colForm.includes('K')) {
        colType = 'K'
        colBytes = 8
      } else if (colForm.includes('A')) {
        colType = 'A'
        const match = colForm.match(/(\d+)A/)
        colBytes = match ? parseInt(match[1], 10) : 1
      }

      columns.push({
        name: colName.trim().toUpperCase(),
        format: colForm.trim(),
        byteOffset: currentByteOffset,
        byteLength: colBytes,
        type: colType
      })

      currentByteOffset += colBytes
    }

    // Locate TIME, FLUX, and ERROR columns
    // Priority for flux: PDCSAP_FLUX (systematics removed) -> SAP_FLUX -> FLUX
    const timeCol = columns.find((c) =>
      ['TIME', 'BJD', 'BJD_TIME', 'BKJD', 'BTJD', 'CADENCE_TIME'].some((k) => c.name.includes(k))
    )

    const fluxCol =
      columns.find((c) => c.name === 'PDCSAP_FLUX') ||
      columns.find((c) => c.name === 'SAP_FLUX') ||
      columns.find((c) => c.name.includes('FLUX') && !c.name.includes('ERR'))

    const errCol =
      columns.find((c) => c.name === 'PDCSAP_FLUX_ERR') ||
      columns.find((c) => c.name === 'SAP_FLUX_ERR') ||
      columns.find((c) => c.name.includes('ERR') || c.name.includes('ERROR'))

    if (!timeCol || !fluxCol) {
      return {
        success: false,
        points: [],
        error: `Could not identify TIME and FLUX columns in FITS table. Available columns: [${columns.map((c) => c.name).join(', ')}].`,
        warnings
      }
    }

    warnings.push(`Extracted FITS columns: Time = "${timeCol.name}", Flux = "${fluxCol.name}"${errCol ? `, Flux Error = "${errCol.name}"` : ''}.`)

    // Read binary records
    const dataView = new DataView(buffer)
    const dataStartOffset = offset
    const availableDataBytes = bytes.length - dataStartOffset
    const maxProcessableRows = Math.min(numRows, Math.floor(availableDataBytes / rowWidth))

    const rawPoints: { time: number; flux: number; fluxError?: number }[] = []
    let skippedRows = 0

    const readNumericVal = (rowStart: number, col: FitsColumn): number => {
      const pos = rowStart + col.byteOffset
      if (pos + col.byteLength > buffer.byteLength) return NaN
      if (col.type === 'D') return dataView.getFloat64(pos, false) // Big-endian
      if (col.type === 'E') return dataView.getFloat32(pos, false)
      if (col.type === 'J') return dataView.getInt32(pos, false)
      if (col.type === 'I') return dataView.getInt16(pos, false)
      return NaN
    }

    for (let r = 0; r < maxProcessableRows; r++) {
      const rowStart = dataStartOffset + r * rowWidth
      const t = readNumericVal(rowStart, timeCol)
      const f = readNumericVal(rowStart, fluxCol)
      const e = errCol ? readNumericVal(rowStart, errCol) : undefined

      if (Number.isFinite(t) && Number.isFinite(f) && f > 0) {
        rawPoints.push({
          time: t,
          flux: f,
          fluxError: Number.isFinite(e) && e! > 0 ? e : undefined
        })
      } else {
        skippedRows++
      }
    }

    if (rawPoints.length < 5) {
      return {
        success: false,
        points: [],
        error: `FITS table in "${filename}" contained only ${rawPoints.length} valid finite photometric entries. At least 15 are required.`,
        warnings
      }
    }

    // Flux Normalization Check:
    // Kepler and TESS store raw electron rates (e-/s, e.g. 50,000 to 1,000,000 e-/s).
    // Box Least Squares transit search requires relative flux normalized around 1.0.
    const sortedFluxes = [...rawPoints.map((p) => p.flux)].sort((a, b) => a - b)
    const medianFlux = sortedFluxes[Math.floor(sortedFluxes.length / 2)]

    const needsNormalization = medianFlux > 2.0 || medianFlux < 0.2
    if (needsNormalization && medianFlux > 0) {
      warnings.push(`Normalized raw photometric counts (${medianFlux.toFixed(1)} e-/s) to relative baseline 1.0.`)
    }

    const points: LightCurvePoint[] = rawPoints.map((p) => {
      const normFlux = needsNormalization ? p.flux / medianFlux : p.flux
      const normErr = p.fluxError !== undefined && needsNormalization ? p.fluxError / medianFlux : p.fluxError

      return {
        time: parseFloat(p.time.toFixed(6)),
        flux: parseFloat(normFlux.toFixed(6)),
        fluxError: normErr !== undefined ? parseFloat(normErr.toFixed(6)) : undefined,
        isTransit: false,
        isOutlier: false
      }
    })

    // Chronological order enforcement
    let isSorted = true
    for (let i = 1; i < points.length; i++) {
      if (points[i].time < points[i - 1].time) {
        isSorted = false
        break
      }
    }

    if (!isSorted) {
      points.sort((a, b) => a.time - b.time)
      warnings.push('FITS timestamps were out of chronological order and have been automatically sorted ascending.')
    }

    return buildSuccessResult(
      points,
      skippedRows,
      maxProcessableRows,
      'NASA FITS BinTable',
      [timeCol.name, fluxCol.name],
      warnings
    )
  } catch (err) {
    return {
      success: false,
      points: [],
      error: `Error decoding FITS file "${filename}": ${err instanceof Error ? err.message : String(err)}`,
      warnings
    }
  }
}
