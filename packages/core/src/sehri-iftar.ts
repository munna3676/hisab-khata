import { round } from './lib/money.ts'
import { addDays, isValidDate, toDayNumber, weekdayOf, type CalendarDate } from './lib/dates-calendar.ts'

/** One district as the repo-root data/districts.json lists it. */
export interface District {
  id: string
  en: string
  bn: string
  division: string
  divisionBn: string
  /** District headquarters, degrees north. */
  lat: number
  /** District headquarters, degrees east. */
  lng: number
}

/** How sehri and iftar are worked out from the sun (from data; defaults below). */
export interface SehriIftarMethod {
  /** Sun's depth below the horizon at Subh Sadiq (dawn), in degrees. */
  fajrAngle: number
  /** Minutes taken off dawn for the end of sehri (ihtiyat); may be fractional, the result is rounded. */
  sehriPrecautionMin: number
  /** Minutes added to sunset for iftar; may be fractional, the result is rounded. */
  iftarPrecautionMin: number
  /** Local clock ahead of UTC, in minutes: Bangladesh Standard Time is 360. */
  utcOffsetMinutes: number
}

/**
 * Islamic Foundation Bangladesh practice: Fajr at 18° (University of Islamic
 * Sciences, Karachi, the method used for Bangladesh, https://aladhan.com/calculation-methods)
 * with a little ihtiyat on both ends (IFB, https://bangla.bdnews24.com/bangladesh/dd70922dc361).
 * IFB does not publish its exact margins, so they are fitted: 0.8 and 1.7
 * minutes (the middle of the ranges 0.73–0.91 and 1.52–1.85 that fit) make
 * Dhaka reproduce all 12 published rows of IFB's Ramadan 2026 timetable
 * (19 Feb–20 Mar 2026) to the minute; whole minutes (1 and 2) miss 5 of them.
 */
export const IFB_METHOD: SehriIftarMethod = { fajrAngle: 18, sehriPrecautionMin: 0.8, iftarPrecautionMin: 1.7, utcOffsetMinutes: 360 }

export interface SehriIftarInput {
  date: CalendarDate
  lat: number
  lng: number
  /** Any part left out comes from IFB_METHOD. */
  method?: Partial<SehriIftarMethod>
}

/** Every time is whole minutes after local midnight (312 = ৫:১২, 1078 = ৫:৫৮ সন্ধ্যা). */
export interface SehriIftarResult {
  /** End of sehri: dawn minus the precaution. */
  sehri: number
  /** Iftar: sunset plus the precaution. */
  iftar: number
  /** Subh Sadiq, the start of Fajr. */
  fajr: number
  sunrise: number
  sunset: number
}

export interface RamadanTimetableInput {
  /** First day of Ramadan as announced in Bangladesh (from data). */
  start: CalendarDate
  /** 29 or 30. */
  days: number
  lat: number
  lng: number
  method?: Partial<SehriIftarMethod>
}

export interface RamadanRow {
  /** Day of Ramadan, from 1. */
  roza: number
  date: CalendarDate
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number
  sehri: number
  iftar: number
}

export type SehriIftarError = 'date' | 'lat' | 'lng' | 'method'
export type RamadanTimetableError = 'start' | 'days' | SehriIftarError

const RAD = Math.PI / 180
/** The sun's centre at sunrise and sunset: 34′ refraction plus 16′ semi-diameter below the horizon. */
const SUNSET_ALTITUDE = -0.833

/** Sun's declination (degrees) and equation of time (minutes) at Julian day `jd` (NOAA solar calculator). */
function sunPosition(jd: number): { declination: number; equationOfTime: number } {
  const t = (jd - 2451545) / 36525
  const meanLong = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360
  const meanAnomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t)
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t)
  const center =
    Math.sin(meanAnomaly * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * meanAnomaly * RAD) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * meanAnomaly * RAD) * 0.000289
  const omega = 125.04 - 1934.136 * t
  const apparentLong = meanLong + center - 0.00569 - 0.00478 * Math.sin(omega * RAD)
  const meanObliquity = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60
  const obliquity = meanObliquity + 0.00256 * Math.cos(omega * RAD)
  const declination = Math.asin(Math.sin(obliquity * RAD) * Math.sin(apparentLong * RAD)) / RAD
  const y = Math.tan((obliquity / 2) * RAD) ** 2
  const equationOfTime =
    (4 / RAD) *
    (y * Math.sin(2 * meanLong * RAD) -
      2 * e * Math.sin(meanAnomaly * RAD) +
      4 * e * y * Math.sin(meanAnomaly * RAD) * Math.cos(2 * meanLong * RAD) -
      0.5 * y * y * Math.sin(4 * meanLong * RAD) -
      1.25 * e * e * Math.sin(2 * meanAnomaly * RAD))
  return { declination, equationOfTime }
}

