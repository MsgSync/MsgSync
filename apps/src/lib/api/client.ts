import { ApiResponse, ApiError } from './types';
import { normalizeError, ApiError as ApiErrorClass } from './errors';
import { buildQueryString } from './query';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const AUTH_TOKEN_KEY = 'msgsync_auth_token';

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.token = null;
    this.loadToken();
  }

  private loadToken(): void {
    try {
      this.token = localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      this.token = null;
    }
  }

  setToken(token: string | null): void {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch {}
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders(extraHeaders?: HeadersInit): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...Object.fromEntries(
        Object.entries(extraHeaders || {})
      ),
    };

    const authToken = this.token;
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    return headers;
  }

  private async request<T = any>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, skipAuth, ...fetchOptions } = options;

    const url = `${this.baseUrl}${path}${params ? buildQueryString(params) : ''}`;

    const config: RequestInit = {
      ...fetchOptions,
      headers: this.getHeaders(fetchOptions.headers),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new ApiErrorClass(
          data?.message || `HTTP Error: ${response.status}`,
          response.status,
          data?.code,
          data
        );
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof ApiErrorClass) throw err;
      throw normalizeError(err);
    }
  }

  async get<T = any>(path: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(path, { params });
  }

  async post<T = any>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = any>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  // Auth
  async login(token: string): Promise<void> {
    this.setToken(token);
  }

  async logout(): Promise<void> {
    this.setToken(null);
  }

  // Dashboard
  async getDashboardStats() {
    return this.get<{ data: any }>('/api/analytics/stats');
  }

  async getAnalyticsTrends() {
    return this.get<{ data: any[] }>('/api/analytics/trends');
  }

  async getVolumeByProvider() {
    return this.get<{ data: any[] }>('/api/analytics/volume-by-provider');
  }

  async getFinancials() {
    return this.get<{ data: any }>('/api/analytics/financials');
  }

  async getAnalyticsReports() {
    return this.get<{ data: any }>('/api/analytics/reports');
  }

  async getAnalyticsAlerts() {
    return this.get<{ data: any[] }>('/api/analytics/alerts');
  }

  async getLiveTraffic(limit = 100) {
    return this.get<{ data: any[] }>('/api/analytics/live-traffic', { limit });
  }

  // Messages
  async sendMessage(data: any) {
    return this.post<ApiResponse>('/api/messages', data);
  }

  async listMessages(params?: Record<string, any>) {
    return this.get<{ data: any[] }>('/api/messages', params);
  }

  async getMessageStatus(id: string) {
    return this.get<{ data: any }>(`/api/messages/${id}`);
  }

  async cancelMessage(id: string) {
    return this.delete<ApiResponse>(`/api/messages/${id}`);
  }

  // OTP
  async sendOtp(data: any) {
    return this.post<ApiResponse>('/api/otp/send', data);
  }

  async verifyOtp(data: any) {
    return this.post<ApiResponse>('/api/otp/verify', data);
  }

  // Campaigns
  async getCampaigns(params?: Record<string, any>) {
    return this.get<{ data: any[] }>('/api/bulk/campaigns', params);
  }

  async getCampaignById(id: string) {
    return this.get<{ data: any }>(`/api/bulk/campaigns/${id}`);
  }

  async createCampaign(data: any) {
    return this.post<ApiResponse>('/api/bulk/campaigns', data);
  }

  async startCampaign(id: string) {
    return this.post<ApiResponse>(`/api/bulk/campaigns/${id}/start`);
  }

  async pauseCampaign(id: string) {
    return this.post<ApiResponse>(`/api/bulk/campaigns/${id}/pause`);
  }

  async resumeCampaign(id: string) {
    return this.post<ApiResponse>(`/api/bulk/campaigns/${id}/resume`);
  }

  async deleteCampaign(id: string) {
    return this.delete<ApiResponse>(`/api/bulk/campaigns/${id}`);
  }

  async getContactLists(params?: Record<string, any>) {
    return this.get<{ data: any[] }>('/api/bulk/lists', params);
  }

  async createContactList(data: any) {
    return this.post<ApiResponse>('/api/bulk/lists', data);
  }

  async addContactsToList(listId: string, contacts: any[]) {
    return this.post<ApiResponse>(`/api/bulk/lists/${listId}/contacts`, { contacts });
  }

  // Routing
  async getRoutingRules() {
    return this.get<{ data: any[] }>('/api/routing');
  }

  async createRoutingRule(data: any) {
    return this.post<ApiResponse>('/api/routing', data);
  }

  async updateRoutingRule(id: string, data: any) {
    return this.patch<ApiResponse>(`/api/routing/${id}`, data);
  }

  async deleteRoutingRule(id: string) {
    return this.delete<ApiResponse>(`/api/routing/${id}`);
  }

  async getProviders() {
    return this.get<{ data: any[] }>('/api/routing/providers');
  }

  async getSmsGateways() {
    return this.get<{ data: any[] }>('/api/providers');
  }

  async createSmsGateway(data: any) {
    return this.post<ApiResponse>('/api/providers', data);
  }

  async updateSmsGateway(id: string, data: any) {
    return this.patch<ApiResponse>(`/api/providers/${id}`, data);
  }

  async deleteSmsGateway(id: string) {
    return this.delete<ApiResponse>(`/api/providers/${id}`);
  }

  async checkSmsGateway(id: string) {
    return this.post<ApiResponse>(`/api/providers/${id}/health`);
  }

  async testSmsGateway(id: string, recipient: string) {
    return this.post<ApiResponse>(`/api/providers/${id}/test`, { recipient });
  }

  // HLR Lookups
  async getLookup(phone: string) {
    return this.get<{ data: any }>('/api/lookups/info', { phone });
  }

  async getRecentLookups() {
    return this.get<{ data: any[] }>('/api/lookups/recent');
  }

  async getHlrConfigs() {
    return this.get<{ data: any[] }>('/api/lookups/configs');
  }

  async testHlrConfig(data: any) {
    return this.post<any>('/api/lookups/configs/test', data);
  }
  async saveHlrConfig(data: any) {
    return this.post<ApiResponse>('/api/lookups/configs', data);
  }

  // Billing & Invoices
  async getInvoices(organizationId: string) {
    return this.get<{ data: any[] }>('/api/invoices', { organizationId });
  }

  async getInvoice(id: string) {
    return this.get<{ data: any }>(`/api/invoices/${id}`);
  }

  async runInvoiceBillingCycle() {
    return this.post<ApiResponse>('/api/invoices/cycle');
  }
  async updateInvoiceStatus(id: string, status: string) {
    return this.patch<ApiResponse>(`/api/invoices/${id}/status`, { status });
  }

  // Organizations
  async getOrganization(id: string) {
    return this.get<{ data: any }>(`/api/organizations/${id}`);
  }

  async createOrganization(data: any) {
    return this.post<ApiResponse>('/api/organizations', data);
  }

  async updateOrganizationBillingSettings(id: string, data: any) {
    return this.patch<{ data: any }>(`/api/organizations/${id}/billing-settings`, data);
  }

  async assignRatePlan(organizationId: string, planId: string) {
    return this.post<ApiResponse>('/api/network/plans/assign', { organizationId, planId });
  }

  async saveRate(planId: string, data: any) {
    return this.post<ApiResponse>(`/api/network/rates/${planId}`, data);
  }
  async getSubOrganizations(organizationId: string) {
    return this.get<{ data: any[] }>(`/api/organizations/${organizationId}/sub-orgs`);
  }

  async getOrganizationReporting(organizationId: string) {
    return this.get<{ data: any }>(`/api/organizations/${organizationId}/reporting`);
  }

  async addOrganizationBalance(organizationId: string, amount: number, description: string) {
    return this.post<ApiResponse>(`/api/organizations/${organizationId}/balance`, { amount, description });
  }
  async getTransactions(organizationId: string) {
    return this.get<{ data: any[] }>(`/api/organizations/${organizationId}/transactions`);
  }

  async getContentPolicy() {
    return this.get<{ data: any }>('/api/security/content-policy');
  }

  async updateContentPolicy(data: any) {
    return this.patch<{ data: any }>('/api/security/content-policy', data);
  }

  async updateSecurityRestrictions(data: any) {
    return this.post<ApiResponse>('/api/security/restrictions', data);
  }

  // Security
  async setup2FA() {
    return this.get<{ data: any }>('/api/security/2fa/setup');
  }

  async enable2FA(data: any) {
    return this.post<ApiResponse>('/api/security/2fa/enable', data);
  }

  async disable2FA() {
    return this.post<ApiResponse>('/api/security/2fa/disable');
  }

  // Audit
  async getAuditLogs(organizationId?: string) {
    return this.get<{ data: any[] }>('/api/audit', {
      system: !organizationId ? 'true' : undefined,
      organizationId,
    });
  }

  // Current User
  async getManagedRoles() {
    return this.get<{ data: any[] }>('/api/access/roles');
  }

  async getManagedUsers() {
    return this.get<{ data: import('./types').ManagedUser[] }>('/api/access/users');
  }

  async createManagedUser(data: any) {
    return this.post<ApiResponse>('/api/access/users', data);
  }

  async updateManagedUserRole(id: string, role: string) {
    return this.patch<ApiResponse>(`/api/access/users/${id}/role`, { role });
  }

  async getCurrentUser() {
    return this.get<{ data: any }>('/api/auth/me');
  }

  // Rate Plans & Bundles
  async getRatePlans() {
    return this.get<{ data: any[] }>('/api/network/plans');
  }

  async importRates(planId: string, rates: any[]) {
    return this.post<ApiResponse>('/api/network/rates/import', { planId, rates });
  }
  async getRates(planId: string) {
    return this.get<{ data: any[] }>(`/api/network/rates/${planId}`);
  }

  async getBundles(includeInactive = false) {
    return this.get<{ data: any[] }>('/api/bundles', { includeInactive });
  }

  async createBundle(data: any) {
    return this.post<{ data: any }>('/api/bundles', data);
  }

  async updateBundle(id: string, data: any) {
    return this.patch<{ data: any }>(`/api/bundles/${id}`, data);
  }

  async subscribeToBundle(data: { organizationId: string; bundleId: string }) {
    return this.post<{ data: any }>('/api/bundles/subscribe', data);
  }

  async getBundleHistory(organizationId: string) {
    return this.get<{ data: any[] }>(`/api/bundles/organization/${organizationId}`);
  }
  async getSenderIds(orgId: string) {
    return this.get<{ data: any[] }>(`/api/network/sender-ids/${orgId}`);
  }

  async requestSenderId(data: any) {
    return this.post<ApiResponse>('/api/network/sender-ids', data);
  }

  // Branding
  async getBranding() {
    return this.get<{ data: any }>('/api/branding/config');
  }

  async updateBranding(data: any) {
    return this.patch<ApiResponse>('/api/branding/config', data);
  }

  // Alerts
  async getAlerts(organizationId: string) {
    return this.get<{ data: any[] }>('/api/analytics/alerts', { organizationId });
  }

  async saveAlert(organizationId: string, data: any) {
    return this.post<ApiResponse>('/api/analytics/alerts', { ...data, organizationId });
  }
}

export const apiClient = new ApiClient(BASE_URL);
export default apiClient;
