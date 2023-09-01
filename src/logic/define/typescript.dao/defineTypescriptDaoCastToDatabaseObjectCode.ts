import { camelCase } from 'change-case';
import { DomainObjectMetadata } from 'domain-objects-metadata';
import { isPresent } from 'type-fns';

import { SupplementalQueryDeclaration } from '../../../domain/objects/SupplementalQueryDeclaration';
import { UnexpectedCodePathError } from '../../../utils/errors/UnexpectedCodePathError';
import { getPackageVersion } from '../../../utils/getPackageVersion';
import { QueryKeyType } from './getQueryKeyParametersForDomainObject';
import { getTypescriptQueryKeySerializationCode } from './getTypescriptQueryKeySerializationCode';

export const defineTypescriptDaoCastToDatabaseObjectCode = ({
  domainObjectMetadata,
  supplementalQueries,
}: {
  domainObjectMetadata: DomainObjectMetadata;
  supplementalQueries: SupplementalQueryDeclaration[];
}): string => {
  // sanity check assumptions
  if (!domainObjectMetadata.decorations.unique)
    throw new UnexpectedCodePathError(
      `no unique key was specified on the domain object '${domainObjectMetadata.name}'`,
      { domainObjectMetadata },
    );

  // define the code
  const code = `
import { HasMetadata } from 'type-fns';

import { ${domainObjectMetadata.name} } from '../../../domain';

/**
 * defines how to cast the domain-object to a database-object
 *
 * written by dynamodb-dao-generator 🦾
 */
export const castToDatabaseObject = ({
  ${camelCase(domainObjectMetadata.name)}: object,
}: {
  ${camelCase(domainObjectMetadata.name)}: HasMetadata<${
    domainObjectMetadata.name
  }>;
}) => {
  return {
    byUuid: {
      p: object.uuid,${
        supplementalQueries.length
          ? [
              '',
              ...supplementalQueries
                .map((query, index) =>
                  [
                    `p${index + 1}: ${getTypescriptQueryKeySerializationCode({
                      domainObjectMetadata,
                      key: query.filterByKey,
                      keyType: QueryKeyType.FILTER_BY_KEY,
                      sourceObjectName: 'object',
                    })},`,
                    query.sortByKey
                      ? `s${
                          index + 1
                        }: ${getTypescriptQueryKeySerializationCode({
                          domainObjectMetadata,
                          key: query.sortByKey,
                          keyType: QueryKeyType.SORT_BY_KEY,
                          sourceObjectName: 'object',
                        })},`
                      : undefined,
                  ].filter(isPresent),
                )
                .flat(),
            ].join('\n      ')
          : ''
      }
      o: JSON.stringify(object),
    },
    byUniqueOnNaturalKey: {
      p: ${getTypescriptQueryKeySerializationCode({
        domainObjectMetadata,
        key: domainObjectMetadata.decorations.unique,
        keyType: QueryKeyType.UNIQUE_KEY,
        sourceObjectName: 'object',
      })},
      o: JSON.stringify(object),
    },
  };
};
  `;

  // define the code
  return code;
};
