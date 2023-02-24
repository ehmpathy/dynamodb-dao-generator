import { DomainObjectMetadata } from 'domain-objects-metadata';

import { getTestAssetsDir } from '../../__test_assets__/getTestAssetsDir';
import { readConfig } from './readConfig';

describe('readConfig', () => {
  it('should be able to read example config', async () => {
    const config = await readConfig({
      configPath: `${getTestAssetsDir()}/exampleProject/codegen.dynamodb.dao.ts`,
    });
    expect(config).toHaveProperty('metadatas');
    expect(config.metadatas[0]).toBeInstanceOf(DomainObjectMetadata);
    expect(config).toHaveProperty('directories');
    expect(config).toHaveProperty('specifications');
  });
});
