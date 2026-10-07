import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { moderateLost } from "../../api/lostApi";
import { moderateFound } from "../../api/foundApi";
import { errorMessage } from "../../api/axiosClient";

export default function ModerationControl({ type, id, onDone }) {
  const [open, setOpen] = useState(false),
    [action, A] = useState("FLAGGED"),
    [reason, R] = useState(""),
    [error, E] = useState(""),
    [busy, B] = useState(false);
  async function submit(e) {
    e.preventDefault();
    B(true);
    E("");
    try {
      await (type === "lost" ? moderateLost : moderateFound)(id, {
        action,
        reason,
      });
      setOpen(false);
      R("");
      onDone?.();
    } catch (x) {
      E(errorMessage(x));
    } finally {
      B(false);
    }
  }
  return (
    <section className="panel side-panel moderation-panel">
      <div className="eyebrow">RECTOR TOOLS</div>
      <h3>
        <ShieldAlert size={16} /> Report moderation
      </h3>
      {!open ? (
        <button className="button outline full" onClick={() => setOpen(true)}>
          Review moderation
        </button>
      ) : (
        <form className="form-stack" onSubmit={submit}>
          <label>
            Action
            <select value={action} onChange={(e) => A(e.target.value)}>
              <option value="FLAGGED">Flag for review</option>
              <option value="INVALIDATED">Invalidate report</option>
              <option value="DUPLICATE">Mark as duplicate</option>
            </select>
          </label>
          <label>
            Reason
            <textarea
              required
              rows="3"
              value={reason}
              onChange={(e) => R(e.target.value)}
              placeholder="Explain why this action is needed"
            />
          </label>
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <div className="row-between">
            <button
              type="button"
              className="text-button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button className="button primary small" disabled={busy}>
              {busy ? "Saving…" : "Submit action"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
