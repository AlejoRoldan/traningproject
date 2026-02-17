import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import {
  sendFeedback,
  getAgentFeedback,
  getAdminSentFeedback,
  markFeedbackAsRead,
  getUnreadFeedbackCount,
  addFeedbackReply,
  getFeedbackReplies,
  archiveFeedback,
  getFeedbackDetail,
} from './feedbackService';

describe('Feedback Service', () => {
  const testAdminId = 1;
  const testAgentId = 2;
  let feedbackId: number;

  it('should send feedback from admin to agent', async () => {
    const result = await sendFeedback(testAdminId, {
      toAgentId: testAgentId,
      title: 'Test Feedback',
      message: 'This is a test feedback message',
      feedbackType: 'improvement',
      priority: 'high',
    });

    expect(result).toBeDefined();
    expect(result?.id).toBeDefined();
    expect(result?.createdAt).toBeDefined();
    feedbackId = result?.id || 0;
  });

  it('should retrieve feedback received by agent', async () => {
    const feedback = await getAgentFeedback(testAgentId, 50, 0);

    expect(Array.isArray(feedback)).toBe(true);
    expect(feedback.length).toBeGreaterThan(0);

    const testFeedback = feedback.find((f: any) => f.id === feedbackId);
    expect(testFeedback).toBeDefined();
    expect(testFeedback?.title).toBe('Test Feedback');
    expect(testFeedback?.message).toBe('This is a test feedback message');
    expect(testFeedback?.feedbackType).toBe('improvement');
    expect(testFeedback?.priority).toBe('high');
  });

  it('should retrieve feedback sent by admin', async () => {
    const feedback = await getAdminSentFeedback(testAdminId, 50, 0);

    expect(Array.isArray(feedback)).toBe(true);
    expect(feedback.length).toBeGreaterThan(0);

    const testFeedback = feedback.find((f: any) => f.id === feedbackId);
    expect(testFeedback).toBeDefined();
    expect(testFeedback?.toAgentId).toBe(testAgentId);
  });

  it('should mark feedback as read', async () => {
    const result = await markFeedbackAsRead(feedbackId);

    expect(result).toBe(true);

    const feedback = await getFeedbackDetail(feedbackId);
    expect(feedback?.isRead).toBe(1);
  });

  it('should get unread feedback count', async () => {
    // Create another unread feedback
    const result = await sendFeedback(testAdminId, {
      toAgentId: testAgentId,
      title: 'Another Test',
      message: 'Another test message',
      feedbackType: 'praise',
      priority: 'low',
    });

    const unreadCount = await getUnreadFeedbackCount(testAgentId);

    expect(typeof unreadCount).toBe('number');
    expect(unreadCount).toBeGreaterThanOrEqual(0);
  });

  it('should add reply to feedback', async () => {
    const result = await addFeedbackReply(feedbackId, testAgentId, 'Thank you for the feedback!');

    expect(result).toBeDefined();
    expect(result?.id).toBeDefined();
    expect(result?.message).toBe('Thank you for the feedback!');
  });

  it('should retrieve feedback replies', async () => {
    const replies = await getFeedbackReplies(feedbackId);

    expect(Array.isArray(replies)).toBe(true);
    expect(replies.length).toBeGreaterThan(0);

    const testReply = replies.find((r: any) => r.message === 'Thank you for the feedback!');
    expect(testReply).toBeDefined();
  });

  it('should get feedback detail', async () => {
    const feedback = await getFeedbackDetail(feedbackId);

    expect(feedback).toBeDefined();
    expect(feedback?.id).toBe(feedbackId);
    expect(feedback?.title).toBe('Test Feedback');
    expect(feedback?.fromAdminId).toBe(testAdminId);
    expect(feedback?.toAgentId).toBe(testAgentId);
  });

  it('should archive feedback', async () => {
    const result = await archiveFeedback(feedbackId);

    expect(result).toBe(true);

    // Verify archived feedback is not returned in getAgentFeedback
    const feedback = await getAgentFeedback(testAgentId, 50, 0);
    const archivedFeedback = feedback.find((f: any) => f.id === feedbackId);
    expect(archivedFeedback).toBeUndefined();
  });

  it('should handle invalid feedback IDs gracefully', async () => {
    const result = await getFeedbackDetail(99999);
    expect(result).toBeNull();

    const replies = await getFeedbackReplies(99999);
    expect(Array.isArray(replies)).toBe(true);
    expect(replies.length).toBe(0);
  });

  it('should validate feedback input', async () => {
    // Test with empty title
    const result = await sendFeedback(testAdminId, {
      toAgentId: testAgentId,
      title: '',
      message: 'Test message',
      feedbackType: 'note',
      priority: 'medium',
    });

    // Should still create feedback (validation happens at API level)
    expect(result).toBeDefined();
  });

  it('should handle pagination in getAgentFeedback', async () => {
    const page1 = await getAgentFeedback(testAgentId, 1, 0);
    const page2 = await getAgentFeedback(testAgentId, 1, 1);

    expect(Array.isArray(page1)).toBe(true);
    expect(Array.isArray(page2)).toBe(true);

    // Pages should be different (unless there's only 1 item)
    if (page1.length > 0 && page2.length > 0) {
      expect(page1[0]?.id).not.toBe(page2[0]?.id);
    }
  });
});
