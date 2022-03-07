import chroma from 'chroma-js'
import moment from 'moment'

export const FULL_TREATMENT_DAYS = 10
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

export const getFirstDayOfActiveTreatmentPeriod = () => {
  return moment().subtract(FULL_TREATMENT_DAYS, 'days').startOf('day').toDate()
}

const clamp = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max)
