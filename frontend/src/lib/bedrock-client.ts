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
