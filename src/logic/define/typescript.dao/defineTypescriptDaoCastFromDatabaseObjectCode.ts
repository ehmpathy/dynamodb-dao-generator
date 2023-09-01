import { DomainObjectMetadata } from 'domain-objects-metadata';

import { getPackageVersion } from '../../../utils/getPackageVersion';

export const defineTypescriptDaoCastFromDatabaseObjectCode = ({
  domainObjectMetadata,
}: {
  domainObjectMetadata: DomainObjectMetadata;
}): string => {
  // define the code
  const code = `
import { HasMetadata } from 'type-fns';

import { ${domainObjectMetadata.name} } from '../../../domain';

/**
 * defines how to cast a database-object to a domain-object
 *
 * written by dynamodb-dao-generator 🦾
 */
export const castFromDatabaseObject = (item: any) => {
  // parse the item into an object
  const parsedObject = JSON.parse(item.o);

  // add defaults for backwards compatibility, if needed (e.g., for objects created before adding or changing fields)
  const updatedObject = {
    ...parsedObject,
  };

  // create the new object
  return new ${domainObjectMetadata.name}(updatedObject) as HasMetadata<${domainObjectMetadata.name}>;
};
  `;

  // define the code
  return code;
};
