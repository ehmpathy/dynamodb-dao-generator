# dynamodb-dao-generator

Generate data-access-objects from your domain-objects.

Generates type definitions, query functions, terraform resources, and bundles it all up into daos with a single command!

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/dynamodb-dao-generator.svg)](https://npmjs.org/package/dynamodb-dao-generator)
[![Codecov](https://codecov.io/gh/uladkasach/dynamodb-dao-generator/branch/master/graph/badge.svg)](https://codecov.io/gh/uladkasach/dynamodb-dao-generator)
[![Downloads/week](https://img.shields.io/npm/dw/dynamodb-dao-generator.svg)](https://npmjs.org/package/dynamodb-dao-generator)
[![License](https://img.shields.io/npm/l/dynamodb-dao-generator.svg)](https://github.com/uladkasach/dynamodb-dao-generator/blob/master/package.json)

# Table of Contents
<!-- toc -->
- [Goals](#goals)
- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
  - [`dynamodb-dao-generator generate`](#dynamodb-dao-generator-generate)
  - [`dynamodb-dao-generator help [COMMAND]`](#dynamodb-dao-generator-help-command)
- [Contribution](#contribution)
<!-- tocstop -->

# Goals

The goal of `dynamodb-dao-generator` is to use the `domain-objects` you've already defined in order to speed up development and eliminate errors.

Powered by:
- extracting the domain information you've already encoded in your [domain-objects](https://github.com/uladkasach/domain-objects) using [domain-objects-metadata](https://github.com/uladkasach/domain-objects-metadata).

This enables:
- creating a fully functional data-access-object, using best practices, simply by defining your [`domain-objects`](https://github.com/uladkasach/domain-objects)
- easily extending your generated data-access-objects, because you control the code completely
- instantly leveraging the best practices and safety features finetuned against countless deployments in production

Like an ORM, but without any magic or limitations - the code is in your hands and ready to mod as needed.

# Installation

## 1. Save the package as a dev dependency
  ```sh
  npm install --save-dev dynamodb-dao-generator
  ```

## 2. Define a config file

This file will define which `domain-objects` you want to generate `data-access-objects` for

For example:
```ts
// codegen.dao.dynamodb.ts

import { Sensor, Location } from 'src/domain';

export const directories = {
  terraform: `${__dirname}/provision/aws/product`,
  dao: `${__dirname}/src/data/dao`,
};

export const generateFor = [
  {
    domainObject: Sensor,
    supplementalIndexes: [
      { filterByKeys: ['locationUuid'] },
      { filterByKeys: ['ownerUuid'], sortByKeys: ['createdAt'] },
    ]
  },
  {
    domainObject: Location,
    supplementalIndexes: [
      { filterByKeys: ['city', 'state'] },
      { filterByKeys: ['postalCode'] },
    ]
  }
]
```

## 3. Test it out!
```
  $ npx dynamodb-dao-generator version
  $ npx dynamodb-dao-generator generate
```

# Examples

### a domain object dao

**Input:** Say you have the following domain object

```ts
export interface Geocode {
  id?: number;
  latitude: number;
  longitude: number;
}
export class Geocode extends DomainValueObject<Geocode> implements Geocode {}
```

**Output:** Running this dynamodb-dao-generator on this domain object will:

1. generate the dao files
    1. `src/data/dao/geocodeDao/index.ts`
    2. `src/data/dao/geocodeDao/findByUuid.ts`
    3. `src/data/dao/geocodeDao/findByUnique.ts`
    4. `src/data/dao/geocodeDao/castToDatabaseObject.ts`
    5. `src/data/dao/geocodeDao/castFromDatabaseObject.ts`
    6. `src/data/dao/geocodeDao/.maintenance/migrateAllRecordsToNewSchema.ts`

2. generate the terraform table provisioning file
    1. `provision/aws/product/dynamodb.table.geocode.tf`


# Commands
<!-- commands -->
* [`dynamodb-dao-generator generate`](#dynamodb-dao-generator-generate)
* [`dynamodb-dao-generator help [COMMAND]`](#dynamodb-dao-generator-help-command)

## `dynamodb-dao-generator generate`

generate data-access-objects by parsing domain-objects

```
USAGE
  $ dynamodb-dao-generator generate

OPTIONS
  -c, --config=config  (required) [default: codegen.sql.dao.yml] path to config yml
  -h, --help           show CLI help
```

_See code: [dist/contract/commands/generate.ts](https://github.com/uladkasach/dynamodb-dao-generator/blob/v0.0.0/dist/contract/commands/generate.ts)_

## `dynamodb-dao-generator help [COMMAND]`

display help for dynamodb-dao-generator

```
USAGE
  $ dynamodb-dao-generator help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_
<!-- commandsstop -->


# Contribution

Team work makes the dream work! Please create a ticket for any features you think are missing and, if willing and able, draft a PR for the feature :)
