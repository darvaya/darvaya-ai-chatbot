import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { z } from 'zod';
import { OpenAI } from 'openai';

const openai = new OpenAI();

// Schema for AI analysis request
const aiAnalysisSchema = z.object({
  type: z.enum(['team_optimization', 'user_insights', 'activity_analysis']),
  data: z.record(z.unknown()),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:organization').toResponse();
    }

    if (!session.user.organizationId) {
      return new ChatSDKError(
        'not_found:organization',
        'User does not belong to an organization',
      ).toResponse();
    }

    // Only admins and managers can use AI features
    if (!['admin', 'manager'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only admins and managers can use AI features',
      ).toResponse();
    }

    const json = await request.json();
    const { type, data } = aiAnalysisSchema.parse(json);

    let result;
    switch (type) {
      case 'team_optimization':
        result = await analyzeTeamOptimization(data);
        break;
      case 'user_insights':
        result = await generateUserInsights(data);
        break;
      case 'activity_analysis':
        result = await analyzeOrganizationActivity(data);
        break;
    }

    return Response.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:organization',
        'Invalid request data',
      ).toResponse();
    }

    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}

async function analyzeTeamOptimization(data: Record<string, unknown>) {
  const prompt = `Analyze the following team data and provide optimization recommendations:
    ${JSON.stringify(data, null, 2)}
    
    Please provide recommendations for:
    1. Team composition and size
    2. Role distribution
    3. Collaboration opportunities
    4. Potential skill gaps`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert organizational consultant specializing in team optimization.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return {
    type: 'team_optimization',
    recommendations: completion.choices[0].message.content,
  };
}

async function generateUserInsights(data: Record<string, unknown>) {
  const prompt = `Analyze the following user activity data and provide insights:
    ${JSON.stringify(data, null, 2)}
    
    Please provide insights on:
    1. User engagement patterns
    2. Productivity trends
    3. Collaboration metrics
    4. Areas for improvement`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert in analyzing user behavior and providing actionable insights.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return {
    type: 'user_insights',
    insights: completion.choices[0].message.content,
  };
}

async function analyzeOrganizationActivity(data: Record<string, unknown>) {
  const prompt = `Analyze the following organization activity data and provide insights:
    ${JSON.stringify(data, null, 2)}
    
    Please provide analysis on:
    1. Overall organization health
    2. Team performance metrics
    3. Resource utilization
    4. Growth opportunities`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert in organizational analysis and strategic planning.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return {
    type: 'activity_analysis',
    analysis: completion.choices[0].message.content,
  };
}
