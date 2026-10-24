// The search_threshold_guidance tool offered to the LLM during threshold research.
// It searches Google (via Serper), limited to the configured latency-guidance domains.
import { createSearchTool } from './searchReferencesTool.js';

export const THRESHOLD_SEARCH_TOOL = createSearchTool({
  name: 'search_threshold_guidance',
  description:
    'Searches Google, limited to reliable publishers of response-time guidance (UX research, web performance, ' +
    'SRE, and cloud-provider documentation), for published API response-time thresholds. Returns numbered results with an excerpt.',
  queryDescription: 'Short, generic query about recommended response-time limits',
});
