import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: theme } = await supabase
      .from("themes")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (!theme) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 })
    }

    const { data: topics } = await supabase
      .from("topics")
      .select("id")
      .eq("theme_id", id)

    const topicIds = (topics ?? []).map(t => t.id)

    if (topicIds.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 })
    }

    const { data: deleted, error } = await supabase
      .from("ratings")
      .delete()
      .in("topic_id", topicIds)
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
