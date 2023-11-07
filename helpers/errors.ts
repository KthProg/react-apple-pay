export const isError = (error: unknown): error is Error => {
  return error !== null && typeof error === 'object' && 'message' in error;
};