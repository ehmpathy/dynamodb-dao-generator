import { snakeCase, paramCase } from 'change-case';
import {
  DomainObjectMetadata,
  DomainObjectPropertyType,
} from 'domain-objects-metadata';
import { isPresent } from 'type-fns';

import { GeneratedCodeFile } from '../../../domain/objects/GeneratedCodeFile';
import { SupplementalQueryDeclaration } from '../../../domain/objects/SupplementalQueryDeclaration';

export const defineDynamodbSecondaryIndexNameForSupplementalQuery = ({
  query,
}: {
  query: SupplementalQueryDeclaration;
}): string =>
  [
    'index-by',
    [
      query.filterByKey.map((key) => paramCase(key)).join('-'),
      query?.sortByKey?.map((key) => paramCase(key)).join('-'),
    ]
      .filter(isPresent)
      .join('-sort-'),
  ].join('-');

/**
 * defines the `attribute` and `global_secondary_index` properties required on the index-by-uuid table to execute this supplemental query
 *
 * specifically
 * - the `attribute` property informs dynamodb that it needs to be able to index this column and defines its type
 * - the `global_secondary_index` property informs dynamodb that it needs to provision a secondary index with the required keys, name, and projection settings
 */
const getDynamodbTablePropertiesForSupplementalQuery = ({
  domainObjectMetadata,
  query,
  queryNumber,
}: {
  domainObjectMetadata: DomainObjectMetadata;
  query: SupplementalQueryDeclaration;
  queryNumber: number;
}) => {
  // define the index condition name as '${unique-keys}-sort-${sort-keys}' if sort-keys exist, or just unique-keys if not
  const indexName = defineDynamodbSecondaryIndexNameForSupplementalQuery({
    query,
  });

  // define the components
  const components = [
    // primary key attribute
    `
  attribute {
    name = "p${queryNumber}"
    type = "S"
  }
  `.trim(),

    // sort key attribute, if sort key is specified
    query.sortByKey
      ? `
  attribute {
    name = "s${queryNumber}"
    type = "${
      query.sortByKey.length === 1 &&
      domainObjectMetadata.properties[query.sortByKey[0]!]?.type ===
        DomainObjectPropertyType.NUMBER
        ? 'N' // if its a single sort key of numerical value, then we should track it as a number, to support numerical sorting (`"100" < "9"`, while `100 > 9`)
        : 'S'
    }"
  }
  `.trim()
      : undefined,

    // the index
    `
  global_secondary_index {
    name               = "${indexName}"
    hash_key           = "p${queryNumber}"${
      query.sortByKey
        ? ['', `range_key          = "s${queryNumber}"`].join('\n    ')
        : ''
    }
    projection_type    = "INCLUDE"
    non_key_attributes = ["o"]
  }
  `.trim(),
  ].filter(isPresent);

  // return a joined string
  return components.join('\n  ');
};

/**
 * this method creates all of the terraform resources definitions required to persist this domain object in dynamodb
 *
 * specifically
 * - the index-by-uuid table (upon which all non-unique queries are secondarily indexed)
 * - a index-by-unique table for each unique key of the domain object (must be a separate table to ensure global uniqueness constraint, only way to support this in dynamodb)
 */
export const defineTerraformResourceCodeForDomainObject = ({
  domainObjectMetadata,
  supplementalQueries,
}: {
  domainObjectMetadata: DomainObjectMetadata;
  supplementalQueries: SupplementalQueryDeclaration[];
}): GeneratedCodeFile => {
  // define a comment describing these resources
  const comment = `
/**
 * declares the tables required to persist the ${domainObjectMetadata.name} ${domainObjectMetadata.extends} in dynamodb
 * - includes the index-by-uuid table w/ all required secondary search indexes
 * - includes an index-by-unique table per unique key, to ensure global uniqueness constraint
 * - enforces best practices like
 *   - point_in_time_recovery for disaster recovery and data analytics (https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/PointInTimeRecovery.html)
 *
 * written by dynamodb-dao-generator 🦾
 */
  `.trim();

  // define the index by uuid table
  const indexByUuidTable = `
resource "aws_dynamodb_table" "table_${snakeCase(
    domainObjectMetadata.name,
  )}_by_uuid" {
  name         = "\${local.service}-\${var.environment}-table-${paramCase(
    domainObjectMetadata.name,
  )}-by-uuid"
  billing_mode = "PAY_PER_REQUEST"
  point_in_time_recovery {
    enabled = var.environment == "prod" ? true : false
  }

  hash_key = "p" # partition key

  attribute {
    name = "p"
    type = "S"
  }
  ${supplementalQueries
    .map((query, index) =>
      getDynamodbTablePropertiesForSupplementalQuery({
        domainObjectMetadata,
        query,
        queryNumber: index + 1,
      }),
    )
    .join('\n  ')}${supplementalQueries.length ? '\n' : ''}
  tags = local.tags
}
  `.trim();

  // define an index for each unique key; // TODO: support more than one unique key once github.com/ehmpathy/domain-objects/21 is merged
  const indexByUniqueNaturalKeyTable = `
resource "aws_dynamodb_table" "table_${snakeCase(
    domainObjectMetadata.name,
  )}_by_unique_on_natural_key" {
  name         = "\${local.service}-\${var.environment}-table-${paramCase(
    domainObjectMetadata.name,
  )}-by-unique-on-natural-key"
  billing_mode = "PAY_PER_REQUEST"
  point_in_time_recovery {
    enabled = var.environment == "prod" ? true : false
  }

  hash_key = "p" # partition key

  attribute {
    name = "p"
    type = "S"
  }

  tags = local.tags
}

  `.trim();

  // define the expected file name
  const fileName = [
    'dynamodb',
    'table',
    snakeCase(domainObjectMetadata.name),
    'tf',
  ].join('.');

  // return the full definition
  return new GeneratedCodeFile({
    path: fileName,
    code: [comment, indexByUuidTable, indexByUniqueNaturalKeyTable].join('\n'),
  });
};
