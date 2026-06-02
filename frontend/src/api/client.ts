const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333'

export interface ApiError {
  error: string
  statusCode: number
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = {
      error: `HTTP ${response.status}`,
      statusCode: response.status,
    }
    try {
      const data = await response.json()
      error.error = data.error || data.message || error.error
    } catch {
      // Ignore JSON parse errors
    }
    throw error
  }
  return response.json()
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  return handleResponse<T>(response)
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
  })
  return handleResponse<T>(response)
}

// Backward compatibility
export const apiClient = {
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  put: apiPut,
  delete: apiDelete,
}
