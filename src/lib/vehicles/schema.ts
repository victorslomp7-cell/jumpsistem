import { z } from "zod";

/** Compartilhado entre o form (client) e a Server Action (validação real). */
export const vehicleFormSchema = z.object({
  nickname: z.string().trim().min(1, "Informe um apelido/identificação."),
  type: z.enum(["jet_ski", "lancha", "outro"]),
  model: z.string().trim().optional(),
  plate: z.string().trim().optional(),
  year: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || (Number.isInteger(v) && v > 1900), {
      message: "Ano inválido.",
    }),
  revision_interval_hours: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || v > 0, { message: "Deve ser maior que zero." }),
  revision_warning_hours: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || v >= 0, { message: "Não pode ser negativo." }),
  battery_check_frequency_days: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;
