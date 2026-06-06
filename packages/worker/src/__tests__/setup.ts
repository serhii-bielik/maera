import { prisma } from '../lib/prisma'
import { redis } from '../lib/redis'

beforeAll(async () => {
  await prisma.click.deleteMany()
  await prisma.flow.deleteMany()
  await prisma.campaign.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
  await redis.quit()
})
