import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { theme_id, question, difficulty, added_by } = body

    if (!theme_id || typeof theme_id !== "string") {
      return NextResponse.json({ error: "theme_id is required" }, { status: 400 })
    }
    if (!question || typeof question !== "string" || question.trim() === "") {
      return NextResponse.json({ error: "question must be a non-empty string" }, { status: 400 })
    }
    if (![1, 2, 3].includes(difficulty)) {
      return NextResponse.json({ error: "difficulty must be 1, 2, or 3" }, { status: 400 })
    }

    const { data: maxRow } = await supabase
      .from("topics")
      .select("sort_order")
      .eq("theme_id", theme_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    const sortOrder = (maxRow?.sort_order ?? 0) + 1
    const addedBy = added_by === "him" || added_by === "her" ? added_by : null

    const { data, error } = await supabase
      .from("topics")
      .insert({ theme_id, question: question.trim(), difficulty, sort_order: sortOrder, added_by: addedBy })
      .select("id,theme_id,question,difficulty,sort_order,added_by")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
