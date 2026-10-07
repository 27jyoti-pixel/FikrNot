import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "../common/Badge";
import { fmtDate } from "../../utils/formatters";

export default function MiniItem({ item, type }) {
  const date = type === "lost" ? item.lostAt : item.foundAt;

  return (
    <Link className="mini-item" to={`/items/${item._id}?type=${type}`}>
      <span className={`mini-dot ${type}`} />
      <span className="mini-title">
        <b>{item.itemName}</b>
        <small>
          {item.location?.area} · {fmtDate(date)}
        </small>
      </span>
      <Badge value={item.status} />
      <ArrowRight size={16} />
    </Link>
  );
}
