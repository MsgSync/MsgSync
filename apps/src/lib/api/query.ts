export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
    } else {
      searchParams.append(key, String(value));
    }
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export function buildFilterParams(filters: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
  }

  return result;
}
