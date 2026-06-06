export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { ConversationsClient } from "./ConversationsClient"

export default function ConversationsPage() {
  return (
    <Suspense>
      <ConversationsClient />
    </Suspense>
  )
}
