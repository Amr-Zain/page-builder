/**
 * Converts an ISO timestamp to a human-readable relative time string.
 * Returns empty string for invalid input.
 */
export function formatRelativeTime(isoTimestamp: string): string {
  if (!isoTimestamp) return "";

  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) return "";

  const now = Date.now();
  const diffMs = now - date.getTime();

  // Handle future dates or negative diffs
  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
