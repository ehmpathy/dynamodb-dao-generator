import { DomainObjectMetadata } from 'domain-objects-metadata';

import { UnexpectedCodePathError } from '../../utils/errors/UnexpectedCodePathError';
import { DeclaredDaoSpecification, readConfig } from '../config/readConfig';
import { generateCodeForDomainObject } from '../generate/generateCodeForDomainObject';
import { generate } from './generate';

jest.mock('../config/readConfig');
const readConfigMock = readConfig as jest.Mock;

jest.mock('../generate/generateCodeForDomainObject');
const generateCodeForDomainObjectMock =
  generateCodeForDomainObject as jest.Mock;

describe('generate', () => {
  it('should throw a helpful error if the introspected domain objects do not include one specified in the config', async () => {
    // mock a config with a specified dobj that was not instrospected
    const exampleConfig: {
      metadatas: DomainObjectMetadata[];
      specifications: DeclaredDaoSpecification[];
    } = {
      metadatas: [],
      specifications: [{ domainObjectName: 'Sensor', supplementalIndexes: [] }],
    };
    readConfigMock.mockResolvedValue(exampleConfig);

    // run the request
    try {
      await generate({ configPath: '__config_path__' });
      throw new UnexpectedCodePathError('should not reach here');
    } catch (error) {
      // prove that it threw a helpful error
      expect(error.message).toContain(
        'could not find domain object metadata for specified domain object name. are you sure your introspection paths import or declare this domain object?',
      );
      expect(error).toMatchSnapshot();
    }

    // prove that it never succeeded
    expect(generateCodeForDomainObjectMock).not.toHaveBeenCalled();
  });
});
