import { DomainObjectMetadata } from 'domain-objects-metadata';

import { UnexpectedCodePathError } from '../../../utils/errors/UnexpectedCodePathError';
import {
  getQueryKeyParametersForDomainObject,
  QueryKeyType,
} from './getQueryKeyParametersForDomainObject';
import { getReferenceTypePropertyNames } from './getReferenceTypePropertyNames';
import { getTypescriptQueryKeySerializationCode } from './getTypescriptQueryKeySerializationCode';
import { getTypescriptTableNameBuilderCode } from './getTypescriptTableNameBuilderCode';
import { getTypescriptTypeForQueryParameters } from './getTypescriptTypeForQueryParameters';

export const defineTypescriptDaoFindByUniqueCode = ({
  domainObjectMetadata,
}: {
  domainObjectMetadata: DomainObjectMetadata;
}): string => {
  // define the unique key properties
  if (!domainObjectMetadata.decorations.unique)
    throw new UnexpectedCodePathError(
      '.unique keys were not defined for domain object',
      { domainObjectMetadata },
    );
  const parameters = getQueryKeyParametersForDomainObject({
    domainObjectMetadata,
    key: domainObjectMetadata.decorations.unique,
    keyType: QueryKeyType.UNIQUE_KEY,
  });

  // determine if we need to import any references from domain
  const referencesToImport = getReferenceTypePropertyNames({
    from: domainObjectMetadata,
    for: { subset: Object.keys(parameters) },
  }).map(({ referencedType }) => referencedType);
  const serializationUtilitiesRequired = referencesToImport.length;

  // define the optional imports
  const optionalImports = [
    '',
    ...(serializationUtilitiesRequired
      ? [`import { serialize, omitMetadataValues } from 'domain-objects';`]
      : []),
  ];

  // define the code
  const code = `
import { simpleDynamodbClient } from 'simple-dynamodb-client';
import { HasMetadata } from 'type-fns';${optionalImports.join('\n')}

import { ${[domainObjectMetadata.name, ...referencesToImport].join(
    ', ',
  )} } from '../../../domain';
import { getConfig } from '../../../utils/config/getConfig';
import { UnexpectedCodePathError } from '../../../utils/errors/UnexpectedCodePathError';
import { log } from '../../../utils/logger';
import { castFromDatabaseObject } from './castFromDatabaseObject';

/**
 * enables finding a ${domainObjectMetadata.name} by its natural unique key
 *
 * written by dynamodb-dao-generator 🦾
 */
export const findByUnique = async (args: ${getTypescriptTypeForQueryParameters(
    parameters,
  )}): Promise<HasMetadata<${domainObjectMetadata.name}> | null> => {
  const config = await getConfig();
  const items = await simpleDynamodbClient.query({
    tableName: ${getTypescriptTableNameBuilderCode({
      domainObjectMetadata,
      keyType: 'UNIQUE',
    })},
    logDebug: log.debug,
    attributesToRetrieveInQuery: ['o'],
    queryConditions: {
      KeyConditionExpression: 'p = :p',
      ExpressionAttributeValues: {
        ':p': ${getTypescriptQueryKeySerializationCode({
          domainObjectMetadata,
          key: domainObjectMetadata.decorations.unique,
          keyType: QueryKeyType.UNIQUE_KEY,
          sourceObjectName: 'args',
        })},
      },
    },
  });
  if (!items.length) return null;
  if (items.length > 1)
    throw new UnexpectedCodePathError(\`more than one object found by unique\`, {
      items,
      args,
    });
  return castFromDatabaseObject(items[0]);
};
`;

  // define the code
  return code;
};
