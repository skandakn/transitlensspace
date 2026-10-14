import type { CelestialObject, CelestialPlanet } from '../types/universe'

/**
 * TransitLens Astronomical Data Repository
 * 
 * Sources:
 * - NASA Exoplanet Archive (Caltech/IPAC / NASA): https://exoplanetarchive.ipac.caltech.edu/
 * - SIMBAD Astronomical Database (CDS, Strasbourg): https://simbad.cds.unistra.fr/simbad/
 * - NASA Exoplanet Exploration Program: https://science.nasa.gov/exoplanets/
 * 
 * Retrieval Date: 2026-10-14
 * 
 * SCIENTIFIC SCALE NOTICE:
 * Visual orbital distances and radii are scaled for interactive 3D exploration and legibility,
 * not true 1:1 cosmic proportions. True physical distances are hundreds of thousands of times
 * larger relative to planetary radii. All scientific measurements are reported in physical units
 * (AU, R⊕, M⊕, K, R☉, M☉, pc, ly) as cataloged by the NASA Exoplanet Archive. Missing or
 * unmeasured quantities are explicitly set to null.
 */

export const ASTRONOMICAL_SCALE_DISCLAIMER =
  'Scale Notice: Visual 3D distances and spherical radii are enhanced for interactive spatial navigation. Real cosmic distances are hundreds of thousands of times larger relative to planetary radii. Measured physical quantities are displayed in standard astronomical units.'

export const RETRIEVAL_DATE = '2026-10-14'

/**
 * Confirmed Exoplanet Systems and Host Stars bundled from NASA Exoplanet Archive.
 */
