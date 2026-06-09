const OpenAI = require('openai')

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

// Hardcoded fallback chain of free OpenRouter models, ordered by preference.
// The AI service tries each in order; if one 404s (model removed/renamed),
// rate-limits, or returns an unusable response, it falls through to the next.
// Every model below was live-verified working on OpenRouter (June 2026).
const AI_MODELS = [
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'openrouter/owl-alpha',
  'openai/gpt-oss-120b:free',
  'google/gemma-4-31b-it:free',
]

module.exports = { openrouter, AI_MODELS }
