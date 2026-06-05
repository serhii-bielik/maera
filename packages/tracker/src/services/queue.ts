import { Queue } from 'bullmq'
import { redis } from '../lib/redis'
import { CLICK_QUEUE_NAME } from '@maera/shared'

export interface ClickJob {
  campaignId: string
  flowId: string | null
  ip: string
  country: string | null
  city: string | null
  language: string | null
  userAgent: string | null
  browser: string | null
  os: string | null
  device: string | null
  referrer: string | null
  isBot: boolean
  isUnique: boolean
}

export const clickQueue = new Queue<ClickJob>(CLICK_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 1000,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
})
