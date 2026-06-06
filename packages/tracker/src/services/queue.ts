import { Queue } from 'bullmq'
import { redis } from '../lib/redis'
import { CLICK_QUEUE_NAME, type ClickJob } from '@maera/shared'

export { type ClickJob }

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
