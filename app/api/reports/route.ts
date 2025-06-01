import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { ReportingService } from '@/lib/reporting/service';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const reportingService = new ReportingService();

// Schema for metrics request
const metricsRequestSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Schema for export request
const exportRequestSchema = z.object({
  format: z.enum(['csv', 'json']),
  dateRange: z
    .object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    })
    .optional(),
  includeMetadata: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:api').toResponse();
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const params = metricsRequestSchema.parse({
      startDate,
      endDate,
    });

    const metrics = await reportingService.getChatMetrics(
      params.startDate ? new Date(params.startDate) : undefined,
      params.endDate ? new Date(params.endDate) : undefined,
    );

    return NextResponse.json(metrics);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:api',
        'Invalid date format',
      ).toResponse();
    }

    console.error('Error generating report:', error);
    return new ChatSDKError('internal_server_error:api').toResponse();
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:api').toResponse();
    }

    const json = await request.json();
    const params = exportRequestSchema.parse(json);

    const exportData = await reportingService.exportChats({
      format: params.format,
      dateRange: params.dateRange
        ? {
            start: new Date(params.dateRange.start),
            end: new Date(params.dateRange.end),
          }
        : undefined,
      includeMetadata: params.includeMetadata,
    });

    // Set appropriate headers based on format
    const headers = new Headers();
    if (params.format === 'csv') {
      headers.set('Content-Type', 'text/csv');
      headers.set(
        'Content-Disposition',
        'attachment; filename=chat_export.csv',
      );
    } else {
      headers.set('Content-Type', 'application/json');
      headers.set(
        'Content-Disposition',
        'attachment; filename=chat_export.json',
      );
    }

    return new Response(exportData, { headers });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:api',
        'Invalid export parameters',
      ).toResponse();
    }

    console.error('Error exporting data:', error);
    return new ChatSDKError('internal_server_error:api').toResponse();
  }
}
