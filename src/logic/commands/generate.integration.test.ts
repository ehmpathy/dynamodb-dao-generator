import { getTestAssetsDir } from '../../__test_assets__/getTestAssetsDir';
import { listFilesInDirectoryRecursively } from '../generate/generateCodeForDomainObject.integration.test';
import { generate } from './generate';

describe('generate', () => {
  it('should be able to generate for example project', async () => {
    const outputDirectory = `${getTestAssetsDir()}/exampleProject/`;
    await generate({
      configPath: `${outputDirectory}/codegen.dynamodb.dao.ts`,
    });

    // prove that each file was created and created accurately
    const files = await listFilesInDirectoryRecursively(outputDirectory).then(
      (paths) => paths.map((thisPath) => thisPath.replace(outputDirectory, '')),
    );
    const expectedFiles = [
      'provision/aws/product/dynamodb.table.address.tf',
      'provision/aws/product/dynamodb.table.sensor.tf',
      'src/data/dao/addressDao/.maintenance/migrateAllRecordsToNewSchema.ts',
      'src/data/dao/addressDao/castFromDatabaseObject.ts',
      'src/data/dao/addressDao/castToDatabaseObject.ts',
      'src/data/dao/addressDao/findAllByCityAndState.ts',
      'src/data/dao/addressDao/findAllByPostal.ts',
      'src/data/dao/addressDao/findByUnique.ts',
      'src/data/dao/addressDao/findByUuid.ts',
      'src/data/dao/addressDao/index.ts',
      'src/data/dao/addressDao/upsert.ts',
      'src/data/dao/sensorDao/.maintenance/migrateAllRecordsToNewSchema.ts',
      'src/data/dao/sensorDao/castFromDatabaseObject.ts',
      'src/data/dao/sensorDao/castToDatabaseObject.ts',
      'src/data/dao/sensorDao/findAllByAddressUuid.ts',
      'src/data/dao/sensorDao/findAllByOwnerUuidSortByCreatedAt.ts',
      'src/data/dao/sensorDao/findByUnique.ts',
      'src/data/dao/sensorDao/findByUuid.ts',
      'src/data/dao/sensorDao/index.ts',
      'src/data/dao/sensorDao/upsert.ts',
    ];
    expectedFiles.forEach((expectedFile) =>
      expect(files).toContain(expectedFile),
    );
  });
});
