import { describe, it, expect } from 'vitest'
import { parseAndValidateLightCurve, generateSampleCsvContent } from '../csvParser'
import { parseFitsLightCurve } from '../fitsParser'

describe('Photometry Upload & Ingestion Engine', () => {
  it('correctly parses and validates standard CSV transit photometry', () => {
    const sample = generateSampleCsvContent('transit')
    const result = parseAndValidateLightCurve(sample.content, sample.filename)

    expect(result.success).toBe(true)
    expect(result.points.length).toBeGreaterThanOrEqual(400)
    expect(result.detectedDelimiter).toBe('CSV')
    expect(result.stats?.validRows).toBe(result.points.length)
    expect(result.stats?.durationDays).toBeGreaterThan(0)
  })

  it('correctly parses flat control sample without errors', () => {
    const sample = generateSampleCsvContent('flat')
    const result = parseAndValidateLightCurve(sample.content, sample.filename)

    expect(result.success).toBe(true)
    expect(result.points.length).toBe(400)
    expect(result.error).toBeUndefined()
  })

  it('rejects sparse files with fewer than 15 cadences with a parser warning or error', () => {
    const sample = generateSampleCsvContent('sparse')
    const result = parseAndValidateLightCurve(sample.content, sample.filename)

    expect(result.success).toBe(true)
    expect(result.points.length).toBe(8)
    // Must warn about insufficient points for detection (<15)
    expect(result.warnings.some((w) => w.includes('15 cadences'))).toBe(true)
  })

  it('rejects malformed CSV missing numerical columns', () => {
    const sample = generateSampleCsvContent('malformed')
    const result = parseAndValidateLightCurve(sample.content, sample.filename)

    expect(result.success).toBe(false)
    expect(result.error).toContain('did not contain any valid numerical')
  })

  it('handles JSON photometric array payloads', () => {
    const jsonContent = JSON.stringify([
      { time: 10.0, flux: 1.0002 },
      { time: 10.02, flux: 0.9998 },
      { time: 10.04, flux: 1.0001 },
      { time: 10.06, flux: 0.9999 },
      { time: 10.08, flux: 1.0000 },
      { time: 10.10, flux: 0.9997 }
    ])

    const result = parseAndValidateLightCurve(jsonContent, 'test.json')
    expect(result.success).toBe(true)
    expect(result.points.length).toBe(6)
    expect(result.detectedDelimiter).toBe('json')
  })

  it('parses and normalizes synthetic NASA FITS binary table light curve', () => {
    // Construct minimal valid FITS buffer with Primary HDU and BINTABLE HDU
    const pad = (s: string) => s + ' '.repeat((2880 - (s.length % 2880)) % 2880)
    const card = (key: string, val: string | number | boolean) => {
      let v = ''
      if (typeof val === 'string') v = `'${val}'`.padEnd(20, ' ')
      else if (typeof val === 'boolean') v = (val ? 'T' : 'F').padStart(20, ' ')
      else v = String(val).padStart(20, ' ')
      return (key.padEnd(8, ' ') + '= ' + v).padEnd(80, ' ')
    }

    const hdu0Str = pad(
      card('SIMPLE', true) +
      card('BITPIX', 8) +
      card('NAXIS', 0) +
      card('EXTEND', true) +
      'END'.padEnd(80, ' ')
    )

    const numRows = 20
    const rowWidth = 16
    const hdu1HeaderStr = pad(
      card('XTENSION', 'BINTABLE') +
      card('BITPIX', 8) +
      card('NAXIS', 2) +
      card('NAXIS1', rowWidth) +
      card('NAXIS2', numRows) +
      card('PCOUNT', 0) +
      card('GCOUNT', 1) +
      card('TFIELDS', 2) +
      card('TTYPE1', 'TIME') +
      card('TFORM1', '1D') +
      card('TTYPE2', 'PDCSAP_FLUX') +
      card('TFORM2', '1D') +
      'END'.padEnd(80, ' ')
    )

    const dataBlockLen = Math.ceil((numRows * rowWidth) / 2880) * 2880
    const totalBytes = hdu0Str.length + hdu1HeaderStr.length + dataBlockLen

    const buffer = new ArrayBuffer(totalBytes)
    const view = new DataView(buffer)
    const uint8 = new Uint8Array(buffer)

    for (let i = 0; i < hdu0Str.length; i++) uint8[i] = hdu0Str.charCodeAt(i)
    for (let i = 0; i < hdu1HeaderStr.length; i++) uint8[hdu0Str.length + i] = hdu1HeaderStr.charCodeAt(i)

    const dataStart = hdu0Str.length + hdu1HeaderStr.length
    for (let r = 0; r < numRows; r++) {
      const pos = dataStart + r * rowWidth
      view.setFloat64(pos, 2458000.0 + r * 0.02, false) // Big-endian TIME
      view.setFloat64(pos + 8, 450000.0 * (1.0 - (r === 10 ? 0.015 : 0.0)), false) // Big-endian e-/s flux
    }

    const fitsResult = parseFitsLightCurve(buffer, 'kepler_test.fits')
    expect(fitsResult.success).toBe(true)
    expect(fitsResult.points.length).toBe(numRows)
    // Verify flux was normalized to around 1.0 from 450,000 counts
    expect(fitsResult.points[0].flux).toBeCloseTo(1.0, 1)
    expect(fitsResult.detectedDelimiter).toBe('NASA FITS BinTable')
  })
})
