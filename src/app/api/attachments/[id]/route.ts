import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAttachmentSignedUrl } from "@/lib/storage/attachments";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: attachment, error } = await supabase
    .from("attachments")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (error || !attachment) {
    return NextResponse.json({ error: "Anexo não encontrado." }, { status: 404 });
  }

  try {
    const url = await createAttachmentSignedUrl(supabase, attachment.storage_path);
    return NextResponse.redirect(url);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao gerar link do anexo." },
      { status: 500 }
    );
  }
}
