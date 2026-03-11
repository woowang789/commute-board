import { z } from 'zod'

export const WeatherCardSchema = z.object({
  id: z.string(),
  type: z.literal('weather'),
  region: z.string().min(1),
})

export const DustCardSchema = z.object({
  id: z.string(),
  type: z.literal('dust'),
  region: z.string().min(1),
})

export const TransitCardSchema = z.object({
  id: z.string(),
  type: z.literal('transit'),
  transportTypes: z.array(z.enum(['bus', 'subway'])),
  busEntries: z.array(z.object({
    arsId: z.string(),
    stopName: z.string(),
    routeNos: z.array(z.string()),
  })).optional(),
  subwayEntries: z.array(z.object({
    stationName: z.string(),
    lineNos: z.array(z.string()),
  })).optional(),
})

export const CardConfigSchema = z.discriminatedUnion('type', [
  WeatherCardSchema,
  DustCardSchema,
  TransitCardSchema,
])

export type WeatherCardConfig = z.infer<typeof WeatherCardSchema>
export type DustCardConfig = z.infer<typeof DustCardSchema>
export type TransitCardConfig = z.infer<typeof TransitCardSchema>
export type CardConfig = z.infer<typeof CardConfigSchema>
export type CardType = CardConfig['type']
