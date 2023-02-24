import path from 'path';

import { getDirOfPath } from './getDirOfPath';

export const getRelativePath = ({ from, to }: { from: string; to: string }) =>
  path.relative(getDirOfPath(from), to);
