// One chat with one model. ask() runs the chat until the model replies with text (its
// JSON answer); addFeedback() adds a correction request, after which ask() continues the
// same chat, so the model keeps everything it has read and searched so far.
// With research, the model may call search_references up to `maxSearches` times in total.
// Once the budget is used, tools are switched off (tool_choice "none") so the next reply
// must be the answer; a model that keeps calling tools anyway is stopped by the round limit.
import { GuardrailError } from '../guardrails/index.js';
import { SYMPTOM_SEARCH_TOOL } from '../tools/searchReferencesTool.js';

const LIMIT_REACHED_RESULT = JSON.stringify({ error: 'search_limit_reached' });

// The search tool of this conversation: research.tool when given, else the symptom search.
function searchToolOf(research) {
  return research.tool ?? SYMPTOM_SEARCH_TOOL;
}

function toolOptions(research, searchesLeft) {
  if (!research) return {};
  return { tools: [searchToolOf(research).definition], toolChoice: searchesLeft > 0 ? 'auto' : 'none' };
}

// Answers every tool call of one reply, in order, within the remaining search budget.
// Returns the tool messages and the budget left afterwards.
async function answerToolCalls(toolCalls, research, searchesLeft) {
  const toolMessages = [];
  let remaining = searchesLeft;
  for (const call of toolCalls) {
    const content = remaining > 0 ? await searchToolOf(research).run(call, research) : LIMIT_REACHED_RESULT;
    remaining = Math.max(0, remaining - 1);
    toolMessages.push({ role: 'tool', tool_call_id: call.id, content });
  }
  return { toolMessages, searchesLeft: remaining };
}

// `messages`: the opening system and user messages.
// `research`: { referenceSearch, sources, context, tool? }, or null when research is off.
export function createConversation({ llm, model, messages, research }) {
  const history = [...messages];
  let searchesLeft = research ? research.referenceSearch.maxSearches : 0;

  return {
    async ask() {
      // One round per remaining search, plus the round for the answer.
      const maxRounds = searchesLeft + 1;
      for (let round = 0; round < maxRounds; round += 1) {
        const reply = await llm.chat({ model, messages: history, ...toolOptions(research, searchesLeft) });
        if (reply.toolCalls.length === 0) {
          history.push({ role: 'assistant', content: reply.content });
          return reply.content;
        }

        history.push({ role: 'assistant', content: reply.content, tool_calls: reply.toolCalls });
        const answered = await answerToolCalls(reply.toolCalls, research, searchesLeft);
        history.push(...answered.toolMessages);
        searchesLeft = answered.searchesLeft;
      }
      throw new GuardrailError('too_many_tool_rounds');
    },

    addFeedback(text) {
      history.push({ role: 'user', content: text });
    },
  };
}
