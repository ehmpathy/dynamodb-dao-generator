import { normalize } from 'path';

/**
 * e.g., `src//logic/../dao/index.ts` -> `src/dao/index.ts`
 */
export const getNormalizedPath = (path: string) => normalize(path);
