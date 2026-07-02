import { API_BASE_URL } from '@/utils/apiConfig';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const apiPost = async <TRequest, TResponse>(
  url: string,
  data: TRequest
): Promise<TResponse> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
};
