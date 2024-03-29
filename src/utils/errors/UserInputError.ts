/**
 * UserInput errors are used to indicate we detected invalid user input
 *
 * Purpose of having a dedicated class for this type of error is to allow us to easily add metadata about what was going on when we reached this code path
 * - e.g., the variables in memory at the time
 */
export class UserInputError extends Error {
  constructor(message: string, metadata?: Record<string, any>) {
    const fullMessage = `UserInputError: ${message}${
      metadata ? `\n\n${JSON.stringify(metadata)}` : ''
    }}`;
    super(fullMessage);
  }
}
