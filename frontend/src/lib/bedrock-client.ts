import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

export function createBedrockClient(): BedrockRuntimeClient {
  const region = process.env.AWS_REGION || 'us-east-1';
  if (process.env.AWS_BEARER_TOKEN_BEDROCK) {
    return new BedrockRuntimeClient({
      region,
      token: { token: process.env.AWS_BEARER_TOKEN_BEDROCK },
    });
  }
  return new BedrockRuntimeClient({ region });
}

export const MODEL_ID = 'us.anthropic.claude-3-5-haiku-20241022-v1:0';

// Sonnet 4.6 for higher-quality structured generation (question papers, etc.)
export const SONNET_MODEL_ID = 'us.anthropic.claude-sonnet-4-6';
