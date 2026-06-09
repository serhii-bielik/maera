import { z } from 'zod'

export const createFlowSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['URL', 'ACTION']).default('URL'),
  position: z.number().int().min(0).default(0),
  weight: z.number().int().min(1).max(100).default(100),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  collectClicks: z.boolean().default(true),
  notes: z.string().optional(),
  url: z.string().url().optional(),
  redirectType: z.enum(['HTTP_301', 'HTTP_302', 'META', 'JS']).optional(),
  action: z.enum(['NOT_FOUND', 'FORBIDDEN', 'SHOW_HTML', 'SHOW_TEXT']).optional(),
  actionContent: z.string().optional(),
  filterLogic: z.enum(['AND', 'OR']).default('AND'),
})

export const updateFlowSchema = createFlowSchema.partial()

export type CreateFlowInput = z.infer<typeof createFlowSchema>
export type UpdateFlowInput = z.infer<typeof updateFlowSchema>
