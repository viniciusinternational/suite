import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  streamText,
  type LanguageModelV1,
} from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const provider =
      process.env.ASSISTANT_MODEL_PROVIDER?.toLowerCase() ?? 'openai';
    const modelId = process.env.ASSISTANT_MODEL;
    const { model, errorResponse } = resolveModel(provider, modelId);

    if (errorResponse) {
      return errorResponse;
    }

    const result = streamText({
      model,
      messages: convertToModelMessages(messages ?? []),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Assistant route error', error);

    return new Response(
      JSON.stringify({ error: 'Failed to process assistant request.' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

function resolveModel(
  provider: string,
  modelId?: string
): {
  model?: LanguageModelV1;
  errorResponse?: Response;
} {
  if (provider === 'gemini') {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return {
        errorResponse: createConfigErrorResponse(
          'GOOGLE_GENERATIVE_AI_API_KEY is not configured.'
        ),
      };
    }

    return {
      model: google(modelId ?? 'gemini-2.0-flash'),
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      errorResponse: createConfigErrorResponse(
        'OPENAI_API_KEY is not configured.'
      ),
    };
  }

  return {
    model: openai(modelId ?? 'gpt-4o-mini'),
  };
}

function createConfigErrorResponse(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}



