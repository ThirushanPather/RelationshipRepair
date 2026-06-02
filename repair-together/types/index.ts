export interface Theme {
  id: string
  name: string
  icon: string
  description: string
}

export interface Topic {
  id: string
  themeId: string
  question: string
  difficulty: 1 | 2 | 3
}

export interface Rating {
  id: string
  topicId: string
  person: "him" | "her"
  score: number
  note?: string
  createdAt: string
}
