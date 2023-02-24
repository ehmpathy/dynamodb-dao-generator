import { QueryKeyParameters } from './getQueryKeyParametersForDomainObject';

export const getTypescriptTypeForQueryParameters = (
  parameters: QueryKeyParameters,
) =>
  `{ ${Object.entries(parameters)
    .map(([key, type]) => `${key}: ${type};`)
    .join('\n')} }`;
