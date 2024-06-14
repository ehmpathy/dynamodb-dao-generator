import { camelCase } from 'change-case';
import { DomainObjectMetadata } from 'domain-objects-metadata';

import { SupplementalQueryDeclaration } from '../../../domain/objects/SupplementalQueryDeclaration';
import { getPackageVersion } from '../../../utils/getPackageVersion';
import { getTypescriptTableNameBuilderCode } from './getTypescriptTableNameBuilderCode';

export const defineTypescriptDaoUpsertCode = ({
  domainObjectMetadata,
}: {
  domainObjectMetadata: DomainObjectMetadata;
  supplementalQueries: SupplementalQueryDeclaration[]; // TODO: use this def to support creating per-reference-key unique table writes
}): string => {
  // define the input variable name
  const dobjInputVariableName =
    domainObjectMetadata.decorations.alias ?? // use the alias if defined
    camelCase(domainObjectMetadata.name);

  // define the code
  const code = `
import { serialize, omitMetadataValues } from 'domain-objects';
import { simpleDynamodbClient } from 'simple-dynamodb-client';
import { HasMetadata } from 'type-fns';
import { v4 as uuidv4 } from 'uuid';

import { ${domainObjectMetadata.name} } from '../../../domain';
import { getConfig } from '../../../utils/config/getConfig';
import { UnexpectedCodePathError } from '../../../utils/errors/UnexpectedCodePathError';
import { log } from '../../../utils/logger';
import { castToDatabaseObject } from './castToDatabaseObject';
import { findByUnique } from './findByUnique';

/**
 * enables the upsert of a ${domainObjectMetadata.name}
 *
 * features
 * - supports optimistic locking
 * - autogenerates database metadata such as uuid and created at
 *
 * written by dynamodb-dao-generator 🦾
 */
export const upsert = async ({
  ${dobjInputVariableName}: object,
  lockOn,
  force,
}: {
  ${dobjInputVariableName}: ${domainObjectMetadata.name};

  /**
   * the lockOn property enables you to optimistically lock on the entity being in a current state in the database before you write to it
   *
   * for example
   * - \`lockOn: null\` enforces that the entity does not exist in the database already by its natural unique key
   */
  lockOn?: null;

  /**
   * the force property enables you to write to the tables even if the current state of the entity is equivalent to the persisted state in the unique index table
   *
   * relevance
   * - if you find that your index tables are out of sync due to a migration, you can force writing to all tables to propagate the latest state
   */
  force?: true;
}) => {
  const config = await getConfig();

  // lookup current state, if any
  const foundObject = await findByUnique(object);
  if (foundObject && lockOn === null)
    throw new UnexpectedCodePathError(
      'object already exists but asked to lockOn null',
      { foundObject, lockOn },
    );
  const mustLockOnNull = !foundObject; // if the domain-object does not exist, we'll be defining the uuid + createdAt, so must "lock-on-null" ourselves to fulfill the request + retry if failed
  const askedToLockOnNull = lockOn === null; // track whether the user asked us to lock on null, separately, to enable deciding if we should propagate the error or just silently retry

  // check if this would be a no op; if so, we can exit here
  if (
    foundObject &&
    serialize(omitMetadataValues(new ${domainObjectMetadata.name}(object))) ===
      serialize(omitMetadataValues(foundObject)) &&
    !force
  )
    return foundObject; // if what we want to upsert is whats already in the database, we can exit here; saves on the expensive write operations

  // define the object with database generated values
  const objectWithDatabaseGeneratedValues = new ${domainObjectMetadata.name}({
    ...object,

    // if not already found, autogenerate the database-generated values; otherwise, just use them
    ...(!foundObject
      ? { uuid: uuidv4(), createdAt: new Date().toISOString() }
      : { uuid: foundObject.uuid, createdAt: foundObject.createdAt }),

    // and in either case, set a new updatedAt time
    updatedAt: new Date().toISOString(),${
      domainObjectMetadata.decorations.unique?.includes('uuid')
        ? [
            '',
            `
    // and since this entity is unique on uuid, make sure the use the input uuid and not autogenerate it
    uuid: object.uuid,
    `.trim(),
          ].join('\n\n  ')
        : ''
    }
  }) as HasMetadata<${domainObjectMetadata.name}>;

  // cast the item
  const item = castToDatabaseObject({
    ${dobjInputVariableName}: objectWithDatabaseGeneratedValues,
  });

  // open a transaction for an atomic write on the two writes we need to guarantee uniqueness on the two keys
  const transaction = simpleDynamodbClient.startTransaction();

  // put to the by-unique table, for each unique key, to ensure max one object per unique-key
  transaction.queue.put({
    tableName: ${getTypescriptTableNameBuilderCode({
      domainObjectMetadata,
      keyType: 'UNIQUE',
    })},
    logDebug: log.debug,
    item: item.byUniqueOnNaturalKey,
    putConditions: mustLockOnNull // if must lock on null => ensure that there's no other record with this unique key when writing
      ? {
          ConditionExpression: 'attribute_not_exists(p)',
        }
      : undefined,
  });

  // put to the by-uuid table, to ensure max one object per uuid
  transaction.queue.put({
    tableName: ${getTypescriptTableNameBuilderCode({
      domainObjectMetadata,
      keyType: 'UUID',
    })},
    logDebug: log.debug,
    item: item.byUuid,
    putConditions: mustLockOnNull // if must lock on null => ensure that there's no other record with this unique key when writing
      ? {
          ConditionExpression: 'attribute_not_exists(p)',
        }
      : undefined,
  });

  // commit the txn
  await transaction
    .execute({ logDebug: log.debug })
    .catch((error) => {
      // make the errors more helpful
      if (!(error instanceof Error)) throw error; // if not an error, we can't handle it

      // handle error saying the record already existed
      if (
        error.message.includes(
          'specific reasons [ConditionalCheckFailed, None',
        ) ||
        error.message.includes(
          'specific reasons [None, ConditionalCheckFailed',
        ) ||
        error.message.includes(
          'specific reasons [ConditionalCheckFailed, ConditionalCheckFailed',
        )
      )
        throw new Error(
          'optimistic lock failed, record already existed by unique key',
        );

      // if none of the cases above caught the error, then we didn't handle it
      throw error;
    })
    .catch((error) => {
      if (
        !askedToLockOnNull &&
        error.message.includes('optimistic lock failed')
      )
        return upsert({ ${dobjInputVariableName}: object }); // if we caught optimistic lock without the user asking for one, then retry it - it will pass this time

      // otherwise, we still can't handle it
      throw error;
    });

  // return the object
  return objectWithDatabaseGeneratedValues;
};
`;

  // define the code
  return code;
};