export const BUNDLED_CELESTIAL_SYSTEMS: CelestialObject[] = [
  // -------------------------------------------------------------------------
  // 1. TOI-700 System (TIC 261136679)
  // -------------------------------------------------------------------------
  {
    id: 'TIC-261136679',
    name: 'TOI-700',
    type: 'system',
    position: [-48, 8, -25],
    radius: 1.85,
    color: '#ff6644',
    coronaColor: '#cc2200',
    temperature: 3480,
    spectralType: 'M2V',
    spectralClass: 'M',
    luminosity: 0.023,
    distanceParsecs: 31.13,
    distanceLightYears: 101.5,
    stellarRadiusSolar: 0.42,
    stellarMassSolar: 0.41,
    magnitude: 13.15,
    raDegrees: 97.0969,
    decDegrees: -65.5794,
    constellation: 'Dorado',
    mission: 'TESS',
    sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/TOI-700',
    sourceCitation: 'Gilbert et al. 2020, AJ, 160, 116; Rodriguez et al. 2020, AJ, 160, 117',
    retrievalDate: RETRIEVAL_DATE,
    description:
      'Quiet red dwarf star located 101.5 light-years away in the constellation Dorado. Hosts multiple transiting planets, including the Earth-sized habitable zone planet TOI-700 d.',
    planets: [
      {
        id: 'toi-700-b',
        name: 'TOI-700 b',
        hostStarId: 'TIC-261136679',
        hostStarName: 'TOI-700',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2020,
        discoveryFacility: 'Transiting Exoplanet Survey Satellite (TESS)',
        periodDays: 9.601,
        semiMajorAxisAu: 0.0637,
        planetRadiusEarth: 0.91,
        massEarth: null, // Mass unmeasured (transits only, no radial velocity solution)
        equilibriumTempK: 444,
        depthPpm: 840,
        transitDurationHours: 2.14,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/TOI-700%20b',
        sourceCitation: 'Gilbert et al. 2020, AJ, 160, 116',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Terrestrial planet orbiting interior to the habitable zone; high solar insolation.',
        radius: 0.36,
        distanceFromStar: 3.8,
        orbitSpeed: 1.35,
        orbitInclination: 0.04,
        color: '#b08d75'
      },
      {
        id: 'toi-700-c',
        name: 'TOI-700 c',
        hostStarId: 'TIC-261136679',
        hostStarName: 'TOI-700',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2020,
        discoveryFacility: 'Transiting Exoplanet Survey Satellite (TESS)',
        periodDays: 16.051,
        semiMajorAxisAu: 0.0925,
        planetRadiusEarth: 2.63,
        massEarth: null, // Mass unmeasured
        equilibriumTempK: 368,
        depthPpm: 1280,
        transitDurationHours: 2.81,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/TOI-700%20c',
        sourceCitation: 'Gilbert et al. 2020, AJ, 160, 116',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Sub-Neptune planet with a substantial volatile gaseous envelope.',
        radius: 0.62,
        distanceFromStar: 5.4,
        orbitSpeed: 0.95,
        orbitInclination: 0.06,
        color: '#70a4b5',
        atmosphereColor: '#93c5fd'
      },
      {
        id: 'toi-700-e',
        name: 'TOI-700 e',
        hostStarId: 'TIC-261136679',
        hostStarName: 'TOI-700',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2023,
        discoveryFacility: 'Transiting Exoplanet Survey Satellite (TESS)',
        periodDays: 27.84,
        semiMajorAxisAu: 0.134,
        planetRadiusEarth: 0.95,
        massEarth: null, // Mass unmeasured
        equilibriumTempK: 302,
        depthPpm: 760,
        transitDurationHours: 3.1,
        isHabitableZone: true,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/TOI-700%20e',
        sourceCitation: 'Gilbert et al. 2023, ApJL, 944, L35',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Earth-sized planet situated in the optimistic circumstellar habitable zone.',
        radius: 0.38,
        distanceFromStar: 6.8,
        orbitSpeed: 0.72,
        orbitInclination: 0.03,
        color: '#5e947d',
        atmosphereColor: '#6ee7b7'
      },
      {
        id: 'toi-700-d',
        name: 'TOI-700 d',
        hostStarId: 'TIC-261136679',
        hostStarName: 'TOI-700',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2020,
        discoveryFacility: 'Transiting Exoplanet Survey Satellite (TESS)',
        periodDays: 37.426,
        semiMajorAxisAu: 0.1633,
        planetRadiusEarth: 1.14,
        massEarth: null, // Mass unmeasured (estimated ~1.25 M⊕ via mass-radius relation)
        equilibriumTempK: 269,
        depthPpm: 920,
        transitDurationHours: 3.25,
        isHabitableZone: true,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/TOI-700%20d',
        sourceCitation: 'Gilbert et al. 2020, AJ, 160, 116; Suissa et al. 2020, AJ, 160, 118',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes:
          'Earth-sized planet inside the conservative habitable zone. Receives ~86% of Earth’s solar flux. Prime candidate for JWST transmission spectroscopy.',
        radius: 0.44,
        distanceFromStar: 8.5,
        orbitSpeed: 0.52,
        orbitInclination: 0.02,
        color: '#2d8473',
        atmosphereColor: '#34d399'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // 2. Kepler-90 System (KIC 11442793)
  // -------------------------------------------------------------------------
  {
    id: 'KIC-11442793',
    name: 'Kepler-90',
    type: 'system',
    position: [42, 16, -55],
    radius: 2.3,
    color: '#ffe599',
    coronaColor: '#ffaa00',
    temperature: 6080,
    spectralType: 'G0V',
    spectralClass: 'G',
    luminosity: 1.66,
    distanceParsecs: 870.0,
    distanceLightYears: 2838.0,
    stellarRadiusSolar: 1.20,
    stellarMassSolar: 1.20,
    magnitude: 14.0,
    raDegrees: 284.4335,
    decDegrees: 41.7348,
    constellation: 'Draco',
    mission: 'Kepler',
    sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/Kepler-90',
    sourceCitation: 'Shallue & Vanderburg 2018, AJ, 155, 94; Cabrera et al. 2014, ApJ, 781, 18',
    retrievalDate: RETRIEVAL_DATE,
    description:
      'G-type main-sequence star 2,838 light-years away hosting 8 confirmed planets, tying our Solar System for the highest known exoplanetary multiplicity.',
    planets: [
      {
        id: 'kepler-90-b',
        name: 'Kepler-90 b',
        hostStarId: 'KIC-11442793',
        hostStarName: 'Kepler-90',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2013,
        discoveryFacility: 'NASA Kepler Telescope',
        periodDays: 7.008,
        semiMajorAxisAu: 0.074,
        planetRadiusEarth: 1.31,
        massEarth: null,
        equilibriumTempK: 1056,
        depthPpm: 240,
        transitDurationHours: 3.5,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/Kepler-90%20b',
        sourceCitation: 'Cabrera et al. 2014, ApJ, 781, 18',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Super-Earth with high surface temperature orbiting close to host star.',
        radius: 0.35,
        distanceFromStar: 3.6,
        orbitSpeed: 1.7,
        color: '#c49b78'
      },
      {
        id: 'kepler-90-c',
        name: 'Kepler-90 c',
        hostStarId: 'KIC-11442793',
        hostStarName: 'Kepler-90',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2013,
        discoveryFacility: 'NASA Kepler Telescope',
        periodDays: 8.719,
        semiMajorAxisAu: 0.089,
        planetRadiusEarth: 1.18,
        massEarth: null,
        equilibriumTempK: 981,
        depthPpm: 200,
        transitDurationHours: 3.8,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/Kepler-90%20c',
        sourceCitation: 'Cabrera et al. 2014, ApJ, 781, 18',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Inner rocky planet in dynamic orbital resonance with Kepler-90 b.',
        radius: 0.34,
        distanceFromStar: 4.8,
        orbitSpeed: 1.45,
        color: '#9c816e'
      },
      {
        id: 'kepler-90-i',
        name: 'Kepler-90 i',
        hostStarId: 'KIC-11442793',
        hostStarName: 'Kepler-90',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2017,
        discoveryFacility: 'NASA Kepler Telescope (Google Deep Learning Model)',
        periodDays: 14.449,
        semiMajorAxisAu: 0.1234,
        planetRadiusEarth: 1.32,
        massEarth: null,
        equilibriumTempK: 709,
        depthPpm: 270,
        transitDurationHours: 2.8,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/Kepler-90%20i',
        sourceCitation: 'Shallue & Vanderburg 2018, AJ, 155, 94',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes:
          'Eighth planet discovered using a neural network trained to identify weak planetary signals in Kepler light curves.',
        radius: 0.38,
        distanceFromStar: 6.2,
        orbitSpeed: 1.15,
        color: '#d97706',
        atmosphereColor: '#fbbf24'
      },
      {
        id: 'kepler-90-d',
        name: 'Kepler-90 d',
        hostStarId: 'KIC-11442793',
        hostStarName: 'Kepler-90',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2013,
        discoveryFacility: 'NASA Kepler Telescope',
        periodDays: 59.737,
        semiMajorAxisAu: 0.32,
        planetRadiusEarth: 2.88,
        massEarth: null,
        equilibriumTempK: 518,
        depthPpm: 680,
        transitDurationHours: 6.2,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/Kepler-90%20d',
        sourceCitation: 'Cabrera et al. 2014, ApJ, 781, 18',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Warm sub-Neptune exoplanet with thick atmosphere.',
        radius: 0.58,
        distanceFromStar: 8.2,
        orbitSpeed: 0.85,
        color: '#60a5fa'
      },
      {
        id: 'kepler-90-e',
        name: 'Kepler-90 e',
        hostStarId: 'KIC-11442793',
        hostStarName: 'Kepler-90',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2013,
        discoveryFacility: 'NASA Kepler Telescope',
        periodDays: 91.939,
        semiMajorAxisAu: 0.42,
        planetRadiusEarth: 2.67,
        massEarth: null,
        equilibriumTempK: 448,
        depthPpm: 620,
        transitDurationHours: 7.1,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/Kepler-90%20e',
        sourceCitation: 'Cabrera et al. 2014, ApJ, 781, 18',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Gaseous mini-Neptune orbiting in intermediate system domain.',
        radius: 0.55,
        distanceFromStar: 10.2,
        orbitSpeed: 0.68,
        color: '#38bdf8'
      },
      {
        id: 'kepler-90-f',
        name: 'Kepler-90 f',
        hostStarId: 'KIC-11442793',
        hostStarName: 'Kepler-90',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2013,
        discoveryFacility: 'NASA Kepler Telescope',
        periodDays: 124.914,
        semiMajorAxisAu: 0.48,
        planetRadiusEarth: 2.89,
        massEarth: null,
        equilibriumTempK: 412,
        depthPpm: 720,
        transitDurationHours: 8.0,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/Kepler-90%20f',
        sourceCitation: 'Cabrera et al. 2014, ApJ, 781, 18',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Neptune-class planet with inflated volatile envelope.',
        radius: 0.6,
        distanceFromStar: 12.0,
        orbitSpeed: 0.55,
        color: '#2dd4bf'
      },
      {
        id: 'kepler-90-g',
        name: 'Kepler-90 g',
        hostStarId: 'KIC-11442793',
        hostStarName: 'Kepler-90',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2013,
        discoveryFacility: 'NASA Kepler Telescope',
        periodDays: 210.603,
        semiMajorAxisAu: 0.71,
        planetRadiusEarth: 8.13,
        massEarth: null,
        equilibriumTempK: 340,
        depthPpm: 5400,
        transitDurationHours: 11.2,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/Kepler-90%20g',
        sourceCitation: 'Cabrera et al. 2014, ApJ, 781, 18',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Gas giant planet exhibiting transit timing variations (TTV) with Kepler-90 h.',
        radius: 0.95,
        distanceFromStar: 14.2,
        orbitSpeed: 0.42,
        color: '#fb923c'
      },
      {
        id: 'kepler-90-h',
        name: 'Kepler-90 h',
        hostStarId: 'KIC-11442793',
        hostStarName: 'Kepler-90',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2013,
        discoveryFacility: 'NASA Kepler Telescope',
        periodDays: 331.601,
        semiMajorAxisAu: 1.01,
        planetRadiusEarth: 11.32,
        massEarth: null, // Mass unmeasured (upper limit ~5 MJup from TTV)
        equilibriumTempK: 292,
        depthPpm: 10400,
        transitDurationHours: 14.5,
        isHabitableZone: true,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/Kepler-90%20h',
        sourceCitation: 'Cabrera et al. 2014, ApJ, 781, 18; Schmitt et al. 2014, AJ, 148, 28',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes:
          'Jupiter-sized gas giant orbiting within the star’s habitable zone. Likely hosts large exomoons with temperate conditions.',
        radius: 1.25,
        distanceFromStar: 17.0,
        orbitSpeed: 0.32,
        color: '#eab308',
        hasRings: true,
        ringRadius: [1.6, 2.4]
      }
    ]
  },

  // -------------------------------------------------------------------------
  // 3. TRAPPIST-1 System (TIC 149603524 / 2MASS J23062928-0502285)
  // -------------------------------------------------------------------------
  {
    id: 'TIC-149603524',
    name: 'TRAPPIST-1',
    type: 'system',
    position: [58, -12, 32],
    radius: 1.45,
    color: '#ff4422',
    coronaColor: '#aa1100',
    temperature: 2566,
    spectralType: 'M8V',
    spectralClass: 'M',
    luminosity: 0.00055,
    distanceParsecs: 12.47,
    distanceLightYears: 40.7,
    stellarRadiusSolar: 0.121,
    stellarMassSolar: 0.0898,
    magnitude: 18.8,
    raDegrees: 346.6224,
    decDegrees: -5.0414,
    constellation: 'Aquarius',
    mission: 'K2',
    sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/TRAPPIST-1',
    sourceCitation: 'Gillon et al. 2017, Nature, 542, 456; Agol et al. 2021, PSJ, 2, 1',
    retrievalDate: RETRIEVAL_DATE,
    description:
      'Ultra-cool red dwarf star 40.7 light-years away in Aquarius. Hosts seven temperate terrestrial planets in near-resonant compact orbits.',
    planets: [
      {
        id: 'trappist-1-b',
        name: 'TRAPPIST-1 b',
        hostStarId: 'TIC-149603524',
        hostStarName: 'TRAPPIST-1',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2016,
        discoveryFacility: 'TRAPPIST / Spitzer',
        periodDays: 1.511,
        semiMajorAxisAu: 0.0115,
        planetRadiusEarth: 1.116,
        massEarth: 1.374,
        equilibriumTempK: 400,
        depthPpm: 7200,
        transitDurationHours: 0.6,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/TRAPPIST-1%20b',
        sourceCitation: 'Agol et al. 2021, PSJ, 2, 1',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Innermost terrestrial planet. High density consistent with iron-rich rocky composition.',
        radius: 0.38,
        distanceFromStar: 2.8,
        orbitSpeed: 2.1,
        color: '#a16207'
      },
      {
        id: 'trappist-1-c',
        name: 'TRAPPIST-1 c',
        hostStarId: 'TIC-149603524',
        hostStarName: 'TRAPPIST-1',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2016,
        discoveryFacility: 'TRAPPIST / Spitzer',
        periodDays: 2.422,
        semiMajorAxisAu: 0.0158,
        planetRadiusEarth: 1.097,
        massEarth: 1.308,
        equilibriumTempK: 342,
        depthPpm: 7000,
        transitDurationHours: 0.71,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/TRAPPIST-1%20c',
        sourceCitation: 'Agol et al. 2021, PSJ, 2, 1',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'JWST MIRI observations indicate a bare rock or very thin atmosphere.',
        radius: 0.37,
        distanceFromStar: 3.9,
        orbitSpeed: 1.7,
        color: '#ca8a04'
      },
      {
        id: 'trappist-1-d',
        name: 'TRAPPIST-1 d',
        hostStarId: 'TIC-149603524',
        hostStarName: 'TRAPPIST-1',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2016,
        discoveryFacility: 'TRAPPIST / Spitzer',
        periodDays: 4.05,
        semiMajorAxisAu: 0.0223,
        planetRadiusEarth: 0.788,
        massEarth: 0.388,
        equilibriumTempK: 288,
        depthPpm: 3600,
        transitDurationHours: 0.82,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/TRAPPIST-1%20d',
        sourceCitation: 'Agol et al. 2021, PSJ, 2, 1',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Small sub-Earth mass planet bordering the inner edge of the habitable zone.',
        radius: 0.31,
        distanceFromStar: 5.0,
        orbitSpeed: 1.35,
        color: '#ea580c'
      },
      {
        id: 'trappist-1-e',
        name: 'TRAPPIST-1 e',
        hostStarId: 'TIC-149603524',
        hostStarName: 'TRAPPIST-1',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2017,
        discoveryFacility: 'Spitzer / K2 Campaign 12',
        periodDays: 6.099,
        semiMajorAxisAu: 0.0293,
        planetRadiusEarth: 0.92,
        massEarth: 0.692,
        equilibriumTempK: 251,
        depthPpm: 5100,
        transitDurationHours: 0.93,
        isHabitableZone: true,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/TRAPPIST-1%20e',
        sourceCitation: 'Agol et al. 2021, PSJ, 2, 1; Gillon et al. 2017, Nature, 542, 456',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes:
          'Highest Earth Similarity Index candidate in the TRAPPIST-1 system. Density indicates a compact rocky mantle with possible liquid surface water.',
        radius: 0.35,
        distanceFromStar: 6.3,
        orbitSpeed: 1.05,
        color: '#0d9488',
        atmosphereColor: '#2dd4bf'
      },
      {
        id: 'trappist-1-f',
        name: 'TRAPPIST-1 f',
        hostStarId: 'TIC-149603524',
        hostStarName: 'TRAPPIST-1',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2017,
        discoveryFacility: 'Spitzer / K2 Campaign 12',
        periodDays: 9.207,
        semiMajorAxisAu: 0.0385,
        planetRadiusEarth: 1.045,
        massEarth: 1.039,
        equilibriumTempK: 219,
        depthPpm: 6600,
        transitDurationHours: 1.05,
        isHabitableZone: true,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/TRAPPIST-1%20f',
        sourceCitation: 'Agol et al. 2021, PSJ, 2, 1',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Earth-sized planet in the outer habitable zone with potential volatile ice layers.',
        radius: 0.36,
        distanceFromStar: 7.7,
        orbitSpeed: 0.85,
        color: '#0284c7'
      },
      {
        id: 'trappist-1-g',
        name: 'TRAPPIST-1 g',
        hostStarId: 'TIC-149603524',
        hostStarName: 'TRAPPIST-1',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2017,
        discoveryFacility: 'Spitzer / K2 Campaign 12',
        periodDays: 12.353,
        semiMajorAxisAu: 0.0469,
        planetRadiusEarth: 1.129,
        massEarth: 1.321,
        equilibriumTempK: 198,
        depthPpm: 7700,
        transitDurationHours: 1.14,
        isHabitableZone: true,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/TRAPPIST-1%20g',
        sourceCitation: 'Agol et al. 2021, PSJ, 2, 1',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Super-Earth in the cold outer zone; potential global ocean/ice world.',
        radius: 0.39,
        distanceFromStar: 9.1,
        orbitSpeed: 0.72,
        color: '#6366f1'
      },
      {
        id: 'trappist-1-h',
        name: 'TRAPPIST-1 h',
        hostStarId: 'TIC-149603524',
        hostStarName: 'TRAPPIST-1',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2017,
        discoveryFacility: 'Spitzer / K2 Campaign 12',
        periodDays: 18.766,
        semiMajorAxisAu: 0.0619,
        planetRadiusEarth: 0.755,
        massEarth: 0.326,
        equilibriumTempK: 173,
        depthPpm: 3400,
        transitDurationHours: 1.3,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/TRAPPIST-1%20h',
        sourceCitation: 'Agol et al. 2021, PSJ, 2, 1',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Outermost sub-Earth planet orbiting beyond the water-ice snow line.',
        radius: 0.3,
        distanceFromStar: 10.6,
        orbitSpeed: 0.58,
        color: '#9333ea'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // 4. WASP-12 System (TIC 38846515 / 2MASS J06303279+2940202)
  // -------------------------------------------------------------------------
  {
    id: 'TIC-38846515',
    name: 'WASP-12',
    type: 'system',
    position: [-20, 28, 45],
    radius: 2.6,
    color: '#f8f9ff',
    coronaColor: '#80b3ff',
    temperature: 6300,
    spectralType: 'G0',
    spectralClass: 'G',
    luminosity: 3.56,
    distanceParsecs: 427.0,
    distanceLightYears: 1393.0,
    stellarRadiusSolar: 1.59,
    stellarMassSolar: 1.35,
    magnitude: 11.57,
    raDegrees: 97.6366,
    decDegrees: 29.6722,
    constellation: 'Auriga',
    mission: 'TESS',
    sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/WASP-12',
    sourceCitation: 'Hebb et al. 2009, ApJ, 693, 1920; Yee et al. 2020, ApJL, 888, L5',
    retrievalDate: RETRIEVAL_DATE,
    description:
      'Slightly evolved yellow main-sequence star 1,393 light-years away in Auriga hosting an ultra-hot Jupiter undergoing rapid tidal orbital decay.',
    planets: [
      {
        id: 'wasp-12-b',
        name: 'WASP-12 b',
        hostStarId: 'TIC-38846515',
        hostStarName: 'WASP-12',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Transit',
        discoveryYear: 2008,
        discoveryFacility: 'SuperWASP Survey',
        periodDays: 1.091,
        semiMajorAxisAu: 0.0229,
        planetRadiusEarth: 21.3, // ~1.90 R_Jup
        massEarth: 467.0,        // ~1.47 M_Jup
        equilibriumTempK: 2580,
        depthPpm: 14500,
        transitDurationHours: 2.9,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/WASP-12%20b',
        sourceCitation: 'Hebb et al. 2009, ApJ, 693, 1920; Yee et al. 2020, ApJL, 888, L5',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes:
          'Ultra-hot Jupiter tidally disrupted into an egg-like shape and losing atmosphere to the star at ~10^9 kg/s. Orbital period is measurably decaying.',
        radius: 1.35,
        distanceFromStar: 4.5,
        orbitSpeed: 2.4,
        color: '#f97316',
        atmosphereColor: '#fdba74'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // 5. HD 219134 (HR 8832 - Control Host Star)
  // -------------------------------------------------------------------------
  {
    id: 'HD-219134',
    name: 'HD 219134',
    type: 'system',
    position: [-35, -22, -45],
    radius: 1.95,
    color: '#ffb366',
    coronaColor: '#ff6600',
    temperature: 4699,
    spectralType: 'K3V',
    spectralClass: 'K',
    luminosity: 0.28,
    distanceParsecs: 6.53,
    distanceLightYears: 21.3,
    stellarRadiusSolar: 0.778,
    stellarMassSolar: 0.81,
    magnitude: 5.57,
    raDegrees: 348.32,
    decDegrees: 57.17,
    constellation: 'Cassiopeia',
    mission: 'Custom',
    sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/HD%20219134',
    sourceCitation: 'Motalebi et al. 2015, A&A, 584, A72; Gillon et al. 2017, A&A, 601, A117',
    retrievalDate: RETRIEVAL_DATE,
    description:
      'Bright, nearby K-type dwarf star located 21.3 light-years away in Cassiopeia. Serves as an unmodulated control baseline in photometric surveys.',
    planets: [
      {
        id: 'hd-219134-b',
        name: 'HD 219134 b',
        hostStarId: 'HD-219134',
        hostStarName: 'HD 219134',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Radial Velocity',
        discoveryYear: 2015,
        discoveryFacility: 'HARPS-N / Spitzer',
        periodDays: 3.093,
        semiMajorAxisAu: 0.0388,
        planetRadiusEarth: 1.602,
        massEarth: 4.74,
        equilibriumTempK: 1015,
        depthPpm: 360,
        transitDurationHours: 1.9,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/HD%20219134%20b',
        sourceCitation: 'Motalebi et al. 2015, A&A, 584, A72',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Dense rocky super-Earth discovered by radial velocity and subsequently confirmed via Spitzer transits.',
        radius: 0.45,
        distanceFromStar: 4.2,
        orbitSpeed: 1.6,
        color: '#78716c'
      },
      {
        id: 'hd-219134-c',
        name: 'HD 219134 c',
        hostStarId: 'HD-219134',
        hostStarName: 'HD 219134',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Radial Velocity',
        discoveryYear: 2015,
        discoveryFacility: 'HARPS-N / Spitzer',
        periodDays: 6.765,
        semiMajorAxisAu: 0.0653,
        planetRadiusEarth: 1.511,
        massEarth: 4.36,
        equilibriumTempK: 782,
        depthPpm: 320,
        transitDurationHours: 2.3,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/HD%20219134%20c',
        sourceCitation: 'Motalebi et al. 2015, A&A, 584, A72',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Rocky super-Earth orbiting in close proximity to planet b.',
        radius: 0.44,
        distanceFromStar: 5.6,
        orbitSpeed: 1.25,
        color: '#a8a29e'
      },
      {
        id: 'hd-219134-d',
        name: 'HD 219134 d',
        hostStarId: 'HD-219134',
        hostStarName: 'HD 219134',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Radial Velocity',
        discoveryYear: 2015,
        discoveryFacility: 'HARPS-N',
        periodDays: 46.78,
        semiMajorAxisAu: 0.237,
        planetRadiusEarth: null, // Non-transiting; radius unmeasured
        massEarth: 16.17,
        equilibriumTempK: 412,
        depthPpm: null,          // Non-transiting
        transitDurationHours: null,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/HD%20219134%20d',
        sourceCitation: 'Motalebi et al. 2015, A&A, 584, A72',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'Warm Neptune-mass planet identified solely through Doppler wobble; does not transit host star.',
        radius: 0.72,
        distanceFromStar: 8.4,
        orbitSpeed: 0.65,
        color: '#38bdf8'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // 6. Proxima Centauri System (Alpha Centauri C / Flare Star)
  // -------------------------------------------------------------------------
  {
    id: 'PROXIMA-CEN',
    name: 'Proxima Centauri',
    type: 'system',
    position: [24, -26, -18],
    radius: 1.4,
    color: '#ff4422',
    coronaColor: '#aa1100',
    temperature: 3042,
    spectralType: 'M5.5Ve',
    spectralClass: 'M',
    luminosity: 0.0017,
    distanceParsecs: 1.30,
    distanceLightYears: 4.24,
    stellarRadiusSolar: 0.141,
    stellarMassSolar: 0.122,
    magnitude: 11.13,
    raDegrees: 217.4289,
    decDegrees: -62.6795,
    constellation: 'Centaurus',
    mission: 'Custom',
    sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/Proxima%20Cen',
    sourceCitation: 'Anglada-Escudé et al. 2016, Nature, 536, 437; Faria et al. 2022, A&A, 658, A115',
    retrievalDate: RETRIEVAL_DATE,
    description:
      'The closest known star to our Solar System, located just 4.24 light-years away in Centaurus. A low-mass flare star hosting terrestrial-mass planets.',
    planets: [
      {
        id: 'proxima-cen-d',
        name: 'Proxima Centauri d',
        hostStarId: 'PROXIMA-CEN',
        hostStarName: 'Proxima Centauri',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Radial Velocity',
        discoveryYear: 2022,
        discoveryFacility: 'ESPRESSO / ESO VLT',
        periodDays: 5.122,
        semiMajorAxisAu: 0.0288,
        planetRadiusEarth: null, // Non-transiting (sub-Earth candidate)
        massEarth: 0.26,        // Minimum mass M*sin(i)
        equilibriumTempK: 360,
        depthPpm: null,
        transitDurationHours: null,
        isHabitableZone: false,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/Proxima%20Cen%20d',
        sourceCitation: 'Faria et al. 2022, A&A, 658, A115',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes: 'One of the lightest known exoplanets (~1/4 Earth mass) detected with ultra-precise ESPRESSO spectrograph.',
        radius: 0.28,
        distanceFromStar: 3.2,
        orbitSpeed: 1.8,
        color: '#94a3b8'
      },
      {
        id: 'proxima-cen-b',
        name: 'Proxima Centauri b',
        hostStarId: 'PROXIMA-CEN',
        hostStarName: 'Proxima Centauri',
        disposition: 'CONFIRMED',
        discoveryMethod: 'Radial Velocity',
        discoveryYear: 2016,
        discoveryFacility: 'HARPS / Pale Red Dot Campaign',
        periodDays: 11.186,
        semiMajorAxisAu: 0.0485,
        planetRadiusEarth: null, // Non-transiting; radius unmeasured directly
        massEarth: 1.07,         // Minimum mass M*sin(i)
        equilibriumTempK: 234,
        depthPpm: null,          // Non-transiting
        transitDurationHours: null,
        isHabitableZone: true,
        sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/Proxima%20Cen%20b',
        sourceCitation: 'Anglada-Escudé et al. 2016, Nature, 536, 437; Suárez Mascareño et al. 2020, A&A, 639, A77',
        retrievalDate: RETRIEVAL_DATE,
        scientificNotes:
          'Nearest known exoplanet to Earth, located in the circumstellar habitable zone. Non-transiting geometry verified by MOST and TESS photometry.',
        radius: 0.42,
        distanceFromStar: 5.2,
        orbitSpeed: 1.25,
        color: '#dc2626',
        atmosphereColor: '#f87171'
      }
    ]
  }
]

/**
 * Quick search lookup that searches both stars and confirmed planets by name or ID.
 */
export function searchCelestialCatalog(query: string): Array<{
  type: 'star' | 'planet'
  id: string
  name: string
  hostStarName?: string
  star: CelestialObject
  planet?: CelestialPlanet
}> {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const results: Array<{
    type: 'star' | 'planet'
    id: string
    name: string
    hostStarName?: string
    star: CelestialObject
    planet?: CelestialPlanet
  }> = []

  for (const star of BUNDLED_CELESTIAL_SYSTEMS) {
    // Check star match
    if (
      star.name.toLowerCase().includes(q) ||
      star.id.toLowerCase().includes(q) ||
      (star.constellation && star.constellation.toLowerCase().includes(q))
    ) {
      results.push({
        type: 'star',
        id: star.id,
        name: star.name,
        star
      })
    }

    // Check planets match
    if (star.planets) {
      for (const planet of star.planets) {
        if (
          planet.name.toLowerCase().includes(q) ||
          planet.id.toLowerCase().includes(q) ||
          (planet.discoveryMethod && planet.discoveryMethod.toLowerCase().includes(q))
        ) {
          results.push({
            type: 'planet',
            id: planet.id,
            name: planet.name,
            hostStarName: star.name,
            star,
            planet
          })
        }
      }
    }
  }

  return results
}
