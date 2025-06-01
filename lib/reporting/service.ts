import { db } from '@/lib/db';
import { chat, message } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';
import Papa from 'papaparse';
import { format } from 'date-fns';

export interface ChatMetrics {
  totalChats: number;
  totalMessages: number;
  averageMessagesPerChat: number;
  modelUsage: Record<string, number>;
  timeDistribution: Record<string, number>;
}

export interface ExportOptions {
  format: 'csv' | 'json';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeMetadata?: boolean;
}

export class ReportingService {
  async getChatMetrics(startDate?: Date, endDate?: Date): Promise<ChatMetrics> {
    const query = db
      .select({
        totalChats: sql<number>`count(distinct ${chat.id})`,
        totalMessages: sql<number>`count(${message.id})`,
        averageMessages: sql<number>`cast(count(${message.id}) as float) / nullif(count(distinct ${chat.id}), 0)`,
      })
      .from(chat)
      .leftJoin(message, sql`${message.chatId} = ${chat.id}`);

    if (startDate && endDate) {
      query.where(sql`${chat.createdAt} between ${startDate} and ${endDate}`);
    }

    const metrics = await query.execute();
    const modelUsage = await this.getModelUsageMetrics(startDate, endDate);
    const timeDistribution = await this.getTimeDistribution(startDate, endDate);

    return {
      totalChats: metrics[0]?.totalChats ?? 0,
      totalMessages: metrics[0]?.totalMessages ?? 0,
      averageMessagesPerChat: Math.round(metrics[0]?.averageMessages ?? 0),
      modelUsage,
      timeDistribution,
    };
  }

  private async getModelUsageMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Record<string, number>> {
    const query = db
      .select({
        model: sql<string>`json_extract_path_text(${message.parts}::jsonb, '0', 'model')`,
        count: sql<number>`count(*)`,
      })
      .from(message)
      .groupBy(
        sql`json_extract_path_text(${message.parts}::jsonb, '0', 'model')`,
      );

    if (startDate && endDate) {
      query.where(
        sql`${message.createdAt} between ${startDate} and ${endDate}`,
      );
    }

    const results = await query.execute();
    return Object.fromEntries(
      results.map((r) => [r.model ?? 'unknown', r.count]),
    );
  }

  private async getTimeDistribution(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Record<string, number>> {
    const query = db
      .select({
        hour: sql<number>`extract(hour from ${chat.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(chat)
      .groupBy(sql`extract(hour from ${chat.createdAt})`);

    if (startDate && endDate) {
      query.where(sql`${chat.createdAt} between ${startDate} and ${endDate}`);
    }

    const results = await query.execute();
    return Object.fromEntries(results.map((r) => [`${r.hour}:00`, r.count]));
  }

  async exportChats(options: ExportOptions): Promise<string> {
    const query = db
      .select({
        chatId: chat.id,
        title: chat.title,
        userId: chat.userId,
        visibility: chat.visibility,
        createdAt: chat.createdAt,
        messageId: message.id,
        role: message.role,
        parts: message.parts,
        attachments: message.attachments,
        threadId: message.threadId,
        replyCount: message.replyCount,
      })
      .from(chat)
      .leftJoin(message, sql`${message.chatId} = ${chat.id}`)
      .orderBy(chat.createdAt, message.createdAt);

    if (options.dateRange) {
      query.where(
        sql`${chat.createdAt} between ${options.dateRange.start} and ${options.dateRange.end}`,
      );
    }

    const results = await query.execute();

    // Transform data for export
    const exportData = results.map((row) => ({
      chatId: row.chatId,
      title: row.title,
      userId: row.userId,
      visibility: row.visibility,
      createdAt: row.createdAt
        ? format(row.createdAt, 'yyyy-MM-dd HH:mm:ss')
        : '',
      messageId: row.messageId,
      role: row.role,
      content: row.parts ? JSON.stringify(row.parts) : '',
      ...(options.includeMetadata
        ? {
            attachments: JSON.stringify(row.attachments),
            threadId: row.threadId,
            replyCount: row.replyCount,
          }
        : {}),
    }));

    if (options.format === 'csv') {
      return Papa.unparse(exportData);
    }

    return JSON.stringify(exportData, null, 2);
  }
}
