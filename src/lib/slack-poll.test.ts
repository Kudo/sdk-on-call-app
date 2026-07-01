/// <reference types="bun" />
import { describe, expect, it } from 'bun:test';
import {
  POLLING_MESSAGE_PATTERNS,
  buildUnansweredMessagePing,
  getSlackHistoryNextCursor,
  getSlackMessageTimestampMs,
  isMessageAtLeastSecondsOld,
  isMessageFromAllowedSlackUser,
  isMessageTextMatchingPattern,
  isPollingTargetMessage,
  isStaleUnansweredTopLevelPollingTargetMessage,
  isTopLevelUserMessage,
  isUnansweredTopLevelMessage,
  isUnansweredTopLevelMessageFromAllowedSlackUser,
  isUnansweredTopLevelPollingTargetMessage,
  parseSlackChannelIds,
  parseSlackUserIds,
} from './slack-poll';

describe('parseSlackChannelIds()', () => {
  it('should parse comma-separated channel ids', () => {
    expect(parseSlackChannelIds('C123,C456, C789 ')).toEqual(['C123', 'C456', 'C789']);
  });

  it('should ignore empty entries', () => {
    expect(parseSlackChannelIds('C123,, ,C456')).toEqual(['C123', 'C456']);
  });
});

describe('parseSlackUserIds()', () => {
  it('should parse comma-separated user ids', () => {
    expect(parseSlackUserIds('U123,U456, U789 ')).toEqual(['U123', 'U456', 'U789']);
  });

  it('should ignore empty entries', () => {
    expect(parseSlackUserIds('U123,, ,U456')).toEqual(['U123', 'U456']);
  });
});

describe('POLLING_MESSAGE_PATTERNS', () => {
  it('should include the default question marker', () => {
    expect(POLLING_MESSAGE_PATTERNS).toContain('[Question]');
  });
});

describe('isTopLevelUserMessage()', () => {
  it('should return true for plain top-level user messages', () => {
    expect(isTopLevelUserMessage({ type: 'message', ts: '1.000', user: 'U123' })).toBe(true);
  });

  it('should return false for bot messages', () => {
    expect(
      isTopLevelUserMessage({ type: 'message', ts: '1.000', user: 'U123', bot_id: 'B1' })
    ).toBe(false);
  });

  it('should return false for thread replies', () => {
    expect(
      isTopLevelUserMessage({
        type: 'message',
        ts: '2.000',
        thread_ts: '1.000',
        user: 'U123',
      })
    ).toBe(false);
  });

  it('should return false for message subtypes', () => {
    expect(
      isTopLevelUserMessage({
        type: 'message',
        ts: '1.000',
        user: 'U123',
        subtype: 'channel_join',
      })
    ).toBe(false);
  });
});

describe('isUnansweredTopLevelMessage()', () => {
  it('should return true when a top-level user message has no replies', () => {
    expect(isUnansweredTopLevelMessage({ type: 'message', ts: '1.000', user: 'U123' })).toBe(true);
  });

  it('should return false when a top-level user message has replies', () => {
    expect(
      isUnansweredTopLevelMessage({
        type: 'message',
        ts: '1.000',
        user: 'U123',
        reply_count: 1,
      })
    ).toBe(false);
  });

  it('should return false when a top-level user message has emoji reactions', () => {
    expect(
      isUnansweredTopLevelMessage({
        type: 'message',
        ts: '1.000',
        user: 'U123',
        reactions: [{ name: 'eyes', users: ['U456'], count: 1 }],
      })
    ).toBe(false);
  });
});

describe('getSlackMessageTimestampMs()', () => {
  it('should parse slack message timestamps as milliseconds', () => {
    expect(getSlackMessageTimestampMs({ type: 'message', ts: '1719778123.456789' })).toBe(
      1719778123456.789
    );
  });

  it('should return null for invalid timestamps', () => {
    expect(getSlackMessageTimestampMs({ type: 'message', ts: 'invalid' })).toBeNull();
  });
});

describe('isMessageAtLeastSecondsOld()', () => {
  const nowMs = Date.UTC(2026, 5, 30, 12, 0);

  it('should return true when the message is at least the minimum age', () => {
    expect(
      isMessageAtLeastSecondsOld(
        { type: 'message', ts: String((nowMs - 24 * 60 * 60 * 1000) / 1000), user: 'U123' },
        { nowMs, minimumAgeSeconds: 24 * 60 * 60 }
      )
    ).toBe(true);
  });

  it('should return false when the message is newer than the minimum age', () => {
    expect(
      isMessageAtLeastSecondsOld(
        { type: 'message', ts: String((nowMs - 23 * 60 * 60 * 1000) / 1000), user: 'U123' },
        { nowMs, minimumAgeSeconds: 24 * 60 * 60 }
      )
    ).toBe(false);
  });
});

describe('isMessageFromAllowedSlackUser()', () => {
  it('should return true when the message author is allowed', () => {
    expect(
      isMessageFromAllowedSlackUser(
        { type: 'message', ts: '1.000', user: 'U123' },
        new Set(['U123', 'U456'])
      )
    ).toBe(true);
  });

  it('should return false when the message author is not allowed', () => {
    expect(
      isMessageFromAllowedSlackUser(
        { type: 'message', ts: '1.000', user: 'U789' },
        new Set(['U123', 'U456'])
      )
    ).toBe(false);
  });
});

