import { useEffect } from 'react';

/**
 * Frees a GPU resource (geometry, material, texture) built by hand when the component that owns it goes away.
 * React Three Fiber only disposes what it created from JSX; a geometry passed in by the `geometry` prop would
 * otherwise stay on the graphics card for good, one more of them on every visit to a dungeon layer.
 */
export function useDispose(resource: { dispose(): void }): void {
  useEffect(() => () => resource.dispose(), [resource]);
}
