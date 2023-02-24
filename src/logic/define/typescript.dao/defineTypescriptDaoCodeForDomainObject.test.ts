import { getExampleDomainObjectMetadata } from '../../../__test_assets__/getExampleDomainObjectMetadata';
import { defineTypescriptDaoCodeForDomainObject } from './defineTypescriptDaoCodeForDomainObject';

describe('defineTypescriptDaoCodeForDomainObject', () => {
  it('can create typescript dao code for domain object with no supplemental queries', async () => {
    const file = defineTypescriptDaoCodeForDomainObject({
      domainObjectMetadata: getExampleDomainObjectMetadata(),
      supplementalQueries: [],
    });
    expect(file).toMatchSnapshot();
  });
  it('can create typescript dao code for domain object with some supplemental queries', async () => {
    const file = defineTypescriptDaoCodeForDomainObject({
      domainObjectMetadata: getExampleDomainObjectMetadata(),
      supplementalQueries: [
        {
          filterByKey: ['age'],
        },
        {
          filterByKey: ['name'],
          sortByKey: ['shape'],
        },
        {
          filterByKey: ['name'],
          sortByKey: ['age'],
        },
      ],
    });
    expect(file).toMatchSnapshot();
  });
});