describe('isMessageTextMatchingPattern()', () => {
  it('should return true when message text contains a configured pattern', () => {
    expect(
      isMessageTextMatchingPattern(
        { type: 'message', ts: '1.000', user: 'U123', text: '[Question] How does this work?' },
        ['[Question]']
      )
    ).toBe(true);
  });

  it('should match patterns case-insensitively', () => {
    expect(
      isMessageTextMatchingPattern(
        { type: 'message', ts: '1.000', user: 'U123', text: '[question] How does this work?' },
        ['[Question]']
      )
    ).toBe(true);
  });

  it('should match any configured pattern', () => {
    expect(
      isMessageTextMatchingPattern(
        { type: 'message', ts: '1.000', user: 'U123', text: '[Help] How does this work?' },
        ['[Question]', '[Help]']
      )
    ).toBe(true);
  });

  it('should return false when message text does not contain a configured pattern', () => {
    expect(
      isMessageTextMatchingPattern(
        { type: 'message', ts: '1.000', user: 'U123', text: 'How does this work?' },
        ['[Question]']
      )
    ).toBe(false);
  });
});

describe('isPollingTargetMessage()', () => {
  it('should return true when the message author is allowed', () => {
    expect(
      isPollingTargetMessage(
        { type: 'message', ts: '1.000', user: 'U123', text: 'How does this work?' },
        { slackUserIds: new Set(['U123']), textPatterns: ['[Question]'] }
      )
    ).toBe(true);
  });

  it('should return true when the message text matches a configured pattern', () => {
    expect(
      isPollingTargetMessage(
        { type: 'message', ts: '1.000', user: 'U456', text: '[Question] How does this work?' },
        { slackUserIds: new Set(['U123']), textPatterns: ['[Question]'] }
      )
    ).toBe(true);
  });

  it('should return false when the author and text do not match target rules', () => {
    expect(
      isPollingTargetMessage(
        { type: 'message', ts: '1.000', user: 'U456', text: 'How does this work?' },
        { slackUserIds: new Set(['U123']), textPatterns: ['[Question]'] }
      )
    ).toBe(false);
  });
});

describe('isUnansweredTopLevelMessageFromAllowedSlackUser()', () => {
  it('should return true for unanswered top-level messages from allowed users', () => {
    expect(
      isUnansweredTopLevelMessageFromAllowedSlackUser(
        { type: 'message', ts: '1.000', user: 'U123' },
        new Set(['U123'])
      )
    ).toBe(true);
  });

  it('should return false for unanswered top-level messages from other users', () => {
    expect(
      isUnansweredTopLevelMessageFromAllowedSlackUser(
        { type: 'message', ts: '1.000', user: 'U456' },
        new Set(['U123'])
      )
    ).toBe(false);
  });
});

describe('isUnansweredTopLevelPollingTargetMessage()', () => {
  it('should return true for unanswered top-level messages from allowed users', () => {
    expect(
      isUnansweredTopLevelPollingTargetMessage(
        { type: 'message', ts: '1.000', user: 'U123' },
        { slackUserIds: new Set(['U123']), textPatterns: ['[Question]'] }
      )
    ).toBe(true);
  });

  it('should return true for unanswered top-level messages with matching text patterns', () => {
    expect(
      isUnansweredTopLevelPollingTargetMessage(
        { type: 'message', ts: '1.000', user: 'U456', text: '[Question] How does this work?' },
        { slackUserIds: new Set(['U123']), textPatterns: ['[Question]'] }
      )
    ).toBe(true);
  });

  it('should return false when matching target messages have replies', () => {
    expect(
      isUnansweredTopLevelPollingTargetMessage(
        {
          type: 'message',
          ts: '1.000',
          user: 'U456',
          text: '[Question] How does this work?',
          reply_count: 1,
        },
        { slackUserIds: new Set(['U123']), textPatterns: ['[Question]'] }
      )
    ).toBe(false);
  });
});

describe('isStaleUnansweredTopLevelPollingTargetMessage()', () => {
  const nowMs = Date.UTC(2026, 5, 30, 12, 0);
  const staleTs = String((nowMs - 25 * 60 * 60 * 1000) / 1000);
  const freshTs = String((nowMs - 23 * 60 * 60 * 1000) / 1000);

  it('should return true for unanswered target messages older than the minimum age', () => {
    expect(
      isStaleUnansweredTopLevelPollingTargetMessage(
        { type: 'message', ts: staleTs, user: 'U123' },
        {
          slackUserIds: new Set(['U123']),
          textPatterns: ['[Question]'],
          nowMs,
          minimumAgeSeconds: 24 * 60 * 60,
        }
      )
    ).toBe(true);
  });

  it('should return false for unanswered target messages newer than the minimum age', () => {
    expect(
      isStaleUnansweredTopLevelPollingTargetMessage(
        { type: 'message', ts: freshTs, user: 'U123' },
        {
          slackUserIds: new Set(['U123']),
          textPatterns: ['[Question]'],
          nowMs,
          minimumAgeSeconds: 24 * 60 * 60,
        }
      )
    ).toBe(false);
  });
});

describe('getSlackHistoryNextCursor()', () => {
  it('should return the next cursor when present', () => {
    expect(
      getSlackHistoryNextCursor({ response_metadata: { next_cursor: ' cursor-value ' } })
    ).toBe('cursor-value');
  });

  it('should return undefined when the next cursor is empty', () => {
    expect(getSlackHistoryNextCursor({ response_metadata: { next_cursor: '' } })).toBeUndefined();
  });
});

describe('buildUnansweredMessagePing()', () => {
  it('should mention the on-call member when a slack user id is set', () => {
    expect(buildUnansweredMessagePing({ name: 'Alice', slackUserId: 'U123' })).toBe(
      '<@U123> could you take a look at this unanswered message?'
    );
  });

  it('should fall back to the member name when no slack user id is set', () => {
    expect(buildUnansweredMessagePing({ name: 'Alice' })).toBe(
      'Alice could you take a look at this unanswered message?'
    );
  });
});
