import { DomainObjectMetadata } from 'domain-objects-metadata';

import { SupplementalQueryDeclaration } from '../../domain/objects/SupplementalQueryDeclaration';
import { defineTerraformResourceCodeForDomainObject } from '../define/terraform.resources/defineTerraformResourceCodeForDomainObject';
import { defineTypescriptDaoCodeForDomainObject } from '../define/typescript.dao/defineTypescriptDaoCodeForDomainObject';
import { outputGeneratedCodeFileToTargetDirectory } from '../output/outputGeneratedCodeFileToTargetDirectory';

export const generateCodeForDomainObject = async ({
  domainObjectMetadata,
  supplementalQueries,
  directories,
}: {
  domainObjectMetadata: DomainObjectMetadata;
  supplementalQueries: SupplementalQueryDeclaration[];
  directories: {
    terraform: string;
    dao: string;
  };
}) => {
  // define the terraform code
  const terraformCode = defineTerraformResourceCodeForDomainObject({
    domainObjectMetadata,
    supplementalQueries,
  });

  // define the typescript code
  const typescriptCode = defineTypescriptDaoCodeForDomainObject({
    domainObjectMetadata,
    supplementalQueries,
  });

  // output all of the files
  await outputGeneratedCodeFileToTargetDirectory({
    file: terraformCode,
    directory: directories.terraform,
  });
  await Promise.all(
    typescriptCode.map((file) =>
      outputGeneratedCodeFileToTargetDirectory({
        file,
        directory: directories.dao,
      }),
    ),
  );
};
