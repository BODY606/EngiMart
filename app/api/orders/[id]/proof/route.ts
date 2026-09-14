import { jsonError, requireUser } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!order || order.user_id !== auth.user.id) {
    return jsonError("Order not found", 404);
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Choose an image");
  if (!ALLOWED.has(file.type)) return jsonError("Use a JPG, PNG, or WebP image");
  if (file.size > MAX_BYTES) return jsonError("Image must be under 5MB");

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${auth.user.id}/${id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from("transfer-proofs")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return jsonError(uploadError.message, 500);

  const { error: updateError } = await admin
    .from("orders")
    .update({ transfer_proof_url: path })
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (updateError) return jsonError(updateError.message, 500);
  return NextResponse.json({ ok: true });
}
