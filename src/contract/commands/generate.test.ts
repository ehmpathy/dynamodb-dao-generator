import { generate } from '../../logic/commands/generate';
import SqlCodeGenerator from './generate';

jest.mock('../../logic/commands/generate');
const generateMock = generate as jest.Mock;

describe('generate', () => {
  it('should call the generate command logic', async () => {
    await SqlCodeGenerator.run([
      '-c',
      `${__dirname}/../__test_assets__/exampleProject/codegen.sql.dao.yml`,
    ]);
    expect(generateMock).toBeCalledTimes(1);
    expect(generateMock).toHaveBeenCalledWith({
      configPath: `${__dirname}/../__test_assets__/exampleProject/codegen.sql.dao.yml`,
    });
  });
});
