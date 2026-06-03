import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PATCH(
  request: NextRequest,
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

    const body = await request.json()
    const patch: Record<string, unknown> = {}

    if (body.question !== undefined) {
      if (typeof body.question !== "string" || body.question.trim() === "") {
        return NextResponse.json({ error: "question must be a non-empty string" }, { status: 400 })
      }
      patch.question = body.question.trim()
    }

    if (body.difficulty !== undefined) {
      if (![1, 2, 3].includes(body.difficulty)) {
        return NextResponse.json({ error: "difficulty must be 1, 2, or 3" }, { status: 400 })
      }
      patch.difficulty = body.difficulty
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("topics")
      .update(patch)
      .eq("id", id)
      .select("id,theme_id,question,difficulty,sort_order")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

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

    // Explicit cascade cleanup before deleting topic
    await supabase.from("ratings").delete().eq("topic_id", id)

    const { error } = await supabase.from("topics").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
