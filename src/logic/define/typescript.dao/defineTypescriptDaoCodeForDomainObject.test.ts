import { getError } from '@ehmpathy/error-fns';
import {
  DomainObjectMetadata,
  DomainObjectPropertyType,
  DomainObjectReferenceMetadata,
  DomainObjectVariant,
} from 'domain-objects-metadata';

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
  it('can create typescript dao code for domain object with a unique key on a domain literal', async () => {
    const files = defineTypescriptDaoCodeForDomainObject({
      domainObjectMetadata: new DomainObjectMetadata({
        name: 'SeaTurtleReport',
        extends: DomainObjectVariant.DOMAIN_EVENT,
        properties: {
          forRegion: {
            name: 'forRegion',
            type: DomainObjectPropertyType.REFERENCE,
            of: new DomainObjectReferenceMetadata({
              name: 'Region',
              extends: DomainObjectVariant.DOMAIN_LITERAL,
            }),
          },
          onDate: {
            name: 'onDate',
            type: DomainObjectPropertyType.STRING,
            of: 'UniDate',
          },
          population: {
            name: 'population',
            type: DomainObjectPropertyType.NUMBER,
          },
        },
        decorations: {
          alias: null,
          primary: null,
          unique: ['forRegion'],
          updatable: [],
        },
      }),
      supplementalQueries: [
        {
          filterByKey: ['onDate'],
          sortByKey: ['forRegion'],
        },
      ],
    });
    expect(
      files.find((file) => file.path.includes('findByUnique'))?.code,
    ).toContain(
      'import { SeaTurtleReport, Region } from', // should import the referenced unique key type
    );
    expect(
      files.find((file) => file.path.includes('findByUnique'))?.code,
    ).toContain(
      `import { serialize, omitMetadataValues } from 'domain-objects';`, // should be able to serialize the referenced literal
    );
    expect(
      files.find((file) => file.path.includes('castToDatabaseObject'))?.code,
    ).toContain(
      `import { serialize, omitMetadataValues } from 'domain-objects';`, // should be able to serialize the referenced literal
    );
    expect(
      files.find((file) => file.path.includes('castToDatabaseObject'))?.code,
    ).toContain(
      'p: JSON.stringify([serialize(omitMetadataValues(object.forRegion))]),', // should serialize the referenced literal
    );
    expect(files).toMatchSnapshot();
  });

  it('should throw a helpful error if a supplemental query was requested on a unique key that is not an attribute of the dobj', () => {
    const error = getError(() =>
      defineTypescriptDaoCodeForDomainObject({
        domainObjectMetadata: getExampleDomainObjectMetadata(),
        supplementalQueries: [
          {
            filterByKey: ['temporalEntryPort'], // this key is not an attribute of the dobj
          },
        ],
      }),
    );
    expect(error.message).toContain('could not find metadata of property');
  });
  it('should throw a helpful error if a supplemental query was requested on a sort key that is not an attribute of the dobj', () => {
    const error = getError(() =>
      defineTypescriptDaoCodeForDomainObject({
        domainObjectMetadata: getExampleDomainObjectMetadata(),
        supplementalQueries: [
          {
            filterByKey: ['age'],
            sortByKey: ['averageSpeedRelativeToLight'], // this key is not an attribute of the dobj
          },
        ],
      }),
    );
    expect(error.message).toContain('could not find metadata of property');
  });
});
