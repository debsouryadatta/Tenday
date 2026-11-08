import { describe, expect, it } from 'vitest';
import { checkedAssistantText } from './assistantText';

describe('report reply boundary', () => {
  it('rejects overconfident claims seen in the live synthetic report check', () => {
    for (const text of [
      'A glucose of 92 indicates healthy blood sugar regulation.',
      'Negative indicates healthy kidney filtration.',
      'Less than 5 means no significant systemic inflammation.',
      'This suggests adequate red blood cell health.',
    ]) {
      expect(() => checkedAssistantText(text, true)).toThrow();
    }
  });
  it('allows source-bound comparison and explicit limits', () => {
    expect(
      checkedAssistantText(
        'Glucose 92 mg/dL is within the supplied lab interval of 70–100. The report gives no comparison interval for <5 mg/L; ask your clinician what it means in your context.',
        true,
      ),
    ).toContain('supplied lab interval');
  });
});
