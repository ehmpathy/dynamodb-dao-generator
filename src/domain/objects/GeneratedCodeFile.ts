import { DomainLiteral } from 'domain-objects';

export interface GeneratedCodeFile {
  /**
   * the relative file path that this file is expected to be created at
   * - relative to the user specified directory for this type of file
   */
  path: string;

  /**
   * the actual code that was generated
   */
  code: string;
}
export class GeneratedCodeFile
  extends DomainLiteral<GeneratedCodeFile>
  implements GeneratedCodeFile {}
