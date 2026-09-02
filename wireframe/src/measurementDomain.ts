import type { DimensionGroup } from './cargoDomain'

export function measured(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
export function dimensionState(group: DimensionGroup) {
  if (group.notMeasurable) return 'not_measurable'
  const count = [group.length, group.width, group.height].filter(measured).length
  return count === 3 ? 'complete' : count === 0 ? 'unknown' : 'partial'
}
export function dimensionText(group: DimensionGroup) {
  const state = dimensionState(group)
  if (state === 'not_measurable') return 'Not measurable'
  if (state === 'unknown') return 'Not measured'
  return `${[group.length, group.width, group.height].map((value) => measured(value) ? value : '—').join(' × ')} in`
}
export function unknownWeight(group: DimensionGroup) {
  // Undefined is a legacy allocation from a known order total; null is explicitly unknown.
  return group.weight !== undefined && !measured(group.weight)
}
export interface MeasurementSummary {
  incompletePlaces: number
  unknownWeightPlaces: number
  reasons: Array<{ group: number; quantity: number; dimensions: string; weightUnknown: boolean; reason: string }>
}
export function summarizeMeasurements(groups: DimensionGroup[]): MeasurementSummary {
  return {
    incompletePlaces: groups.reduce((sum, group) => sum + (dimensionState(group) === 'complete' ? 0 : group.quantity), 0),
    unknownWeightPlaces: groups.reduce((sum, group) => sum + (unknownWeight(group) ? group.quantity : 0), 0),
    reasons: groups.flatMap((group, index) => dimensionState(group) !== 'complete' || unknownWeight(group)
      ? [{ group: index + 1, quantity: group.quantity, dimensions: dimensionText(group),
        weightUnknown: unknownWeight(group), reason: group.unknownReason?.trim() || '' }] : []),
  }
}
export function measurementIssues(groups: DimensionGroup[]) {
  return summarizeMeasurements(groups).reasons.filter((item) => !item.reason)
    .map((item) => `Group ${item.group}: add a reason for unmeasured values.`)
}
export function weightText(total: number, summary?: Pick<MeasurementSummary, 'unknownWeightPlaces'>) {
  return summary?.unknownWeightPlaces ? (total > 0 ? `${total} lb known` : 'Not measured') : `${total} lb`
}
export function volumeText(total: number, summary?: Pick<MeasurementSummary, 'incompletePlaces'>) {
  return summary?.incompletePlaces ? (total > 0 ? `${total.toFixed(2)} cu ft known` : 'Not measured') : `${total.toFixed(2)} cu ft`
}
