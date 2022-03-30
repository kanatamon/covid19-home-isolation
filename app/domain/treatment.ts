import chroma from 'chroma-js'
import moment, { Moment } from 'moment'

const CERT_AVAILABLE_DAYS_OFFSET_AFTER_RECOVERY = 1
const DAYS_OFFSET_BEFORE_RECOVERY_TO_BE_SERVICED = 1
export const FULL_TREATMENT_DAYS = 7
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
    const firstDay = getToday().subtract(FULL_TREATMENT_DAYS, 'days')
    return firstDay.add(dayOffset, 'days')
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

  public getRecoveryDate(): Date {
    return this.getRecoveryDay().toDate()
  }

  public getCertAvailableDate(): Date {
    return this.getRecoveryDay()
      .add(CERT_AVAILABLE_DAYS_OFFSET_AFTER_RECOVERY, 'days')
      .toDate()
  }

  public getLastServiceDate(): Date {
    return this.getRecoveryDay()
      .subtract(DAYS_OFFSET_BEFORE_RECOVERY_TO_BE_SERVICED, 'days')
      .toDate()
  }

  private getRecoveryDay(): Moment {
    return moment(this.admittedDay).add(FULL_TREATMENT_DAYS, 'days')
  }
}

const clamp = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max)
