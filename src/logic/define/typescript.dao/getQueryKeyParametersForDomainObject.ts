import {
  DomainObjectMetadata,
  DomainObjectPropertyType,
} from 'domain-objects-metadata';

import { UnexpectedCodePathError } from '../../../utils/errors/UnexpectedCodePathError';
import { getTypescriptTypeForDomainObjectProperty } from './getTypescriptTypeForDomainObjectProperty';

export enum QueryKeyType {
  UNIQUE_KEY = 'uniqueKey',
  FILTER_BY_KEY = 'supplementalQuery.filterByKey',
  SORT_BY_KEY = 'supplementalQuery.sortByKey',
}

export type QueryKeyParameters = Record<string, string>;

export const getQueryKeyParametersForDomainObject = ({
  domainObjectMetadata,
  key: keyProperties,
  keyType,
}: {
  domainObjectMetadata: DomainObjectMetadata;
  key: string[];
  keyType: QueryKeyType;
}): QueryKeyParameters => {
  const parameters = keyProperties.map((key) => {
    const domainObjectProperty = domainObjectMetadata.properties[key];
    if (!domainObjectProperty)
      throw new UnexpectedCodePathError(
        `a ${keyType} '${key}' was specified but was not found as a property of the domain object '${domainObjectMetadata.name}'`,
        { domainObjectMetadata, keyType, key },
      );
    const typeOfProperty = getTypescriptTypeForDomainObjectProperty({
      domainObjectProperty,
      domainObjectName: domainObjectMetadata.name,
    });
    return {
      [domainObjectProperty.name]: typeOfProperty,
    };
  });
  return parameters.reduce((mergedConditions, thisCondition) => ({
    ...mergedConditions,
    ...thisCondition,
  })) as QueryKeyParameters;
};
