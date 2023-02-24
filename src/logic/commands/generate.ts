import chalk from 'chalk';

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
    config.metadatas.map((metadata) => {
      // lookup the spec for this metadata
      const spec = config.specifications.find(
        (thisSpec) => thisSpec.domainObjectName === metadata.name,
      );
      if (!spec) return null; // if this metadata was not identified in a spec, thats fine. we expect metadatas to be a superset

      // if it was identified though, generate the dao
      return generateCodeForDomainObject({
        domainObjectMetadata: metadata,
        directories: config.directories,
        supplementalQueries: spec.supplementalIndexes ?? [],
      });
    }),
  );
};
