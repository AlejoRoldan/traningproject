import { getDb } from './db';
import { adminFeedback, feedbackReplies, feedbackAttachments, users } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface SendFeedbackInput {
  toAgentId: number;
  title: string;
  message: string;
  feedbackType: 'note' | 'praise' | 'improvement' | 'urgent' | 'follow_up';
  priority: 'low' | 'medium' | 'high';
}

/**
 * Enviar feedback a un agente
 */
export async function sendFeedback(
  fromAdminId: number,
  input: SendFeedbackInput
): Promise<{ id: number; createdAt: Date } | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db.insert(adminFeedback).values({
      fromAdminId,
      toAgentId: input.toAgentId,
      title: input.title,
      message: input.message,
      feedbackType: input.feedbackType,
      priority: input.priority,
    });

    return {
      id: (result as any).insertId,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error sending feedback:', error);
    return null;
  }
}

/**
 * Obtener feedback recibido por un agente
 */
export async function getAgentFeedback(agentId: number, limitNum = 50, offsetNum = 0) {
  try {
    const db = await getDb();
    if (!db) return [];

    const feedback = await db
      .select({
        id: adminFeedback.id,
        fromAdminId: adminFeedback.fromAdminId,
        fromAdminName: users.name,
        fromAdminEmail: users.email,
        title: adminFeedback.title,
        message: adminFeedback.message,
        feedbackType: adminFeedback.feedbackType,
        priority: adminFeedback.priority,
        isRead: adminFeedback.isRead,
        readAt: adminFeedback.readAt,
        createdAt: adminFeedback.createdAt,
        updatedAt: adminFeedback.updatedAt,
      })
      .from(adminFeedback)
      .leftJoin(users, eq(adminFeedback.fromAdminId, users.id))
      .where(
        and(
          eq(adminFeedback.toAgentId, agentId),
          eq(adminFeedback.isArchived, 0)
        )
      )
      .orderBy(adminFeedback.isRead, desc(adminFeedback.priority), desc(adminFeedback.createdAt))
      .limit(limitNum)
      .offset(offsetNum);

    return feedback || [];
  } catch (error) {
    console.error('Error fetching agent feedback:', error);
    return [];
  }
}

/**
 * Obtener feedback enviado por un admin
 */
export async function getAdminSentFeedback(adminId: number, limitNum = 50, offsetNum = 0) {
  try {
    const db = await getDb();
    if (!db) return [];

    const feedback = await db
      .select({
        id: adminFeedback.id,
        toAgentId: adminFeedback.toAgentId,
        agentName: users.name,
        agentEmail: users.email,
        title: adminFeedback.title,
        message: adminFeedback.message,
        feedbackType: adminFeedback.feedbackType,
        priority: adminFeedback.priority,
        isRead: adminFeedback.isRead,
        readAt: adminFeedback.readAt,
        createdAt: adminFeedback.createdAt,
      })
      .from(adminFeedback)
      .leftJoin(users, eq(adminFeedback.toAgentId, users.id))
      .where(
        and(
          eq(adminFeedback.fromAdminId, adminId),
          eq(adminFeedback.isArchived, 0)
        )
      )
      .orderBy(desc(adminFeedback.createdAt))
      .limit(limitNum)
      .offset(offsetNum);

    return feedback || [];
  } catch (error) {
    console.error('Error fetching admin sent feedback:', error);
    return [];
  }
}

/**
 * Marcar feedback como leído
 */
export async function markFeedbackAsRead(feedbackId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    await db
      .update(adminFeedback)
      .set({
        isRead: 1,
        readAt: new Date(),
      })
      .where(eq(adminFeedback.id, feedbackId));

    return true;
  } catch (error) {
    console.error('Error marking feedback as read:', error);
    return false;
  }
}

/**
 * Obtener contador de mensajes no leídos
 */
export async function getUnreadFeedbackCount(agentId: number): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;

    const result = await db
      .select({ count: adminFeedback.id })
      .from(adminFeedback)
      .where(
        and(
          eq(adminFeedback.toAgentId, agentId),
          eq(adminFeedback.isRead, 0),
          eq(adminFeedback.isArchived, 0)
        )
      );

    return result.length;
  } catch (error) {
    console.error('Error getting unread feedback count:', error);
    return 0;
  }
}

/**
 * Agregar respuesta a feedback
 */
export async function addFeedbackReply(
  feedbackId: number,
  fromUserId: number,
  message: string
): Promise<{ id: number; createdAt: Date } | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db.insert(feedbackReplies).values({
      feedbackId,
      fromUserId,
      message,
    });

    return {
      id: (result as any).insertId,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error adding feedback reply:', error);
    return null;
  }
}

/**
 * Obtener respuestas de un feedback
 */
export async function getFeedbackReplies(feedbackId: number) {
  try {
    const db = await getDb();
    if (!db) return [];

    const replies = await db
      .select({
        id: feedbackReplies.id,
        feedbackId: feedbackReplies.feedbackId,
        fromUserId: feedbackReplies.fromUserId,
        fromUserName: users.name,
        fromUserEmail: users.email,
        message: feedbackReplies.message,
        createdAt: feedbackReplies.createdAt,
        updatedAt: feedbackReplies.updatedAt,
      })
      .from(feedbackReplies)
      .leftJoin(users, eq(feedbackReplies.fromUserId, users.id))
      .where(eq(feedbackReplies.feedbackId, feedbackId))
      .orderBy(feedbackReplies.createdAt);

    return replies || [];
  } catch (error) {
    console.error('Error fetching feedback replies:', error);
    return [];
  }
}

/**
 * Archivar feedback
 */
export async function archiveFeedback(feedbackId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    await db
      .update(adminFeedback)
      .set({ isArchived: 1 })
      .where(eq(adminFeedback.id, feedbackId));

    return true;
  } catch (error) {
    console.error('Error archiving feedback:', error);
    return false;
  }
}

/**
 * Obtener detalles completos de un feedback
 */
export async function getFeedbackDetail(feedbackId: number) {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select({
        id: adminFeedback.id,
        fromAdminId: adminFeedback.fromAdminId,
        fromAdminName: users.name,
        fromAdminEmail: users.email,
        toAgentId: adminFeedback.toAgentId,
        title: adminFeedback.title,
        message: adminFeedback.message,
        feedbackType: adminFeedback.feedbackType,
        priority: adminFeedback.priority,
        isRead: adminFeedback.isRead,
        readAt: adminFeedback.readAt,
        createdAt: adminFeedback.createdAt,
        updatedAt: adminFeedback.updatedAt,
      })
      .from(adminFeedback)
      .leftJoin(users, eq(adminFeedback.fromAdminId, users.id))
      .where(eq(adminFeedback.id, feedbackId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error fetching feedback detail:', error);
    return null;
  }
}
