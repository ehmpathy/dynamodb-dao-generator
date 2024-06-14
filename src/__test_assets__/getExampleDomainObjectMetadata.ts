import {
  DomainObjectMetadata,
  DomainObjectVariant,
  DomainObjectPropertyType,
} from 'domain-objects-metadata';

export const getExampleDomainObjectMetadata = (): DomainObjectMetadata =>
  new DomainObjectMetadata({
    name: 'SeaSponge',
    extends: DomainObjectVariant.DOMAIN_ENTITY,
    properties: {
      seawaterSecurityNumber: {
        name: 'seawaterSecurityNumber',
        type: DomainObjectPropertyType.STRING,
      },
      name: {
        name: 'name',
        type: DomainObjectPropertyType.STRING,
      },
      age: {
        name: 'age',
        type: DomainObjectPropertyType.NUMBER,
      },
      shape: {
        name: 'shape',
        type: DomainObjectPropertyType.ENUM,
      },
    },
    decorations: {
      alias: null,
      primary: null,
      unique: ['seawaterSecurityNumber'], // 😄
      updatable: [],
    },
  });
