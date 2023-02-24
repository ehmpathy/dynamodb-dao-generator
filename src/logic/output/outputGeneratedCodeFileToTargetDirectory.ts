import { promises as fs } from 'fs';

import { GeneratedCodeFile } from '../../domain/objects/GeneratedCodeFile';

export const outputGeneratedCodeFileToTargetDirectory = async ({
  file,
  directory,
}: {
  file: GeneratedCodeFile;
  directory: string;
}) => {
  // define the full path to file
  const fullPath = [directory, file.path].join('/');

  // ensure the directory being written to exists
  const fullDirectory = fullPath.split('/').slice(0, -1).join('/');
  await fs.mkdir(fullDirectory, { recursive: true });

  // write the file to the directory
  await fs.writeFile(fullPath, `${file.code.trim()}\n`, 'utf-8');
};
