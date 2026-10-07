const parseImageRemovalIds = (value) => {
  if (value === undefined || value === null || value === '') return [];
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      const error = new Error('Image removals must be a JSON array.');
      error.statusCode = 400;
      throw error;
    }
  }
  if (!Array.isArray(parsed) || parsed.some((id) => typeof id !== 'string')) {
    const error = new Error('Image removals must be a JSON array of image identifiers.');
    error.statusCode = 400;
    throw error;
  }
  return parsed;
};

module.exports = parseImageRemovalIds;
