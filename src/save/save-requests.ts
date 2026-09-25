const listeners = new Set<() => void>();

/** Asks for the game to be saved soon (debounced by whoever listens). Cheap to call often. */
export function requestSave(): void {
  for (const listener of listeners) listener();
}

export function onSaveRequest(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
