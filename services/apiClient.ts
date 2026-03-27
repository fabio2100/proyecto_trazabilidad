import { API_BASE_URL } from '@/utils/apiConfig';

export const apiPost = async <TRequest, TResponse>(
  url: string,
  data: TRequest
): Promise<TResponse> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
};
