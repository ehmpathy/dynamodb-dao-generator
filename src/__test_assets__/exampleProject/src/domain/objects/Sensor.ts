import { DomainEntity } from 'domain-objects';

export interface Sensor {
  uuid?: string;
  createdAt?: string;
  updatedAt?: string;
  serialNumber: string;
  name: string;
  ownerUuid: string | null;
  addressUuid: string;
}
export class Sensor extends DomainEntity<Sensor> implements Sensor {
  public static unique = ['serialNumber'];
}
