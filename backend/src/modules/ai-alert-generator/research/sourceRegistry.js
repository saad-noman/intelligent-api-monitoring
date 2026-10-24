// Numbers the sources shown to the model during one analysis ("S1", "S2", ...). The model
// cites these IDs; the output guardrail resolves them back to the real titles and URLs,
// so a cited link is always one that was actually retrieved.
export function createSourceRegistry() {
  const sourcesById = new Map();
  const idsByUrl = new Map();

  return {
    // Returns the reference with its ID; a URL seen before keeps its first ID.
    register(reference) {
      const existingId = idsByUrl.get(reference.url);
      if (existingId) return sourcesById.get(existingId);

      const source = { id: `S${sourcesById.size + 1}`, ...reference };
      sourcesById.set(source.id, source);
      idsByUrl.set(source.url, source.id);
      return source;
    },
    get(id) {
      return sourcesById.get(id);
    },
    ids() {
      return [...sourcesById.keys()];
    },
  };
}
