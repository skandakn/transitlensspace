/**
 * Astronomy telemetry formatting utilities
 */

export function formatPeriod(days: number): string {
  if (days < 1) {
    return `${(days * 24).toFixed(2)} h`
  }
  return `${days.toFixed(3)} d`
}

export function formatDepth(fraction: number, ppm?: number): string {
  if (ppm !== undefined) {
    return `${ppm.toLocaleString()} ppm`
  }
  const calculatedPpm = Math.round(fraction * 1_000_000)
  return `${calculatedPpm.toLocaleString()} ppm (${(fraction * 100).toFixed(3)}%)`
}

export function formatRadius(earthRadii: number): string {
  return `${earthRadii.toFixed(2)} R⊕`
}

export function formatStellarRadius(solarRadii: number): string {
  return `${solarRadii.toFixed(2)} R☉`
}

export function formatStellarMass(solarMasses: number): string {
  return `${solarMasses.toFixed(2)} M☉`
}

export function formatTemperature(kelvin: number): string {
  return `${Math.round(kelvin).toLocaleString()} K`
}

export function formatDuration(hours: number): string {
  return `${hours.toFixed(2)} hrs`
}

export function formatCoordinates(ra: number, dec: number): string {
  const sign = dec >= 0 ? '+' : ''
  return `RA ${ra.toFixed(4)}° / Dec ${sign}${dec.toFixed(4)}°`
}
