import 'dotenv/config'
import { Worker, type Job } from 'bullmq'
import { redis } from './lib/redis'
import { processClick } from './processors/click'
import { CLICK_QUEUE_NAME, type ClickJob } from '@maera/shared'

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY ?? '5')

async function startWorker() {
  console.log('🔧 Starting Maera Worker...')

  const worker = new Worker<ClickJob>(
    CLICK_QUEUE_NAME,
    async (job: Job<ClickJob>) => {
      await processClick(job)
    },
    {
      connection: redis,
      concurrency: CONCURRENCY,
    }
  )

  worker.on('completed', (job) => {
    console.log(`✅ Click processed: job ${job.id}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ Click failed: job ${job?.id}`, err.message)
  })

  worker.on('error', (err) => {
    console.error('Worker error:', err)
  })

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down worker...')
    await worker.close()
    await redis.quit()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    console.log('Shutting down worker...')
    await worker.close()
    await redis.quit()
    process.exit(0)
  })

  console.log(`✅ Worker listening on queue: ${CLICK_QUEUE_NAME}`)
  console.log(`   Concurrency: ${CONCURRENCY}`)
}

startWorker().catch((err) => {
  console.error('Failed to start worker:', err)
  process.exit(1)
})
