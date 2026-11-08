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
