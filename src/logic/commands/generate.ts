import chalk from 'chalk';

import { UnexpectedCodePathError } from '../../utils/errors/UnexpectedCodePathError';
import { readConfig } from '../config/readConfig';
import { generateCodeForDomainObject } from '../generate/generateCodeForDomainObject';

export const generate = async ({ configPath }: { configPath: string }) => {
  // read the declarations from config
  console.log(
    `${chalk.bold(
      '\n🔎 Loading domain objects:',
    )} using domain-objects-metadata...`,
  ); // tslint:disable-line no-console
  const config = await readConfig({ configPath });

  // output the sql-schema-generator entities
  console.log(
    `${chalk.bold(
      '\n🏗️️  Generating the dao:',
    )} methods, casters, terraform, and named exports...\n`,
  );
  await Promise.all(
    config.specifications.map((spec) => {
      // lookup the spec for this metadata
      const metadata = config.metadatas.find(
        (thisMetadata) => spec.domainObjectName === thisMetadata.name,
      );
      if (!metadata)
        throw new UnexpectedCodePathError(
          'could not find domain object metadata for specified domain object name. are you sure your introspection paths import or declare this domain object?',
          { domainObjectName: spec.domainObjectName },
        );

      // if it was identified though, generate the dao
      return generateCodeForDomainObject({
        domainObjectMetadata: metadata,
        directories: config.directories,
        supplementalQueries: spec.supplementalIndexes ?? [],
      });
    }),
  );
};
