import { titleCase } from "../../utils/formatters";
export default function Badge({ value }) {
  return (
    <span
      className={`badge ${String(value || "")
        .toLowerCase()
        .replaceAll("_", "-")}`}
    >
      {titleCase(value) || "Unknown"}
    </span>
  );
}
