import chroma from 'chroma-js'
import moment, { Moment } from 'moment'

const CERT_AVAILABLE_DAYS = 12
const SERVICE_DAY = 6
export const FULL_TREATMENT_DAYS = 7
const FULL_HOME_ISOLATION_DAYS = 10
export const HEALTH_SHADES = ['#f7797d', '#fbd786', '#c6ffdd']

export const calculateTreatmentDayCount = (admittedAt: Date) => {
  const today = moment().startOf('day')
  const admittedDay = moment(admittedAt).startOf('day')
  const dayDiff = today.diff(admittedDay, 'days')
  const day = clamp(dayDiff, 0, FULL_TREATMENT_DAYS)

  return day
}

export const calculateRecoveryDay = (admittedAt: Date) => {
  return moment(admittedAt)
    .add(FULL_TREATMENT_DAYS, 'day')
    .set({ hour: 6, minute: 0 })
    .toDate()
}

export const hasRecoverySinceNow = (admittedAt: Date) => {
  const recoveryDate = calculateRecoveryDay(admittedAt)
  return moment().isAfter(recoveryDate)
}

const healthScale = chroma.scale(HEALTH_SHADES)

export const calculateTreatmentScale = (treatmentDayCount: number) => {
  const value = treatmentDayCount / FULL_TREATMENT_DAYS
  return { value, color: healthScale(value).hex() }
}

export namespace activeTreatmentPeriod {
  function getToday() {
    return moment().startOf('day')
  }

  function getDaySince(dayOffset: number): Moment {
    if (dayOffset > FULL_TREATMENT_DAYS) {
      console.warn(`'dayOffset' should be in range [0, ${FULL_TREATMENT_DAYS}]`)
    }
    return getToday().subtract(FULL_TREATMENT_DAYS - dayOffset, 'days')
  }

  export function getDateSinceFirstDay(dayOffset: number): Date {
    return getDaySince(dayOffset).toDate()
  }

  export function getFirstDate(): Date {
    return getDateSinceFirstDay(0)
  }
}

export class Treatment {
  private admittedDay: Moment

  constructor(admittedDate: Date) {
    this.admittedDay = moment(admittedDate)
  }

  public getEndHomeIsolationDate(): Date {
    return moment(this.admittedDay)
      .add(FULL_HOME_ISOLATION_DAYS, 'days')
      .toDate()
  }

  public getRecoveryDate(): Date {
    return moment(this.admittedDay).add(FULL_TREATMENT_DAYS, 'days').toDate()
  }

  public getCertAvailableDate(): Date {
    return moment(this.admittedDay).add(CERT_AVAILABLE_DAYS, 'days').toDate()
  }

  public getLastServiceDate(): Date {
    return moment(this.admittedDay).add(SERVICE_DAY, 'days').toDate()
  }
}

const clamp = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max)
