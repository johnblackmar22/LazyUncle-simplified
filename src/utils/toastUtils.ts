import { useToast } from '@chakra-ui/react';
import type { UseToastOptions, ToastId } from '@chakra-ui/react';

export function showErrorToast(toast: ReturnType<typeof useToast>, error: unknown, options?: UseToastOptions): ToastId {
  let description = 'An unexpected error occurred.';
  if (typeof error === 'string') description = error;
  else if (error instanceof Error) description = error.message;
  else if (error && typeof error === 'object' && 'message' in error) description = (error as any).message;

  return toast({
    title: options?.title || 'Error',
    description,
    status: 'error',
    duration: options?.duration || 5000,
    isClosable: true,
    ...options,
  });
} 