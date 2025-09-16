/**
 * Optimized API Client with Caching and Request Deduplication
 */

import { CacheMonitor } from './performance'

// FIXED: Enhanced API client with better error handling and caching
export class ApiClient {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private static pendingRequests = new Map<string, Promise<any>>()
  private static defaultTTL = 5 * 60 * 1000 // 5 minutes

  private static getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  private static isCacheValid(entry: { data: any; timestamp: number; ttl: number }): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  private static async makeRequest<T>(
    url: string, 
    options: RequestInit = {}, 
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cacheKey = this.getCacheKey(url, options)
    const method = options.method || 'GET'

    // Check cache for GET requests
    if (method === 'GET') {
      const cached = this.cache.get(cacheKey)
      if (cached && this.isCacheValid(cached)) {
        CacheMonitor.recordHit(cacheKey)
        return cached.data
      }
    }

    // Check for pending requests to avoid duplicate calls
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!
    }

    // Create new request
    const requestPromise = this.executeRequest<T>(url, options, cacheKey, ttl)
    this.pendingRequests.set(cacheKey, requestPromise)

    try {
      const result = await requestPromise
      return result
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  private static async executeRequest<T>(
    url: string, 
    options: RequestInit, 
    cacheKey: string, 
    ttl: number
  ): Promise<T> {
    const method = options.method || 'GET'

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Cache successful GET requests
      if (method === 'GET' && data.success) {
        this.cache.set(cacheKey, {
          data: data.data,
          timestamp: Date.now(),
          ttl
        })
        CacheMonitor.recordHit(cacheKey)
      } else {
        CacheMonitor.recordMiss(cacheKey)
      }

      return data
    } catch (error) {
      CacheMonitor.recordMiss(cacheKey)
      throw error
    }
  }

  // FIXED: Public API methods with proper TypeScript types
  static async get<T>(url: string, ttl?: number): Promise<T> {
    return this.makeRequest<T>(url, { method: 'GET' }, ttl)
  }

  static async post<T>(url: string, data?: any, ttl?: number): Promise<T> {
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }, ttl)
  }

  static async put<T>(url: string, data?: any, ttl?: number): Promise<T> {
    return this.makeRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }, ttl)
  }

  static async delete<T>(url: string, ttl?: number): Promise<T> {
    return this.makeRequest<T>(url, { method: 'DELETE' }, ttl)
  }

  // FIXED: Cache management methods
  static invalidate(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const [key] of Array.from(this.cache.entries())) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  static clearCache(): void {
    this.cache.clear()
  }

  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  // FIXED: Batch requests to reduce network overhead
  static async batch<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(requests.map(request => request()))
  }

  // FIXED: Retry mechanism for failed requests
  static async withRetry<T>(
    request: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await request()
      } catch (error) {
        lastError = error as Error
        
        if (i === maxRetries) {
          throw lastError
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }

    throw lastError!
  }
}

// FIXED: Specialized API clients for different endpoints
export class DashboardApi {
  static async getKPIs() {
    return ApiClient.get('/api/dashboard', 5 * 60 * 1000) // 5 minutes cache
  }
}

export class CustomersApi {
  static async getAll(page: number = 1, limit: number = 50, search: string = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })
    return ApiClient.get(`/api/customers?${params}`, 2 * 60 * 1000) // 2 minutes cache
  }

  static async create(data: any) {
    const result = await ApiClient.post('/api/customers', data)
    // Invalidate customers cache
    ApiClient.invalidate('GET:/api/customers')
    return result
  }

  static async update(id: string, data: any) {
    const result = await ApiClient.put(`/api/customers?id=${id}`, data)
    // Invalidate customers cache
    ApiClient.invalidate('GET:/api/customers')
    return result
  }

  static async delete(id: string) {
    const result = await ApiClient.delete(`/api/customers?id=${id}`)
    // Invalidate customers cache
    ApiClient.invalidate('GET:/api/customers')
    return result
  }
}

export class UnitsApi {
  static async getAll(page: number = 1, limit: number = 50, search: string = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })
    return ApiClient.get(`/api/units?${params}`, 2 * 60 * 1000)
  }

  static async create(data: any) {
    const result = await ApiClient.post('/api/units', data)
    ApiClient.invalidate('GET:/api/units')
    return result
  }

  static async update(id: string, data: any) {
    const result = await ApiClient.put(`/api/units?id=${id}`, data)
    ApiClient.invalidate('GET:/api/units')
    return result
  }

  static async delete(id: string) {
    const result = await ApiClient.delete(`/api/units?id=${id}`)
    ApiClient.invalidate('GET:/api/units')
    return result
  }
}

export class ContractsApi {
  static async getAll(page: number = 1, limit: number = 50, search: string = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })
    return ApiClient.get(`/api/contracts?${params}`, 2 * 60 * 1000)
  }

  static async create(data: any) {
    const result = await ApiClient.post('/api/contracts', data)
    ApiClient.invalidate('GET:/api/contracts')
    ApiClient.invalidate('GET:/api/dashboard') // Dashboard KPIs depend on contracts
    return result
  }

  static async update(id: string, data: any) {
    const result = await ApiClient.put(`/api/contracts?id=${id}`, data)
    ApiClient.invalidate('GET:/api/contracts')
    ApiClient.invalidate('GET:/api/dashboard')
    return result
  }

  static async delete(id: string) {
    const result = await ApiClient.delete(`/api/contracts?id=${id}`)
    ApiClient.invalidate('GET:/api/contracts')
    ApiClient.invalidate('GET:/api/dashboard')
    return result
  }
}

// FIXED: Export default API client instance
export default ApiClient