import { camelCase } from 'change-case';
import { DomainObjectMetadata } from 'domain-objects-metadata';

import { SupplementalQueryDeclaration } from '../../../domain/objects/SupplementalQueryDeclaration';
import { defineSupplementalQueryNameFromDefinition } from './defineTypescriptDaoFindAllBySupplementalQueryCode';

export const defineTypescriptDaoIndexCode = ({
  domainObjectMetadata,
  supplementalQueries,
}: {
  domainObjectMetadata: DomainObjectMetadata;
  supplementalQueries: SupplementalQueryDeclaration[];
}): string => {
  // define the method names
  const methodNames = [
    'upsert',
    'findByUuid',
    'findByUnique',
    ...supplementalQueries.map((query) =>
      defineSupplementalQueryNameFromDefinition({ query }),
    ),
  ];

  // define the code
  const code = `
${methodNames
  .sort()
  .map((name) => `import { ${name} } from './${name}';`)
  .join('\n')}

export const ${camelCase(domainObjectMetadata.name)}Dao = {
  ${methodNames.join(',\n  ')},
};
  `;

  // define the code
  return code;
};
