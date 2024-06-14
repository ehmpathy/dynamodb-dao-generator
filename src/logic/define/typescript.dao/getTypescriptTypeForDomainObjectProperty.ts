import { BadRequestError } from '@ehmpathy/error-fns';
import { DomainLiteral } from 'domain-objects';
import {
  DomainObjectPropertyMetadata,
  DomainObjectPropertyType,
  DomainObjectReferenceMetadata,
  DomainObjectVariant,
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
    if (
      domainObjectProperty.type === DomainObjectPropertyType.REFERENCE &&
      domainObjectProperty.of instanceof DomainObjectReferenceMetadata
    ) {
      // sanity check that the caller is following persistance best practices
      if (
        domainObjectProperty.of.extends !== DomainObjectVariant.DOMAIN_LITERAL
      )
        throw new BadRequestError(
          'domain objects should only have domain-literals as nested properties. references to different variants of domain objects should be done via lookup keys, primary or unique.',
          {
            domainObjectName,
            domainObjectPropertyName: domainObjectProperty.name,
            domainObjectProperty,
          },
        );

      // return a reference to the domain object's type, its name
      return domainObjectProperty.of.name;
    }
    throw new UnexpectedCodePathError(
      'unsupported property type. could not get typescript type for domain object property',
      {
        domainObjectName,
        domainObjectPropertyName: domainObjectProperty.name,
        domainObjectProperty,
      },
    ); // fail fast
  })();

  // check for modifiers
  const isNullable = !!domainObjectProperty.nullable;

  // return the result
  return isNullable ? `${type} | null` : type;
};
