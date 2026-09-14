import { jsonError, requireUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { customRequestSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }

  const parsed = customRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid request");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_order_requests")
    .insert({
      user_id: auth.user.id,
      description: parsed.data.description,
      suggested_location: parsed.data.suggestedLocation || null,
      status: "pending_review",
    })
    .select("id")
    .single();

  if (error || !data) return jsonError(error?.message ?? "Could not submit", 500);
  return NextResponse.json({ id: data.id });
}
