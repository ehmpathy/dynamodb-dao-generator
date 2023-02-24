import { DomainObject } from 'domain-objects';
import { DomainObjectMetadata, introspect } from 'domain-objects-metadata';

import { SupplementalQueryDeclaration } from '../../domain/objects/SupplementalQueryDeclaration';
import { UserInputError } from '../../utils/errors/UserInputError';
import { getDirOfPath } from '../../utils/filepaths/getDirOfPath';

/**
 * declares the path that should be introspected in order to find a superset of all of the domain objects we'll need metadata for
 */
export type DeclaredDomainObjectIntrospectionPaths = string[];

/**
 * the directories to output the generated dao to
 */
export interface DeclaredOutputDirectories {
  dao: string;
  terraform: string;
}

/**
 * the specification by which to generate each dao with
 */
export interface DeclaredDaoSpecification {
  domainObjectName: DomainObject<any>;
  supplementalIndexes?: SupplementalQueryDeclaration[];
}

export const readConfig = async ({
  configPath,
}: {
  configPath: string;
}): Promise<{
  metadatas: DomainObjectMetadata[];
  directories: DeclaredOutputDirectories;
  specifications: DeclaredDaoSpecification[];
}> => {
  const configDir = getDirOfPath(configPath);
  const getAbsolutePathFromRelativeToConfigPath = (relpath: string) =>
    `${configDir}/${relpath}`;

  try {
    const config = await import(configPath);
    if (!config.introspect)
      throw new UserInputError('no introspect key was exported from config');
    if (!config.directories)
      throw new UserInputError('no directories key was exported from config');
    if (!config.specifications)
      throw new UserInputError(
        'no specifications key was exported from config',
      );
    const metadatas: DomainObjectMetadata[] = (
      await Promise.all(
        config.introspect.map((path: string) =>
          introspect(getAbsolutePathFromRelativeToConfigPath(path)),
        ),
      )
    ).flat();
    return {
      metadatas,
      directories: {
        dao: getAbsolutePathFromRelativeToConfigPath(config.directories.dao),
        terraform: getAbsolutePathFromRelativeToConfigPath(
          config.directories.terraform,
        ),
      },
      specifications: config.specifications,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};
