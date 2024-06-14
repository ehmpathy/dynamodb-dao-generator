import { DomainLiteral } from 'domain-objects';

export interface Address {
  uuid?: string;
  createdAt?: string;
  updatedAt?: string;
  city: string | null;
  state: string;
  country: string;
  postal: string;
}
export class Address extends DomainLiteral<Address> implements Address {
  public static unique = ['city', 'state', 'country', 'postal']; // TODO: fix dynamodb-dao-generator so it understands that domain-literals are unique on all non-metadata keys
}