/** Local minutes after midnight when the sun's centre is at `altitude`, before noon (-1) or after (+1). */
function sunAt(date: CalendarDate, lat: number, lng: number, altitude: number, side: -1 | 1, utcOffset: number): number {
  const midnightJd = toDayNumber(date) + 2440587.5
  let minutes = side < 0 ? 360 : 1080
  // Three passes settle the sun's position at the event itself.
  for (let pass = 0; pass < 3; pass++) {
    const { declination, equationOfTime } = sunPosition(midnightJd + (minutes - utcOffset) / 1440)
    const cosH =
      (Math.sin(altitude * RAD) - Math.sin(lat * RAD) * Math.sin(declination * RAD)) /
      (Math.cos(lat * RAD) * Math.cos(declination * RAD))
    const hourAngle = Math.acos(Math.min(1, Math.max(-1, cosH))) / RAD
    minutes = 720 - 4 * lng - equationOfTime + utcOffset + side * 4 * hourAngle
  }
  return minutes
}

/** IFB_METHOD with the given parts on top; a part set to undefined keeps the default. */
function resolve(method?: Partial<SehriIftarMethod>): SehriIftarMethod {
  const given = Object.entries(method ?? {}).filter(([, value]) => value !== undefined)
  return { ...IFB_METHOD, ...Object.fromEntries(given) }
}

function methodError(method?: Partial<SehriIftarMethod>): boolean {
  const m = resolve(method)
  return !(
    m.fajrAngle >= 12 && m.fajrAngle <= 20 &&
    m.sehriPrecautionMin >= 0 && m.sehriPrecautionMin <= 30 &&
    m.iftarPrecautionMin >= 0 && m.iftarPrecautionMin <= 30 &&
    Number.isInteger(m.utcOffsetMinutes) && m.utcOffsetMinutes >= -720 && m.utcOffsetMinutes <= 840
  )
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateSehriIftar(input: SehriIftarInput): SehriIftarError | null {
  if (!isValidDate(input.date, 1900, 2200)) return 'date'
  // Within 45° of the equator the sun always sets and always reaches 20° below.
  if (!(input.lat >= -45 && input.lat <= 45)) return 'lat'
  if (!(input.lng >= -180 && input.lng <= 180)) return 'lng'
  if (methodError(input.method)) return 'method'
  return null
}

/** Sehri end and iftar for one day at one place, with dawn, sunrise and sunset. */
export function calculateSehriIftar(input: SehriIftarInput): SehriIftarResult {
  const { date, lat, lng } = input
  const m = resolve(input.method)
  const fajr = sunAt(date, lat, lng, -m.fajrAngle, -1, m.utcOffsetMinutes)
  const sunrise = sunAt(date, lat, lng, SUNSET_ALTITUDE, -1, m.utcOffsetMinutes)
  const sunset = sunAt(date, lat, lng, SUNSET_ALTITUDE, 1, m.utcOffsetMinutes)
  return {
    sehri: round(fajr - m.sehriPrecautionMin, 0),
    iftar: round(sunset + m.iftarPrecautionMin, 0),
    fajr: round(fajr, 0),
    sunrise: round(sunrise, 0),
    sunset: round(sunset, 0),
  }
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateRamadanTimetable(input: RamadanTimetableInput): RamadanTimetableError | null {
  if (!isValidDate(input.start, 1900, 2199)) return 'start'
  if (input.days !== 29 && input.days !== 30) return 'days'
  const error = validateSehriIftar({ date: input.start, lat: input.lat, lng: input.lng, method: input.method })
  return error === 'date' ? 'start' : error
}

/** The whole month's timetable ("পুরো মাস"). */
export function calculateRamadanTimetable(input: RamadanTimetableInput): RamadanRow[] {
  const rows: RamadanRow[] = []
  for (let roza = 1; roza <= input.days; roza++) {
    const date = addDays(input.start, roza - 1)
    const { sehri, iftar } = calculateSehriIftar({ date, lat: input.lat, lng: input.lng, method: input.method })
    rows.push({ roza, date, weekday: weekdayOf(date), sehri, iftar })
  }
  return rows
}

/** 1078 → { hour: 17, minute: 58 } (24-hour), for the screen's clock format. */
export function clockOf(minutes: number): { hour: number; minute: number } {
  const m = ((minutes % 1440) + 1440) % 1440
  return { hour: Math.floor(m / 60), minute: m % 60 }
}
