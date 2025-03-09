// utils/navigation.ts
const BASE_PATH = '/job-pass-v1'

export function getUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${BASE_PATH}/${cleanPath}`
}

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${BASE_PATH}/api/${cleanPath}`
}