// Fail closed on known overconfident interpretations before saving a reply.
// This is a narrow output check, not a claim of medical validation.
export function checkedAssistantText(text: string, hasReports: boolean) {
  const value = text.trim();
  if (!value || value.length > 10000) throw new Error('Invalid reply');
  if (
    hasReports &&
    /\b(?:healthy (?:blood|kidney)|adequate (?:red blood cell|oxygen)|no significant systemic inflammation|optimal results|rules? out (?:disease|illness)|indicat(?:es|ing) healthy|suggest(?:s|ing) adequate)\b/i.test(
      value,
    )
  ) {
    throw new Error('Unsupported clinical interpretation');
  }
  return value;
}

// Progress arithmetic belongs to the deterministic progress component. The
// short model-written tip must not claim counts or promise goal completion.
export function qualitativeGuidance(text: string, basis: string) {
  const value = `${text} ${basis}`;
  return !/\d|\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|remaining|on track)\b|\b(?:reach|meet|hit|complete|achieve)\w*\b.{0,35}\b(?:goal|target)\b/i.test(
    value,
  );
}
