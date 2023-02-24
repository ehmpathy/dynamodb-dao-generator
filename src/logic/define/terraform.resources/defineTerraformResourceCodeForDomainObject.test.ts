import { getExampleDomainObjectMetadata } from '../../../__test_assets__/getExampleDomainObjectMetadata';
import { defineTerraformResourceCodeForDomainObject } from './defineTerraformResourceCodeForDomainObject';

describe('defineTerraformResourceDefinitionsForDomainObject', () => {
  it('should be able to declare the resource definitions for a domain object with no supplemental queries', async () => {
    const domainObjectMetadata = getExampleDomainObjectMetadata();
    const file = await defineTerraformResourceCodeForDomainObject({
      domainObjectMetadata,
      supplementalQueries: [],
    });
    expect(file).toMatchSnapshot();
  });
  it('should be able to declare the resource definitions for a domain object with supplemental queries', async () => {
    const domainObjectMetadata = getExampleDomainObjectMetadata();
    const file = await defineTerraformResourceCodeForDomainObject({
      domainObjectMetadata,
      supplementalQueries: [
        {
          filterByKey: ['age'],
        },
        {
          filterByKey: ['name'],
          sortByKey: ['shape'],
        },
      ],
    });
    expect(file).toMatchSnapshot();
  });
  it('should be able to declare a numerical sort key for a supplemental query who sorts on a single numerical property', async () => {
    const domainObjectMetadata = getExampleDomainObjectMetadata();
    const file = await defineTerraformResourceCodeForDomainObject({
      domainObjectMetadata,
      supplementalQueries: [
        {
          filterByKey: ['name'],
          sortByKey: ['age'],
        },
      ],
    });
    expect(file.code).toContain('type = "N"');
    expect(file).toMatchSnapshot();
  });
});
