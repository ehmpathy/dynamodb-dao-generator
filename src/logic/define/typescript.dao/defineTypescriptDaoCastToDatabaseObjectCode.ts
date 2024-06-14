import { camelCase } from 'change-case';
import { DomainObjectMetadata } from 'domain-objects-metadata';
import { isPresent } from 'type-fns';

import { SupplementalQueryDeclaration } from '../../../domain/objects/SupplementalQueryDeclaration';
import { UnexpectedCodePathError } from '../../../utils/errors/UnexpectedCodePathError';
import { getPackageVersion } from '../../../utils/getPackageVersion';
import { QueryKeyType } from './getQueryKeyParametersForDomainObject';
import { getReferenceTypePropertyNames } from './getReferenceTypePropertyNames';
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

  // determine whether we need to import serialization capabilities
  const keyProperties: string[] = [
    ...new Set([
      ...domainObjectMetadata.decorations.unique,
      ...supplementalQueries
        .map((query) => [
          ...query.filterByKey,
          ...(query.sortByKey ? query.sortByKey : []),
        ])
        .flat(),
    ]),
  ];
  const serializationUtilitiesRequired = getReferenceTypePropertyNames({
    from: domainObjectMetadata,
    for: { subset: keyProperties },
  }).length;

  // define the optional imports
  const optionalImports = [
    '',
    ...(serializationUtilitiesRequired
      ? [`import { serialize, omitMetadataValues } from 'domain-objects';`]
      : []),
  ];

  // define the input variable name
  const dobjInputVariableName =
    domainObjectMetadata.decorations.alias ?? // use the alias if defined
    camelCase(domainObjectMetadata.name);

  // define the code
  const code = `
import { HasMetadata } from 'type-fns';

import { ${
    domainObjectMetadata.name
  } } from '../../../domain';${optionalImports.join('\n')}

/**
 * defines how to cast the domain-object to a database-object
 *
 * written by dynamodb-dao-generator 🦾
 */
export const castToDatabaseObject = ({
  ${dobjInputVariableName}: object,
}: {
  ${dobjInputVariableName}: HasMetadata<${domainObjectMetadata.name}>;
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
