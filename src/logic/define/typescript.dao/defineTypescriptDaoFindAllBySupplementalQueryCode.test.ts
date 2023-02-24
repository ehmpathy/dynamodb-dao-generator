import { getExampleDomainObjectMetadata } from '../../../__test_assets__/getExampleDomainObjectMetadata';
import { defineTypescriptDaoFindAllBySupplementalQueryCode } from './defineTypescriptDaoFindAllBySupplementalQueryCode';

describe('defineTypescriptDaoFindAllBySupplementalQueryCode', () => {
  it('should not serialize a single numeric sort key, to allow sorting numerically ("100" < "9", but 100 > 9)', () => {
    const code = defineTypescriptDaoFindAllBySupplementalQueryCode({
      domainObjectMetadata: getExampleDomainObjectMetadata(),
      query: {
        filterByKey: ['name'],
        sortByKey: ['age'],
      },
      queryNumber: 3,
    });
    expect(code).toContain(`':s3': sortArgs.age`); // should not be serialized, since we want to sort on numerical key
    expect(code).toMatchSnapshot();
  });
  it('should throw a helpful error if we want to sort on a key which is a combination of numbers and strings, because its probably not going to do what the user wants', () => {
    try {
      defineTypescriptDaoFindAllBySupplementalQueryCode({
        domainObjectMetadata: getExampleDomainObjectMetadata(),
        query: {
          filterByKey: ['name'],
          sortByKey: ['age', 'shape'],
        },
        queryNumber: 3,
      });
      throw new Error('should not have reached here');
    } catch (error: any) {
      expect(error.message).toContain(
        'The default serialization method can not be used to serialize a number, `age`, into a string while preserving numerical sort order (100 > 9, but "100" < "9"). Please specify a custom sort key serialization method if you have one.',
      );
    }
  });
});
