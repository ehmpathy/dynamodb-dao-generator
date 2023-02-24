import {
  DeclaredDaoSpecification,
  DeclaredDomainObjectIntrospectionPaths,
  DeclaredOutputDirectories,
} from '../../logic/config/readConfig';
import { Sensor, Address } from './src/domain';

export const introspect: DeclaredDomainObjectIntrospectionPaths = [
  './src/domain/index.ts',
];

export const directories: DeclaredOutputDirectories = {
  terraform: `provision/aws/product`,
  dao: `src/data/dao`,
};

export const specifications: DeclaredDaoSpecification[] = [
  {
    domainObjectName: Sensor.name,
    supplementalIndexes: [
      { filterByKey: ['addressUuid'] },
      { filterByKey: ['ownerUuid'], sortByKey: ['createdAt'] },
    ],
  },
  {
    domainObjectName: Address.name,
    supplementalIndexes: [
      { filterByKey: ['city', 'state'] },
      { filterByKey: ['postal'] },
    ],
  },
];
