import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '../lib/prisma'
import { processClick } from '../processors/click'
import type { Job } from 'bullmq'
import type { ClickJob } from '@maera/shared'

let campaignId: string

beforeAll(async () => {
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Worker Test Campaign',
      alias: 'workertest',
      flows: {
        create: {
          name: 'Test Flow',
          type: 'URL',
          url: 'https://example.com',
          redirectType: 'HTTP_302',
          position: 0,
        },
      },
    },
    include: { flows: true },
  })
  campaignId = campaign.id
})

function makeJob(data: Partial<ClickJob> = {}): Job<ClickJob> {
  return {
    id: '1',
    data: {
      campaignId,
      flowId: null,
      ip: '1.2.3.4',
      country: 'US',
      city: 'New York',
      language: 'en-US',
      userAgent: 'Mozilla/5.0 Chrome/120',
      browser: 'Chrome',
      os: 'Windows',
      device: 'desktop',
      referrer: null,
      isBot: false,
      isUnique: true,
      ...data,
    },
  } as unknown as Job<ClickJob>
}

describe('processClick', () => {
  it('saves click to database', async () => {
    await processClick(makeJob())

    const click = await prisma.click.findFirst({
      where: { campaignId },
    })

    expect(click).toBeTruthy()
    expect(click?.ip).toBe('1.2.3.4')
    expect(click?.country).toBe('US')
    expect(click?.isBot).toBe(false)
    expect(click?.isUnique).toBe(true)
  })

  it('saves bot click correctly', async () => {
    await processClick(makeJob({ isBot: true, isUnique: false }))

    const clicks = await prisma.click.findMany({
      where: { campaignId, isBot: true },
    })

    expect(clicks.length).toBeGreaterThan(0)
    expect(clicks[0].isBot).toBe(true)
  })

  it('saves click with all fields', async () => {
    await processClick(
      makeJob({
        country: 'DE',
        city: 'Berlin',
        language: 'de-DE',
        browser: 'Firefox',
        os: 'Linux',
        device: 'desktop',
        referrer: 'https://google.com',
      })
    )

    const click = await prisma.click.findFirst({
      where: { campaignId, country: 'DE' },
    })

    expect(click?.city).toBe('Berlin')
    expect(click?.browser).toBe('Firefox')
    expect(click?.referrer).toBe('https://google.com')
  })
})
