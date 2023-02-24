import { Stage, stage } from './environment';

export const getPackageVersion = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { version } = require('../../package.json');
  if (stage === Stage.TEST) return 'vX.X.X'; // so that snapshots dont break every time
  return ['v', version].join('');
};
