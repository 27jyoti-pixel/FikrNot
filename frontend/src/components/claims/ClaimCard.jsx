import Badge from "../common/Badge";
import { fmtDate } from "../../utils/formatters";

export default function ClaimCard({ claim, onWithdraw, onConfirm }) {
  return (
    <article className="claim-card">
      <div className="row-between">
        <strong>{claim.foundReportId?.itemName || "Ownership claim"}</strong>
        <Badge value={claim.status} />
      </div>
      <p>{claim.evidence || "Evidence details submitted."}</p>
      <div className="claim-foot">
        <span>Submitted {fmtDate(claim.createdAt)}</span>
        <div>
          {claim.infoRequestedReason && (
            <span className="notice-inline">
              Rector requested: {claim.infoRequestedReason}
            </span>
          )}
          {["SUBMITTED", "UNDER_VERIFICATION"].includes(claim.status) &&
            onWithdraw && (
              <button
                className="text-button danger-text"
                onClick={() => onWithdraw(claim._id)}
              >
                Withdraw claim
              </button>
            )}
          {claim.status === "APPROVED" &&
            claim.studentConfirmedAt == null &&
            onConfirm && (
              <button
                className="button primary small"
                onClick={() => onConfirm(claim._id)}
              >
                Confirm I received it
              </button>
            )}
        </div>
      </div>
    </article>
  );
}
