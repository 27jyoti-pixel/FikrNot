export const fmtDate = (v) =>
  v
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(v),
      )
    : "Date unavailable";
export const titleCase = (s) =>
  String(s || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
export const entityId = (v) =>
  typeof v === "object" ? v?._id || v?.id || "" : v;
export const imageUrl = (item) => item?.images?.[0]?.url || "";
