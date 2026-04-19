import { queryClient } from "./queryClient";

async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(data.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getClients: () => apiRequest('/api/clients'),
  createClient: (data: any) => apiRequest('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
  getClient: (id: string) => apiRequest(`/api/clients/${id}`),
  updateClient: (id: string, data: any) => apiRequest(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteClient: (id: string) => apiRequest(`/api/clients/${id}`, { method: 'DELETE' }),

  getClientData: (id: string) => apiRequest(`/api/clients/${id}/data`),

  addShareholder: (clientId: string, data: any) => apiRequest(`/api/clients/${clientId}/shareholders`, { method: 'POST', body: JSON.stringify(data) }),
  deleteShareholder: (id: string) => apiRequest(`/api/shareholders/${id}`, { method: 'DELETE' }),
  updateShareholder: (id: string, data: any) => apiRequest(`/api/shareholders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateOwnership: (clientId: string, data: any) => apiRequest(`/api/clients/${clientId}/ownership`, { method: 'PATCH', body: JSON.stringify(data) }),

  addEmployee: (clientId: string, data: any) => apiRequest(`/api/clients/${clientId}/employees`, { method: 'POST', body: JSON.stringify(data) }),
  deleteEmployee: (id: string) => apiRequest(`/api/employees/${id}`, { method: 'DELETE' }),

  addTrainingProgram: (clientId: string, data: any) => apiRequest(`/api/clients/${clientId}/training-programs`, { method: 'POST', body: JSON.stringify(data) }),
  deleteTrainingProgram: (id: string) => apiRequest(`/api/training-programs/${id}`, { method: 'DELETE' }),

  addSupplier: (clientId: string, data: any) => apiRequest(`/api/clients/${clientId}/suppliers`, { method: 'POST', body: JSON.stringify(data) }),
  deleteSupplier: (id: string) => apiRequest(`/api/suppliers/${id}`, { method: 'DELETE' }),
  updateProcurement: (clientId: string, tmps: number) => apiRequest(`/api/clients/${clientId}/procurement`, { method: 'PATCH', body: JSON.stringify({ tmps }) }),

  addEsdContribution: (clientId: string, data: any) => apiRequest(`/api/clients/${clientId}/esd-contributions`, { method: 'POST', body: JSON.stringify(data) }),
  deleteEsdContribution: (id: string) => apiRequest(`/api/esd-contributions/${id}`, { method: 'DELETE' }),

  addSedContribution: (clientId: string, data: any) => apiRequest(`/api/clients/${clientId}/sed-contributions`, { method: 'POST', body: JSON.stringify(data) }),
  deleteSedContribution: (id: string) => apiRequest(`/api/sed-contributions/${id}`, { method: 'DELETE' }),

  addScenario: (clientId: string, data: any) => apiRequest(`/api/clients/${clientId}/scenarios`, { method: 'POST', body: JSON.stringify(data) }),
  deleteScenario: (id: string) => apiRequest(`/api/scenarios/${id}`, { method: 'DELETE' }),

  addFinancialYear: (clientId: string, data: any) => apiRequest(`/api/clients/${clientId}/financial-years`, { method: 'POST', body: JSON.stringify(data) }),
  deleteFinancialYear: (id: string) => apiRequest(`/api/financial-years/${id}`, { method: 'DELETE' }),

  logExport: (data: any) => apiRequest('/api/export-log', { method: 'POST', body: JSON.stringify(data) }),
  getExportLogs: (clientId: string) => apiRequest(`/api/clients/${clientId}/export-logs`),
};

export function invalidateClientData(clientId: string) {
  queryClient.invalidateQueries({ queryKey: ['client-data', clientId] });
}
