function normalizeName(name) {
  return String(name || '').trim().toLowerCase();
}

function parseEmbeddingValue(embedding) {
  if (Array.isArray(embedding)) return embedding;
  if (typeof embedding === 'string' && embedding.trim()) {
    try {
      const parsed = JSON.parse(embedding);
      return Array.isArray(parsed) ? parsed : null;
    } catch (err) {
      return null;
    }
  }
  return null;
}

module.exports = {
  normalizeName,
  parseEmbeddingValue
};
