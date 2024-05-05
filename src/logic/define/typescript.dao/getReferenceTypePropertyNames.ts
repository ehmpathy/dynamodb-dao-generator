import { UnexpectedCodePathError } from '@ehmpathy/error-fns';
import {
  DomainObjectMetadata,
  DomainObjectReferenceMetadata,
} from 'domain-objects-metadata';
import { isPresent } from 'type-fns';

export const getReferenceTypePropertyNames = ({
  from: dobjMetadata,
  for: { subset: propertyNames },
}: {
  from: DomainObjectMetadata;
  for: { subset: string[] };
}) =>
  propertyNames
    .map((propertyName) => {
      const propertyMetadata = dobjMetadata.properties[propertyName];
      if (!propertyMetadata)
        throw new UnexpectedCodePathError(
          'could not find metadata of property',
          { propertyName, dobjMetadata },
        );
      if (!(propertyMetadata.of instanceof DomainObjectReferenceMetadata))
        return null;
      return { propertyName, referencedType: propertyMetadata.of.name };
    })
    .filter(isPresent);
