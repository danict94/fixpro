export type PriceSummary = {
  range: string
  note: string
}

export type DetailedCostItem = {
  label: string
  unit: string
  min: number
  max: number
  note: string
}

export type RealExample = {
  title: string
  description: string
  price: string
}

export type FaqItem = {
  question: string
  answer: string
}

export type GuideStep = {
  title: string
  explanation: string
  errors: string[]
}

export type MaterialItem = {
  label: string
  note: string
}

export type CostSignal = {
  label: string
  note: string
}

export type InterventoContent = {
  slug: string
  price: PriceSummary
  detailedCosts: DetailedCostItem[]
  realExamples: RealExample[]
  whenCostIncreases: CostSignal[]
  whenCostDecreases: CostSignal[]
  faq: FaqItem[]
  guideSteps: GuideStep[]
  materials: MaterialItem[]
  mistakes: string[]
}