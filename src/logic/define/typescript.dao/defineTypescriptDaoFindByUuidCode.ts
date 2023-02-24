import { DomainObjectMetadata } from 'domain-objects-metadata';

import { getPackageVersion } from '../../../utils/getPackageVersion';
import { getTypescriptTableNameBuilderCode } from './getTypescriptTableNameBuilderCode';

export const defineTypescriptDaoFindByUuidCode = ({
  domainObjectMetadata,
}: {
  domainObjectMetadata: DomainObjectMetadata;
}): string => {
  // define the code
  const code = `
import { simpleDynamodbClient } from 'simple-dynamodb-client';
import { HasMetadata } from 'type-fns';

import { ${domainObjectMetadata.name} } from '../../../domain';
import { getConfig } from '../../../utils/config/getConfig';
import { UnexpectedCodePathError } from '../../../utils/errors/UnexpectedCodePathError';
import { log } from '../../../utils/logger';
import { castFromDatabaseObject } from './castFromDatabaseObject';

/**
 * enables finding a ${domainObjectMetadata.name} by uuid
 *
 * written by dynamodb-dao-generator@${getPackageVersion()} 🦾
 */
export const findByUuid = async ({ uuid }: { uuid: string }): Promise<HasMetadata<${
    domainObjectMetadata.name
  }> | null> => {
  const config = await getConfig();
  const items = await simpleDynamodbClient.query({
    tableName: ${getTypescriptTableNameBuilderCode({
      domainObjectMetadata,
      keyType: 'UUID',
    })},
    logDebug: log.debug,
    attributesToRetrieveInQuery: ['o'],
    queryConditions: {
      KeyConditionExpression: 'p = :p',
      ExpressionAttributeValues: {
        ':p': uuid,
      },
    },
  });
  if (!items.length) return null;
  if (items.length > 1)
    throw new UnexpectedCodePathError(\`more than one object found by uuid\`, {
      items,
      uuid,
    });
  return castFromDatabaseObject(items[0]);
};
  `;

  // define the code
  return code;
};
