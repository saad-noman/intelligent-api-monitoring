// Initials for the account circle, e.g. "Jane" + "Doe" -> "JD".
// Accounts created before names existed fall back to the first letter of the email.
function firstLetter(text) {
  return (text ?? '').trim().charAt(0).toUpperCase();
}

export function getInitials(account) {
  const initials = firstLetter(account?.firstName) + firstLetter(account?.lastName);
  return initials || firstLetter(account?.email);
}

export function getFullName(account) {
  return [account?.firstName, account?.lastName].filter(Boolean).join(' ').trim();
}
