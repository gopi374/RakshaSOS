import Constants from 'expo-constants';

export type GroqChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';

function getGroqConfig() {
  const extra = (Constants.expoConfig?.extra ?? Constants.manifest2?.extra ?? {}) as Record<string, unknown>;

  return {
    apiKey: typeof extra.groqApiKey === 'string' ? extra.groqApiKey : '',
    model: typeof extra.groqModel === 'string' ? extra.groqModel : 'llama-3.3-70b-versatile',
  };
}

export async function getRakshaSafetyReply(messages: GroqChatMessage[]) {
  const { apiKey, model } = getGroqConfig();

  if (!apiKey) {
    throw new Error('Groq API key is missing. Add EXPO_PUBLIC_GROQ_API_KEY to your local environment.');
  }

  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 450,
      messages: [
        {
          role: 'system',
          content:
            'You are RakshaSOS Safety AI. Give concise, practical personal-safety guidance for India. If the user may be in immediate danger, tell them to trigger SOS in the app or call 112 first. Do not claim you contacted police, hospitals, or guardians unless the app explicitly did so. Avoid legal, medical, or emergency certainty beyond basic safety guidance.',
        },
        ...messages,
      ],
    }),
  });

  const data = (await response.json()) as GroqChatCompletionResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || 'Groq could not answer right now.');
  }

  const reply = data.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error('Groq returned an empty response.');
  }

  return reply;
}
