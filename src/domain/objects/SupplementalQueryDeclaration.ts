import { DomainValueObject } from 'domain-objects';

/**
 * declares a supplemental query that should be available on the dao for a domain object
 */
export interface SupplementalQueryDeclaration {
  /**
   * specifies the properties that make up the key to filter on in the query
   */
  filterByKey: string[];

  /**
   * specifies the properties that make up the key to sort on in the query
   */
  sortByKey?: string[];
}
export class SupplementalQueryDeclaration
  extends DomainValueObject<SupplementalQueryDeclaration>
  implements SupplementalQueryDeclaration {}
