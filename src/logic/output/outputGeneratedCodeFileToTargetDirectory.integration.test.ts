import { promises as fs } from 'fs';

import { GeneratedCodeFile } from '../../domain/objects/GeneratedCodeFile';
import { outputGeneratedCodeFileToTargetDirectory } from './outputGeneratedCodeFileToTargetDirectory';

describe('outputGeneratedCodeFileToTargetDirectory', () => {
  it('should save the file correctly', async () => {
    // define the code file
    const file = new GeneratedCodeFile({
      path: 'example.tf',
      code: 'var "example" {}',
    });

    // clear the file we expect to write to
    const terraformOutputDirectory = `${__dirname}/__test_assets__/__tmp__`;
    const expectedFilePath = [terraformOutputDirectory, file.path].join('/');
    await fs.unlink(expectedFilePath).catch(() => {}); // hide errors since this will throw if file didn't exist, which is a common case

    await outputGeneratedCodeFileToTargetDirectory({
      file,
      directory: terraformOutputDirectory,
    });

    const foundContents = await fs.readFile(expectedFilePath, 'utf-8');
    expect(foundContents).toEqual(`${file.code.trim()}\n`);
  });
});
