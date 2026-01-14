/**
 * API Client Utility
 * Centralized fetch wrapper with error handling, auth, and type safety
 */

type HTTPMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HTTPMethod;
  body?: any;
  headers?: Record<string, string>;
  cache?: RequestCache;
}

interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    const { method = 'GET', body, headers = {}, cache = 'no-store' } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      cache,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || data.message || 'Something went wrong',
        };
      }

      return { data };
    } catch (error: any) {
      console.error('API Error:', error);
      return {
        error: error.message || 'Network error occurred',
      };
    }
  }

  // Venues
  async getVenues(params?: { city?: string; minGuests?: number; maxPrice?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.city) queryParams.append('city', params.city);
    if (params?.minGuests) queryParams.append('minGuests', params.minGuests.toString());
    if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    
    const query = queryParams.toString();
    return this.request(`/venues${query ? `?${query}` : ''}`);
  }

  async getVenue(id: string) {
    return this.request(`/venues/${id}`);
  }

  async createVenue(data: any) {
    return this.request('/venues', { method: 'POST', body: data });
  }

  async getMyVenues() {
    return this.request('/venues/my-venues');
  }

  async updateVenue(id: string, data: any) {
    return this.request(`/venues/${id}`, { method: 'PATCH', body: data });
  }

  async deleteVenue(id: string) {
    return this.request(`/venues/${id}`, { method: 'DELETE' });
  }

  // Catering
  async getCaterers(params?: { city?: string; isPureVeg?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.city) queryParams.append('city', params.city);
    if (params?.isPureVeg !== undefined) queryParams.append('isPureVeg', params.isPureVeg.toString());
    
    const query = queryParams.toString();
    return this.request(`/catering${query ? `?${query}` : ''}`);
  }

  async getCaterer(id: string) {
    return this.request(`/catering/${id}`);
  }

  async createCaterer(data: any) {
    return this.request('/catering', { method: 'POST', body: data });
  }

  async updateCaterer(id: string, data: any) {
    return this.request(`/catering/${id}`, { method: 'PATCH', body: data });
  }

  // Bookings
  async getBookings() {
    return this.request('/bookings');
  }

  async getBooking(id: string) {
    return this.request(`/bookings/${id}`);
  }

  async createBooking(data: any) {
    return this.request('/bookings', { method: 'POST', body: data });
  }

  async confirmBooking(id: string) {
    return this.request(`/bookings/${id}/confirm`, { method: 'PATCH' });
  }

  async cancelBooking(id: string, reason?: string) {
    return this.request(`/bookings/${id}/cancel`, { 
      method: 'PATCH', 
      body: { reason } 
    });
  }

  // Reviews
  async getReviews(type: 'venue' | 'caterer', id: string) {
    return this.request(`/reviews?type=${type}&id=${id}`);
  }

  async createReview(data: any) {
    return this.request('/reviews', { method: 'POST', body: data });
  }

  // User
  async getCurrentUser() {
    return this.request('/users/me');
  }

  async updateProfile(data: any) {
    return this.request('/users/me', { method: 'PATCH', body: data });
  }

  // Wishlist
  async getWishlist() {
    return this.request('/wishlist');
  }

  async addToWishlist(data: { venueId?: string; catererId?: string }) {
    return this.request('/wishlist', { method: 'POST', body: data });
  }

  async removeFromWishlist(venueId?: string, catererId?: string) {
    const params = venueId ? `venueId=${venueId}` : `catererId=${catererId}`;
    return this.request(`/wishlist?${params}`, { method: 'DELETE' });
  }

  // Availability
  async checkAvailability(params: { venueId?: string; catererId?: string; date: string }) {
    const queryParams = new URLSearchParams();
    if (params.venueId) queryParams.append('venueId', params.venueId);
    if (params.catererId) queryParams.append('catererId', params.catererId);
    queryParams.append('date', params.date);
    return this.request(`/availability/check?${queryParams.toString()}`);
  }

  async getBlockedDates(params: { venueId?: string; catererId?: string; startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (params.venueId) queryParams.append('venueId', params.venueId);
    if (params.catererId) queryParams.append('catererId', params.catererId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    return this.request(`/availability/blocked-dates?${queryParams.toString()}`);
  }

  async blockDate(data: { venueId?: string; catererId?: string; date: string; reason?: string }) {
    return this.request('/availability/blocked-dates', { method: 'POST', body: data });
  }

  async unblockDate(id: string) {
    return this.request(`/availability/blocked-dates?id=${id}`, { method: 'DELETE' });
  }

  // Admin
  async getPendingApprovals() {
    return this.request('/admin/approvals');
  }

  async approveProperty(type: 'venue' | 'caterer', id: string) {
    return this.request(`/admin/approve/${type}/${id}`, { method: 'PATCH' });
  }

  async rejectProperty(type: 'venue' | 'caterer', id: string, reason: string) {
    return this.request(`/admin/reject/${type}/${id}`, { 
      method: 'PATCH', 
      body: { reason } 
    });
  }
}

// Export singleton instance
export const api = new APIClient();

// Export class for custom instances
export default APIClient;
