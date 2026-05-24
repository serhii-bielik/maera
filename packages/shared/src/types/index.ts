// Enums
export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum RotationType {
  SEQUENTIAL = 'SEQUENTIAL',
  WEIGHTED = 'WEIGHTED',
}

export enum FlowType {
  URL = 'URL',
  ACTION = 'ACTION',
}

export enum RedirectType {
  HTTP_301 = 'HTTP_301',
  HTTP_302 = 'HTTP_302',
  META = 'META',
  JS = 'JS',
}

export enum ActionType {
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  SHOW_HTML = 'SHOW_HTML',
  SHOW_TEXT = 'SHOW_TEXT',
}

export enum FilterType {
  COUNTRY = 'COUNTRY',
  LANGUAGE = 'LANGUAGE',
  USER_AGENT = 'USER_AGENT',
  BOT = 'BOT',
  UNIQUE = 'UNIQUE',
  GEO_GROUP = 'GEO_GROUP',
  IP = 'IP',
  DEVICE_TYPE = 'DEVICE_TYPE',
  OS = 'OS',
}

export enum FilterMode {
  IS = 'IS',
  IS_NOT = 'IS_NOT',
}

export enum FilterLogic {
  AND = 'AND',
  OR = 'OR',
}

export enum UniquenessType {
  IP_USER_AGENT = 'IP_USER_AGENT',
  IP_ONLY = 'IP_ONLY',
  PARAMETER = 'PARAMETER',
}

// Click context — данные о входящем клике
export interface ClickContext {
  ip: string
  country: string | null
  city: string | null
  language: string | null
  userAgent: string | null
  device: string | null
  os: string | null
  browser: string | null
  isBot: boolean
  cookieId: string | null
  referrer: string | null
}

// API типы
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
