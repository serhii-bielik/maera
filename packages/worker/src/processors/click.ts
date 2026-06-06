import type { Job } from 'bullmq'
import { prisma } from '../lib/prisma'
import type { ClickJob } from '@maera/shared'

export async function processClick(job: Job<ClickJob>): Promise<void> {
  const data = job.data

  await prisma.click.create({
    data: {
      campaignId: data.campaignId,
      flowId: data.flowId,
      ip: data.ip,
      country: data.country,
      city: data.city,
      language: data.language,
      userAgent: data.userAgent,
      browser: data.browser,
      os: data.os,
      device: data.device,
      referrer: data.referrer,
      isBot: data.isBot,
      isUnique: data.isUnique,
    },
  })
}
