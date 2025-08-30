import { z } from "zod";

export const ApiConfigSchema = z.object({
  baseUrl: z.string().url(),
  auth: z
    .object({
      type: z.enum(["none", "bearer", "header"]).default("none"),
      token: z.string().optional(),
      headerName: z.string().optional(),
    })
    .default({ type: "none" }),
  headers: z.record(z.string()).default({}),
  timeoutMs: z.number().min(1000).max(60000).default(15000),
  retry: z
    .object({
      retries: z.number().int().min(0).max(3).default(0),
      backoffMs: z.number().int().min(100).max(30000).default(500),
    })
    .default({ retries: 0, backoffMs: 500 }),
  allowHttp: z.boolean().default(false),
});

export const ButtonConfigSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(24),
  icon: z.string().default("play"),
  enabled: z.boolean().default(true),
  method: z.enum(["POST", "GET"]).default("POST"),
  endpoint: z.string(),
  payloadTemplate: z.string().optional(),
  queryTemplate: z.record(z.string()).optional(),
  contentType: z
    .enum(["application/json", "text/plain", "application/x-www-form-urlencoded"])
    .default("application/json"),
  passPageTitle: z.boolean().default(false),
  passPagePath: z.boolean().default(false),
  passVaultName: z.boolean().default(false),
  timeoutMs: z.number().int().min(1000).max(60000).optional(),
});

export const SettingsSchema = z.object({
  api: ApiConfigSchema,
  buttons: z.array(ButtonConfigSchema).max(8).default([]),
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type ButtonConfig = z.infer<typeof ButtonConfigSchema>;
export type PluginSettings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: PluginSettings = {
  api: {
    baseUrl: "https://example.com",
    auth: { type: "none" },
    headers: {},
    timeoutMs: 15000,
    retry: { retries: 0, backoffMs: 500 },
    allowHttp: false,
  },
  buttons: [],
};
