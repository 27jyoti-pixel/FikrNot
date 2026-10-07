import { Link } from "react-router-dom";
import {
  MapPin,
  CalendarDays,
  ArrowUpRight,
  Image as ImageIcon,
} from "lucide-react";
import Badge from "../common/Badge";
import { fmtDate, imageUrl } from "../../utils/formatters";
export default function ItemCard({ item, type }) {
  const img = imageUrl(item);
  return (
    <article className="item-card">
      <Link to={`/items/${item._id}?type=${type}`} className="item-image">
        {img ? (
          <img
            src={img}
            alt={item.itemName || "Reported item"}
            loading="lazy"
          />
        ) : (
          <span>
            <ImageIcon size={25} />
          </span>
        )}
        <b className={`type-chip ${type}`}>
          {type === "lost" ? "Lost" : "Found"}
        </b>
      </Link>
      <div className="item-card-body">
        <div className="item-topline">
          <span>{item.category}</span>
          <Badge value={item.status} />
        </div>
        <Link to={`/items/${item._id}?type=${type}`} className="item-title">
          {item.itemName}
          <ArrowUpRight size={16} />
        </Link>
        <p className="item-meta">
          <MapPin size={14} />
          {item.location?.area || "Campus location"}
        </p>
        <p className="item-meta">
          <CalendarDays size={14} />
          {fmtDate(type === "lost" ? item.lostAt : item.foundAt)}
        </p>
      </div>
    </article>
  );
}
