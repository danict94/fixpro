import { taxonomy, interventiData } from './taxonomy-data'
import { validateSeed } from './taxonomy-validate'

validateSeed({
  taxonomy,
  interventiData,
})

console.log('✅ Taxonomy seed valido')