export const getMemberProfilePath = (identifier?: string | null, fallbackUserId?: string | null) => {
  const value = identifier || fallbackUserId;
  return value ? `/members/${value}` : '/members';
};
