const normalizeLocation = (location) => {
  const normalized = { area: String(location.area || '').trim() };
  if (Array.isArray(location.coordinates)) {
    normalized.type = 'Point';
    normalized.coordinates = location.coordinates.map(Number);
  }
  return normalized;
};

module.exports = normalizeLocation;
