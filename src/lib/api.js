const API_BASE = '/api';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error('API no disponible.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo completar la operacion.');
  }

  return data;
};

export const api = {
  getCatalog: () => request('/catalog'),
  getOrders: () => request('/orders'),
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  createProduct: (payload) =>
    request('/products', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateProduct: (id, payload) =>
    request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteProduct: (id) =>
    request(`/products/${id}`, {
      method: 'DELETE'
    }),
  createCategory: (payload) =>
    request('/categories', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateCategory: (id, payload) =>
    request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  toggleCategory: (id, payload) =>
    request(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  createOrder: (payload) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateOrder: (id, payload) =>
    request(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })
};
