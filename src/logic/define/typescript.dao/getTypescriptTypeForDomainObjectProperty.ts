import {
  DomainObjectPropertyMetadata,
  DomainObjectPropertyType,
} from 'domain-objects-metadata';

import { UnexpectedCodePathError } from '../../../utils/errors/UnexpectedCodePathError';

export const getTypescriptTypeForDomainObjectProperty = ({
  domainObjectName,
  domainObjectProperty,
}: {
  domainObjectName: string;
  domainObjectProperty: DomainObjectPropertyMetadata;
}) => {
  // define the base type
  const type = (() => {
    if (domainObjectProperty.type === DomainObjectPropertyType.STRING)
      return 'string';
    if (domainObjectProperty.type === DomainObjectPropertyType.NUMBER)
      return 'number';
    if (domainObjectProperty.type === DomainObjectPropertyType.BOOLEAN)
      return 'boolean';
    if (domainObjectProperty.type === DomainObjectPropertyType.DATE)
      return 'Date';
    if (domainObjectProperty.type === DomainObjectPropertyType.ENUM)
      return `${domainObjectName}['${domainObjectProperty.name}']`;
    throw new UnexpectedCodePathError(
      'unsupported property type. could not get typescript type for domain object property',
      {
        domainObjectName,
        domainObjectPropertyName: domainObjectProperty.name,
      },
    ); // fail fast
  })();

  // check for modifiers
  const isNullable = !!domainObjectProperty.nullable;

  // return the result
  return isNullable ? `${type} | null` : type;
};
