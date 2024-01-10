import { pascalCase } from 'change-case';
import { DomainObjectMetadata } from 'domain-objects-metadata';
import { isPresent } from 'type-fns';

import { SupplementalQueryDeclaration } from '../../../domain/objects/SupplementalQueryDeclaration';
import { getPackageVersion } from '../../../utils/getPackageVersion';
import { defineDynamodbSecondaryIndexNameForSupplementalQuery } from '../terraform.resources/defineTerraformResourceCodeForDomainObject';
import {
  getQueryKeyParametersForDomainObject,
  QueryKeyType,
} from './getQueryKeyParametersForDomainObject';
import { getTypescriptQueryKeySerializationCode } from './getTypescriptQueryKeySerializationCode';
import { getTypescriptTableNameBuilderCode } from './getTypescriptTableNameBuilderCode';
import { getTypescriptTypeForQueryParameters } from './getTypescriptTypeForQueryParameters';

export const defineSupplementalQueryNameFromDefinition = ({
  query,
}: {
  query: SupplementalQueryDeclaration;
}) =>
  [
    `findAllBy`,
    [
      query.filterByKey.map((key) => pascalCase(key)).join('And'),
      query.sortByKey?.map((key) => pascalCase(key)).join('And'),
    ]
      .filter(isPresent)
      .join('SortBy'),
  ].join('');

