import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { generateToken } from '../packages/shared/src/utils/index'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding Maera database...')

  // Admin пользователь
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@maera.io' },
    update: {},
    create: {
      email: 'admin@maera.io',
      password: hashedPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user:', admin.email)

  // Тестовая группа
  const group = await prisma.campaignGroup.upsert({
    where: { id: 'test-group-1' },
    update: {},
    create: {
      id: 'test-group-1',
      name: 'Test Group',
    },
  })

  // Тестовая кампания
  const campaign = await prisma.campaign.upsert({
    where: { alias: 'test01' },
    update: {},
    create: {
      name: 'Test Campaign',
      alias: 'test01',
      groupId: group.id,
      rotation: 'SEQUENTIAL',
      uniqueness: 'IP_USER_AGENT',
    },
  })
  console.log('✅ Test campaign alias:', campaign.alias)

  // Default (exit) поток
  await prisma.flow.upsert({
    where: { id: 'default-flow-1' },
    update: {},
    create: {
      id: 'default-flow-1',
      campaignId: campaign.id,
      name: 'Default',
      type: 'ACTION',
      action: 'NOT_FOUND',
      position: 999,
      isDefault: true,
    },
  })

  // Обычный поток с URL
  await prisma.flow.upsert({
    where: { id: 'flow-1' },
    update: {},
    create: {
      id: 'flow-1',
      campaignId: campaign.id,
      name: 'Main Flow',
      type: 'URL',
      url: 'https://example.com',
      redirectType: 'HTTP_302',
      position: 0,
      filterLogic: 'AND',
      filters: {
        create: [
          {
            type: 'BOT',
            mode: 'IS_NOT',
            values: ['true'],
          },
        ],
      },
    },
  })

  // Системные настройки
  await prisma.setting.upsert({
    where: { key: 'system' },
    update: {},
    create: {
      key: 'system',
      value: {
        statisticsRetentionDays: 90,
        botDetection: {
          emptyUserAgent: true,
          checkIpList: true,
        },
      },
    },
  })

  console.log('🎉 Seed completed!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
