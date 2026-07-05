/**
 * Small badge shown on TaskCard / list rows when a task is blocked by
 * unresolved dependencies. Hover/title shows which tasks are blocking it.
 */
export default function DependencyBadge({ blockedBy = [] }) {
  if (!blockedBy.length) return null;

  const titles = blockedBy.map((t) => t.title).join(', ');

  return (
    <span
      title={`Blocked by: ${titles}`}
      className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full"
    >
      🔒 Blocked ({blockedBy.length})
    </span>
  );
}