import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { AttachmentOwnerType } from "@/types/domain";

const BUCKET = "attachments";

/**
 * Sobe um arquivo pro bucket privado `attachments` e registra os metadados
 * na tabela `attachments`. Reaproveitado pela Fase 5 (orçamento/NF/garantia
 * de manutenção) — só muda o `ownerType`.
 */
export async function uploadAttachment(
  supabase: SupabaseClient<Database>,
  params: {
    file: File;
    ownerType: AttachmentOwnerType;
    ownerId: string;
    uploadedBy: string;
  }
) {
  const path = `${params.ownerType}/${params.ownerId}/${Date.now()}-${params.file.name}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, params.file);
  if (uploadError) throw new Error(`Erro ao enviar arquivo: ${uploadError.message}`);

  const { error: insertError } = await supabase.from("attachments").insert({
    owner_type: params.ownerType,
    owner_id: params.ownerId,
    storage_path: path,
    file_name: params.file.name,
    mime_type: params.file.type || null,
    uploaded_by: params.uploadedBy,
  });
  if (insertError) throw new Error(`Erro ao registrar anexo: ${insertError.message}`);
}

export async function createAttachmentSignedUrl(supabase: SupabaseClient<Database>, storagePath: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60);
  if (error || !data) throw new Error(error?.message ?? "Não foi possível gerar o link do arquivo.");
  return data.signedUrl;
}
