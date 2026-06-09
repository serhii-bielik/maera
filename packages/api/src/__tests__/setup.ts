import { afterAll, beforeAll } from 'vitest'
import { prisma } from '../lib/prisma'

beforeAll(async () => {
  await prisma.click.deleteMany()
  await prisma.filter.deleteMany()
  await prisma.flow.deleteMany()
  await prisma.campaignUser.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
