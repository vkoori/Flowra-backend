import { Conversation } from './conversation.entity';

describe('Conversation', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');

  function createConversation(): Conversation {
    return Conversation.create(
      {
        tenureId: 'tenure-1',
        platform: 'instagram',
        participantHash: 'participant-hash-1',
      },
      now,
    );
  }

  it('has no window expiry by default', () => {
    const conversation = createConversation();

    expect(conversation.windowExpiresAt).toBeNull();
  });

  it('refreshes the messaging window to a new expiry', () => {
    const conversation = createConversation();
    const newExpiry = new Date('2026-01-02T00:00:00.000Z');

    conversation.refreshWindow(newExpiry);

    expect(conversation.windowExpiresAt).toBe(newExpiry);
  });

  it('allows refreshing the window multiple times', () => {
    const conversation = createConversation();
    const firstExpiry = new Date('2026-01-02T00:00:00.000Z');
    const secondExpiry = new Date('2026-01-03T00:00:00.000Z');

    conversation.refreshWindow(firstExpiry);
    conversation.refreshWindow(secondExpiry);

    expect(conversation.windowExpiresAt).toBe(secondExpiry);
  });
});
