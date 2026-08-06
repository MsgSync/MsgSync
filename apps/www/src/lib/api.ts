// lib/api.ts
export async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseURL = process.env.NEXT_PUBLIC_PLATFORM_API_BASE || 'http://localhost:3001/api';
  const url = `${baseURL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => fetchAPI<T>(endpoint, { method: 'GET' }),
  post: <T, B = unknown>(endpoint: string, body: B) => fetchAPI<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  put: <T, B = unknown>(endpoint: string, body: B) => fetchAPI<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),
  delete: <T>(endpoint: string) => fetchAPI<T>(endpoint, { method: 'DELETE' }),
};