export const defineTypescriptDaoFindAllBySupplementalQueryCode = ({
  domainObjectMetadata,
  query,
  queryNumber,
}: {
  domainObjectMetadata: DomainObjectMetadata;
  query: SupplementalQueryDeclaration;
  queryNumber: number;
}): string => {
  // define the filter key parameters
  const filterKeyParameters = getQueryKeyParametersForDomainObject({
    domainObjectMetadata,
    key: query.filterByKey,
    keyType: QueryKeyType.FILTER_BY_KEY,
  });

  // define the sortKey parameters, for each sortKey specified
  const sortKeyParameters = query.sortByKey
    ? getQueryKeyParametersForDomainObject({
        domainObjectMetadata,
        key: query.sortByKey,
        keyType: QueryKeyType.SORT_BY_KEY,
      })
    : null;

  // define the sortByParameter modifiers with which to build up alternatives of the input parameters
  const sortByParameterModifiers = sortKeyParameters
    ? [
        `
  /**
   * specify this to use a descending sort key option
   * - specify 'ANY' to sort without filtering
   * - specify a value to additionally filter out everything greater than the value specified
   */
  until: ${getTypescriptTypeForQueryParameters(sortKeyParameters)} | 'ANY';
    `.trim(),
        `
  /**
   * specify this to use a ascending sort key option
   * - specify 'ANY' to sort without filtering
   * - specify a value to additionally filter out everything less than or equal to the value specified
   */
  since: ${getTypescriptTypeForQueryParameters(sortKeyParameters)} | 'ANY';
  `.trim(),
      ]
    : [''];

  // define the query parameters based on these options
  const queryParameters = sortByParameterModifiers
    .map((sortByParameterModifier) =>
      `
{
  ${Object.entries(filterKeyParameters)
    .map(([key, type]) => `${key}: ${type};`)
    .join('\n')}${
        sortByParameterModifier
          ? ['', sortByParameterModifier].join('\n\n  ')
          : ''
      }

  /**
   * specify this to limit the number of results returned
   */
  limit?: number;
}
  `.trim(),
    )
    .join(' | ');

  // define the sorting on key type guards
  const sortingOnKeyTypeGuards = sortKeyParameters
    ? [
        // start with empty string to create newline
        '',

        // add the type guard for checking for if is sorting "until"
        `
const isSortingUntil = <T>(
  args: { until: T } | { since: T },
): args is { until: T } => !!(args as any).until;
        `.trim(),
      ]
    : [];

  // define the query name
  const queryName = defineSupplementalQueryNameFromDefinition({ query });

  // define the table name reference, since its the same for all queries
  const tableNameReference = getTypescriptTableNameBuilderCode({
    domainObjectMetadata,
    keyType: 'UUID', // supplemental queries run against uuid table, since that's where the indexes are defined on
  });

  // define the query cases
  const indexName = defineDynamodbSecondaryIndexNameForSupplementalQuery({
    query,
  });

  // define the code
  const code = `
import { simpleDynamodbClient } from 'simple-dynamodb-client';
import { HasMetadata } from 'type-fns';

import { ${domainObjectMetadata.name} } from '../../../domain';
import { getConfig } from '../../../utils/config/getConfig';
import { log } from '../../../utils/logger';
import { castFromDatabaseObject } from './castFromDatabaseObject';${sortingOnKeyTypeGuards.join(
    '\n\n',
  )}

/**
 * enables finding all ${domainObjectMetadata.name} by ${Object.keys(
    filterKeyParameters,
  ).join(' and ')}${
    sortKeyParameters
      ? ` with optional sorting by ${Object.keys(sortKeyParameters).join(
          ' and ',
        )}`
      : ''
  }
 *
 * written by dynamodb-dao-generator 🦾
 */
export const ${queryName} = async (args: ${queryParameters}): Promise<HasMetadata<${
    domainObjectMetadata.name
  }>[]> => {
  const config = await getConfig();
  ${
    !query.sortByKey
      ? // if no sort key, this is very simple
        `
  const items = await simpleDynamodbClient.query({
    tableName: ${tableNameReference},
    logDebug: log.debug,
    attributesToRetrieveInQuery: ['o'],
    queryConditions: {
      IndexName: '${indexName}',
      KeyConditionExpression: 'p${queryNumber} = :p${queryNumber}',
      ExpressionAttributeValues: {
        ':p${queryNumber}': ${getTypescriptQueryKeySerializationCode({
          domainObjectMetadata,
          key: query.filterByKey,
          keyType: QueryKeyType.FILTER_BY_KEY,
          sourceObjectName: 'args',
        })},
      },
      Limit: args.limit,
    },
  });
          `.trim()
      : // with sort key, little more involved
        `
  const sortArgs = isSortingUntil(args) ? args.until : args.since;
  const sortOperator = isSortingUntil(args) ? '<=' : '>';
  const dontFilterOnSortKey = sortArgs === 'ANY'; // if sort args were specified as 'ANY', then they filtering on sort key was not requested
  const items = await simpleDynamodbClient.query({
    tableName: ${tableNameReference},
    logDebug: log.debug,
    attributesToRetrieveInQuery: ['o'],
    queryConditions: {
      IndexName: '${indexName}',
      KeyConditionExpression:
        dontFilterOnSortKey
          ? 'p${queryNumber} = :p${queryNumber}' // no need to check sort key if sorting on any
          : \`p${queryNumber} = :p${queryNumber} AND s${queryNumber} \${sortOperator} :s${queryNumber}\`, // otherwise compare sort key
      ExpressionAttributeValues: {
        ':p${queryNumber}': ${getTypescriptQueryKeySerializationCode({
          domainObjectMetadata,
          key: query.filterByKey,
          keyType: QueryKeyType.FILTER_BY_KEY,
          sourceObjectName: 'args',
        })},
        ...(dontFilterOnSortKey
            ? undefined
            : { ':s${queryNumber}': ${getTypescriptQueryKeySerializationCode({
          domainObjectMetadata,
          key: query.sortByKey,
          keyType: QueryKeyType.SORT_BY_KEY,
          sourceObjectName: 'sortArgs',
        })} }),
      },
      ScanIndexForward: isSortingUntil(args) ? false : true, // descending on sort key if "until" (latest first); otherwise, ascending on sort key for "since"
      Limit: args.limit,
    },
  });
        `.trim()
  }
  return items.map(castFromDatabaseObject);
};
`;

  // define the code
  return code;
};
