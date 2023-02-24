import { paramCase } from 'change-case';
import { DomainObjectMetadata } from 'domain-objects-metadata';

import { UnexpectedCodePathError } from '../../../utils/errors/UnexpectedCodePathError';

export const getTypescriptTableNameBuilderCode = ({
  domainObjectMetadata,
  keyType,
}: {
  domainObjectMetadata: DomainObjectMetadata;
  keyType: 'UUID' | 'UNIQUE';
}) => {
  const genCodeForQualifier = (qualifier: string) =>
    `\`\${config.service}-\${config.environment}-table-${paramCase(
      domainObjectMetadata.name,
    )}-by-${qualifier}\``;
  if (keyType === 'UUID') return genCodeForQualifier('uuid');
  if (keyType === 'UNIQUE') return genCodeForQualifier('unique-on-natural-key');
  // TODO: support unique reference keys, once github.com/ehmpathy/domain-objects/21 is merged
  throw new UnexpectedCodePathError(
    'unsupported keyType for getTypescriptTableNameBuilderCode ',
  );
};
