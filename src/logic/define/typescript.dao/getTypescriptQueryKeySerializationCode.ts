import { UnexpectedCodePathError } from '@ehmpathy/error-fns';
import {
  DomainObjectMetadata,
  DomainObjectPropertyType,
  DomainObjectReferenceMetadata,
} from 'domain-objects-metadata';
import { isPresent } from 'type-fns';

import { QueryKeyType } from './getQueryKeyParametersForDomainObject';
import { getReferenceTypePropertyNames } from './getReferenceTypePropertyNames';

export const getTypescriptQueryKeySerializationCode = ({
  domainObjectMetadata,
  key: keyProperties,
  keyType,
  sourceObjectName,
}: {
  domainObjectMetadata: DomainObjectMetadata;
  key: string[];
  keyType: QueryKeyType;
  sourceObjectName: string;
}) => {
  // if this is for a sort key, do a couple of special operations to ensure we can use it for sorting safely
  if (keyType === QueryKeyType.SORT_BY_KEY) {
    // determine if any of the keys are numbers
    const anyKeyIsNumber = keyProperties.some(
      (key) =>
        domainObjectMetadata.properties[key]!.type ===
        DomainObjectPropertyType.NUMBER,
    );
    const allKeysAreNumbers = keyProperties.every(
      (key) =>
        domainObjectMetadata.properties[key]!.type ===
        DomainObjectPropertyType.NUMBER,
    );
    const numberKeys = keyProperties.filter(
      (key) =>
        domainObjectMetadata.properties[key]!.type ===
        DomainObjectPropertyType.NUMBER,
    );

    // if there's only one key and its a number, then use it without serialization, to preserve numerical sorting (100 > 9, but "100" < "9")
    if (keyProperties.length === 1 && allKeysAreNumbers)
      return `${sourceObjectName}.${keyProperties[0]}`;

    // if theres a numeric key but not all are numeric, warn the user that this is an unsafe operation
    if (anyKeyIsNumber && !allKeysAreNumbers)
      throw new Error(
        `The default serialization method can not be used to serialize a number, \`${numberKeys.join(
          ',',
        )}\`, into a string while preserving numerical sort order (100 > 9, but "100" < "9"). Please specify a custom sort key serialization method if you have one.`,
      );
  }

  // determine whether any of the keys are nested domain.value-objects, since they require extra serialization
  const keyPropertiesOfTypeReferenceToSerialize = getReferenceTypePropertyNames(
    {
      from: domainObjectMetadata,
      for: { subset: keyProperties },
    },
  ).map(({ propertyName }) => propertyName);

  // json stringify it, so that things like `null` are stringified correctly
  return `JSON.stringify([${keyProperties
    .map((key) =>
      keyPropertiesOfTypeReferenceToSerialize.includes(key)
        ? `serialize(omitMetadataValues(${sourceObjectName}.${key}))` // if we should serialize this dobj, do so
        : `${sourceObjectName}.${key}`,
    )
    .join(', ')}])`;
};
