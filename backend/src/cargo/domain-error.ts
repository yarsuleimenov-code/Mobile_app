export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly httpStatus: number,
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
