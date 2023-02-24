import { promises as fs } from 'fs';
import path from 'path';

import { getExampleDomainObjectMetadata } from '../../__test_assets__/getExampleDomainObjectMetadata';
import { generateCodeForDomainObject } from './generateCodeForDomainObject';

export const listFilesInDirectoryRecursively = async (
  dir: string,
): Promise<string[]> => {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? listFilesInDirectoryRecursively(res) : res;
    }),
  );
  return Array.prototype.concat(...files);
};

describe('generateCodeForDomainObject', () => {
  it('should generate code correctly for a domain object with one unique key and no supplemental queries', async () => {
    // define the entity to create metadata for
    const domainObjectMetadata = getExampleDomainObjectMetadata();

    // clean out the directory form prior runs, if applicable
    const outputDirectory = `${__dirname}/__test_assets__/__tmp__/${domainObjectMetadata.name}`;
    await fs.rm(outputDirectory, { recursive: true, force: true });

    // generate the files
    await generateCodeForDomainObject({
      domainObjectMetadata,
      supplementalQueries: [],
      directories: {
        terraform: [outputDirectory, 'provision/terraform'].join('/'),
        dao: [outputDirectory, 'src/data/dao'].join('/'),
      },
    });

    // prove that each file was created and created accurately
    const files = await listFilesInDirectoryRecursively(outputDirectory).then(
      (paths) => paths.map((thisPath) => thisPath.replace(outputDirectory, '')),
    );
    expect(files).toContain(
      '/provision/terraform/dynamodb.table.sea_sponge.tf',
    );
    expect(files).toContain(
      '/src/data/dao/seaSpongeDao/castToDatabaseObject.ts',
    );
    expect(files).toContain(
      '/src/data/dao/seaSpongeDao/castFromDatabaseObject.ts',
    );
    expect(files).toContain('/src/data/dao/seaSpongeDao/upsert.ts');
    expect(files).toContain('/src/data/dao/seaSpongeDao/findByUuid.ts');
    expect(files).toContain('/src/data/dao/seaSpongeDao/findByUnique.ts');
    expect(files).toContain('/src/data/dao/seaSpongeDao/index.ts');
  });
  it('should generate code correctly for a domain object with one unique key and a couple supplemental queries', async () => {
    // define the entity to create metadata for
    const domainObjectMetadata = getExampleDomainObjectMetadata();

    // clean out the directory form prior runs, if applicable
    const outputDirectory = `${__dirname}/__test_assets__/__tmp__/${domainObjectMetadata.name}`;
    await fs.rm(outputDirectory, { recursive: true, force: true });

    // generate the files
    await generateCodeForDomainObject({
      domainObjectMetadata,
      supplementalQueries: [
        {
          filterByKey: ['age'],
        },
        {
          filterByKey: ['name'],
          sortByKey: ['age'],
        },
      ],
      directories: {
        terraform: [outputDirectory, 'provision/terraform'].join('/'),
        dao: [outputDirectory, 'src/data/dao'].join('/'),
      },
    });

    // prove that each file was created and created accurately
    const files = await listFilesInDirectoryRecursively(outputDirectory).then(
      (paths) => paths.map((thisPath) => thisPath.replace(outputDirectory, '')),
    );
    expect(files).toContain(
      '/provision/terraform/dynamodb.table.sea_sponge.tf',
    );
    expect(files).toContain(
      '/src/data/dao/seaSpongeDao/castToDatabaseObject.ts',
    );
    expect(files).toContain(
      '/src/data/dao/seaSpongeDao/castFromDatabaseObject.ts',
    );
    expect(files).toContain('/src/data/dao/seaSpongeDao/upsert.ts');
    expect(files).toContain('/src/data/dao/seaSpongeDao/findByUuid.ts');
    expect(files).toContain('/src/data/dao/seaSpongeDao/findByUnique.ts');
    expect(files).toContain('/src/data/dao/seaSpongeDao/findAllByAge.ts');
    expect(files).toContain(
      '/src/data/dao/seaSpongeDao/findAllByNameSortByAge.ts',
    );
    expect(files).toContain('/src/data/dao/seaSpongeDao/index.ts');
  });
});
