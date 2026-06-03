import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: existing } = await supabase
      .from("topics")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    const { data: deleted, error } = await supabase
      .from("ratings")
      .delete()
      .eq("topic_id", id)
      .select("id")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: deleted?.length ?? 0 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
