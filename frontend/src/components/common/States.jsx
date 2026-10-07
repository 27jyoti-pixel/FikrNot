import { LoaderCircle, TriangleAlert, SearchX } from "lucide-react";
export function Loading({ label = "Loading…" }) {
  return (
    <div className="state" role="status">
      <LoaderCircle className="spin" size={20} />
      {label}
    </div>
  );
}
export function ErrorState({ message, onRetry }) {
  return (
    <div className="state error-state" role="alert">
      <TriangleAlert size={20} />
      <span>{message}</span>
      {onRetry && (
        <button className="text-button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function EmptyState({ title = "Nothing here yet", children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <SearchX size={22} />
      </span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
