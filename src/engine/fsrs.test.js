import { describe, it, expect } from 'vitest';
import { freshState, applyRating, RATING, buildQueue, dueAt } from './fsrs.js';

describe('FSRS Engine', () => {
  describe('applyRating', () => {
    it('handles GOOD rating properly', () => {
      const state = freshState();
      const updated = applyRating(state, RATING.GOOD);
      expect(updated.stability).toBe(2.5);
      expect(updated.difficulty).toBe(4.7);
      expect(updated.reviewCount).toBe(1);
      expect(updated.correctCount).toBe(1);
      expect(updated.state).toBe('review');
    });

    it('handles HARD rating properly', () => {
      const state = freshState();
      const updated = applyRating(state, RATING.HARD);
      expect(updated.stability).toBe(1.3);
      expect(updated.difficulty).toBe(5.0);
      expect(updated.reviewCount).toBe(1);
      expect(updated.correctCount).toBe(1);
      expect(updated.state).toBe('review');
    });

    it('handles AGAIN rating properly according to spec', () => {
      const state = freshState();
      const updated = applyRating(state, RATING.AGAIN);
      // Math.max(0.5, 1.0 * 0.3) -> 0.5
      expect(updated.stability).toBe(0.5);
      expect(updated.difficulty).toBe(5.5);
      expect(updated.reviewCount).toBe(1);
      expect(updated.correctCount).toBe(0);
      expect(updated.state).toBe('learning');
    });

    it('prevents NaN corruption from legacy undefined fields', () => {
      const legacyState = {
        stability: 1.0,
        difficulty: 5.0,
        lastReviewed: null,
        state: 'new',
        // missing reviewCount and correctCount
      };
      const updated = applyRating(legacyState, RATING.GOOD);
      expect(Number.isNaN(updated.reviewCount)).toBe(false);
      expect(Number.isNaN(updated.correctCount)).toBe(false);
      expect(updated.reviewCount).toBe(1);
      expect(updated.correctCount).toBe(1);
    });
  });

  describe('buildQueue', () => {
    it('prioritizes learning > new > review', () => {
      const now = 1000000;
      const questions = [
        { id: 'q_review' },
        { id: 'q_new' },
        { id: 'q_learning' }
      ];
      
      const states = {
        q_review: { state: 'review', lastReviewed: now - 86400000 * 2, stability: 1.0 }, // due
        q_new: { state: 'new', lastReviewed: null, stability: 1.0 }, // new
        q_learning: { state: 'learning', lastReviewed: now - 86400000, stability: 0.5 } // due
      };

      const queue = buildQueue(questions, states, now);
      
      expect(queue.length).toBe(3);
      expect(queue[0].id).toBe('q_learning');
      expect(queue[1].id).toBe('q_new');
      expect(queue[2].id).toBe('q_review');
    });
  });
});
