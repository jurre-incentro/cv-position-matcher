import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Scan id is verplicht" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error, count } = await supabase
    .from("scan_jobs")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (count === 0) {
    return NextResponse.json({ error: "Scan niet gevonden" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
