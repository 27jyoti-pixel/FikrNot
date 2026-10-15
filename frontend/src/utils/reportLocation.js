export function validateReportLocation(location = {}) {
  if (location.mode !== "manual" && location.mode !== "map") {
    return "Choose a location method.";
  }

  if (location.mode === "manual") {
    return String(location.area || "").trim()
      ? ""
      : "Enter a place or nearby landmark.";
  }

  const coordinates = location.coordinates;
  const validCoordinates =
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    Number.isFinite(Number(coordinates[0])) &&
    Number.isFinite(Number(coordinates[1])) &&
    Math.abs(Number(coordinates[0])) <= 180 &&
    Math.abs(Number(coordinates[1])) <= 90;

  if (!validCoordinates || !location.confirmed) {
    return "Choose a valid point on the map and confirm the location.";
  }
  return "";
}

export function buildReportLocation(location = {}) {
  if (location.mode === "map") {
    const coordinates = location.coordinates.map(Number);
    return {
      area:
        String(location.area || "").trim() ||
        `Map point (${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)})`,
      type: "Point",
      coordinates,
    };
  }
  return { area: String(location.area || "").trim() };
}
