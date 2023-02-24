import { camelCase } from 'change-case';
import { DomainObjectMetadata } from 'domain-objects-metadata';

import { GeneratedCodeFile } from '../../../domain/objects/GeneratedCodeFile';
import { SupplementalQueryDeclaration } from '../../../domain/objects/SupplementalQueryDeclaration';
import { defineTypescriptDaoCastFromDatabaseObjectCode } from './defineTypescriptDaoCastFromDatabaseObjectCode';
import { defineTypescriptDaoCastToDatabaseObjectCode } from './defineTypescriptDaoCastToDatabaseObjectCode';
import {
  defineSupplementalQueryNameFromDefinition,
  defineTypescriptDaoFindAllBySupplementalQueryCode,
} from './defineTypescriptDaoFindAllBySupplementalQueryCode';
import { defineTypescriptDaoFindByUniqueCode } from './defineTypescriptDaoFindByUniqueCode';
import { defineTypescriptDaoFindByUuidCode } from './defineTypescriptDaoFindByUuidCode';
import { defineTypescriptDaoIndexCode } from './defineTypescriptDaoIndexCode';
import { defineTypescriptDaoMaintenanceMigrateAllRecordsToNewSchemaCode } from './defineTypescriptDaoMaintenanceMigrateAllRecordsToNewSchemaCode';
import { defineTypescriptDaoUpsertCode } from './defineTypescriptDaoUpsertCode';

export const defineTypescriptDaoCodeForDomainObject = ({
  domainObjectMetadata,
  supplementalQueries,
}: {
  domainObjectMetadata: DomainObjectMetadata;
  supplementalQueries: SupplementalQueryDeclaration[];
}): GeneratedCodeFile[] => {
  // define the directory name
  const daoDirectoryName = `${camelCase(domainObjectMetadata.name)}Dao`;

  // define castToDatabaseObject code
  const castToDatabaseObjectFile = new GeneratedCodeFile({
    path: [daoDirectoryName, 'castToDatabaseObject.ts'].join('/'),
    code: defineTypescriptDaoCastToDatabaseObjectCode({
      domainObjectMetadata,
      supplementalQueries,
    }),
  });

  // define castFromDatabaseObject code
  const castFromDatabaseObjectFile = new GeneratedCodeFile({
    path: [daoDirectoryName, 'castFromDatabaseObject.ts'].join('/'),
    code: defineTypescriptDaoCastFromDatabaseObjectCode({
      domainObjectMetadata,
    }),
  });

  // define the upsert file
  const upsertFile = new GeneratedCodeFile({
    path: [daoDirectoryName, 'upsert.ts'].join('/'),
    code: defineTypescriptDaoUpsertCode({
      domainObjectMetadata,
      supplementalQueries,
    }),
  });

  // define the find by uuid file
  const findByUuidFile = new GeneratedCodeFile({
    path: [daoDirectoryName, 'findByUuid.ts'].join('/'),
    code: defineTypescriptDaoFindByUuidCode({
      domainObjectMetadata,
    }),
  });

  // define the find by unique natural key file
  const findByUniqueFile = new GeneratedCodeFile({
    path: [daoDirectoryName, 'findByUnique.ts'].join('/'),
    code: defineTypescriptDaoFindByUniqueCode({
      domainObjectMetadata,
    }),
  });

  // define a file per unique reference key file // TODO; also, NOTE: if the value is nullable, then it will be a findAllBy query with the additional constraint that there can be a max of 1 if the value is not null; if field is not nullable, then it is a `findBy` query

  // define a file per supplemental query
  const filesToFindBySupplementalQueries = supplementalQueries.map(
    (query, index) =>
      new GeneratedCodeFile({
        path: [
          daoDirectoryName,
          `${defineSupplementalQueryNameFromDefinition({ query })}.ts`,
        ].join('/'),
        code: defineTypescriptDaoFindAllBySupplementalQueryCode({
          domainObjectMetadata,
          query,
          queryNumber: index + 1,
        }),
      }),
  );

  // define the index file
  const indexFile = new GeneratedCodeFile({
    path: [daoDirectoryName, 'index.ts'].join('/'),
    code: defineTypescriptDaoIndexCode({
      domainObjectMetadata,
      supplementalQueries,
    }),
  });

  // define the migration file
  const migrationFile = new GeneratedCodeFile({
    path: [
      daoDirectoryName,
      '.maintenance/migrateAllRecordsToNewSchema.ts',
    ].join('/'),
    code: defineTypescriptDaoMaintenanceMigrateAllRecordsToNewSchemaCode({
      domainObjectMetadata,
    }),
  });

  // return the generated files
  return [
    castToDatabaseObjectFile,
    castFromDatabaseObjectFile,
    upsertFile,
    findByUuidFile,
    findByUniqueFile,
    ...filesToFindBySupplementalQueries,
    indexFile,
    migrationFile,
  ];
};
