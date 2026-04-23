import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handleFirestoreError(error: any, operationType: string, path: string | null = null) {
  console.error(`Firestore Error [${operationType}] at ${path}:`, error);
  // Optional: throw detailed error info as per instructions if needed for a specific debugging UI
}
