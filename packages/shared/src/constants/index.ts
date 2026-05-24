import { FilterType, RotationType } from '../types'

export const FILTER_TYPES = Object.values(FilterType)
export const DEFAULT_UNIQUE_TTL = 24 // часы
export const DEFAULT_ROTATION = RotationType.SEQUENTIAL
export const CLICK_QUEUE_NAME = 'clicks'
export const MAX_FLOWS_PER_CAMPAIGN = 100
export const TOKEN_LENGTH = 6
