import { z } from 'zod'

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  alias: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric, dash and underscore allowed')
    .optional(),
  groupId: z.string().optional(),
  rotation: z.enum(['SEQUENTIAL', 'WEIGHTED']).default('SEQUENTIAL'),
  uniqueness: z.enum(['IP_USER_AGENT', 'IP_ONLY', 'PARAMETER']).default('IP_USER_AGENT'),
  uniquenessTtl: z.number().int().min(1).max(8760).default(24),
  useCookies: z.boolean().default(true),
  notes: z.string().optional(),
})

export const updateCampaignSchema = createCampaignSchema.partial()

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>
