import { QueryClient } from '@tanstack/react-query';

// Enhanced error handler for React Query
const defaultQueryErrorHandler = (error) => {
  console.error('Query Error:', error);
  
  // Handle different types of errors
  if (error?.response?.status === 401) {
    // Redirect to login on authentication errors
    window.location.href = '/login';
    return;
  }
  
  if (error?.response?.status >= 500) {
    // Show toast for server errors
    console.error('Server error occurred');
  }
  
  if (error?.message?.includes('Network Error')) {
    // Handle network errors
    console.error('Network error - check your connection');
  }
};

// Enhanced mutation error handler
const defaultMutationErrorHandler = (error) => {
  console.error('Mutation Error:', error);
  
  // Handle validation errors
  if (error?.response?.status === 400) {
    console.error('Validation error:', error.response.data);
  }
  
  // Handle other errors
  if (error?.response?.status >= 500) {
    console.error('Server error during mutation');
  }
};

// Create optimized QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache time - how long inactive data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
      
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 429 (rate limit)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return error?.response?.status === 429 && failureCount < 2;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (disable in development)
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Background refetch interval
      refetchInterval: false, // Disable automatic background refetch
      
      // Error handler
      onError: defaultQueryErrorHandler,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Error handler
      onError: defaultMutationErrorHandler,
    },
  },
});

// Query key factories for consistent cache keys
export const queryKeys = {
  // User related
  user: () => ['user'],
  userProfile: () => [...queryKeys.user(), 'profile'],
  
  // Products
  products: () => ['products'],
  productsList: (filters) => [...queryKeys.products(), 'list', filters],
  productDetail: (id) => [...queryKeys.products(), 'detail', id],
  productCategories: () => [...queryKeys.products(), 'categories'],
  
  // Cart
  cart: () => ['cart'],
  cartItems: () => [...queryKeys.cart(), 'items'],
  
  // Orders
  orders: () => ['orders'],
  ordersList: (filters) => [...queryKeys.orders(), 'list', filters],
  orderDetail: (id) => [...queryKeys.orders(), 'detail', id],
  
  // Admin
  admin: () => ['admin'],
  adminUsers: (filters) => [...queryKeys.admin(), 'users', filters],
  adminOrders: (filters) => [...queryKeys.admin(), 'orders', filters],
  adminProducts: (filters) => [...queryKeys.admin(), 'products', filters],
  adminStats: () => [...queryKeys.admin(), 'stats'],
};

// Mutation key factories
export const mutationKeys = {
  // Auth
  login: () => ['auth', 'login'],
  register: () => ['auth', 'register'],
  logout: () => ['auth', 'logout'],
  
  // Cart
  addToCart: () => ['cart', 'add'],
  updateCart: () => ['cart', 'update'],
  removeFromCart: () => ['cart', 'remove'],
  clearCart: () => ['cart', 'clear'],
  
  // Orders
  createOrder: () => ['orders', 'create'],
  updateOrder: () => ['orders', 'update'],
  cancelOrder: () => ['orders', 'cancel'],
  
  // Products
  createProduct: () => ['products', 'create'],
  updateProduct: () => ['products', 'update'],
  deleteProduct: () => ['products', 'delete'],
};

// Cache invalidation helpers
export const invalidateQueries = {
  // Invalidate all user data
  user: () => queryClient.invalidateQueries({ queryKey: queryKeys.user() }),
  
  // Invalidate products
  products: () => queryClient.invalidateQueries({ queryKey: queryKeys.products() }),
  
  // Invalidate cart
  cart: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart() }),
  
  // Invalidate orders
  orders: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders() }),
  
  // Invalidate admin data
  admin: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin() }),
};

// Prefetch helpers
export const prefetchQueries = {
  // Prefetch product categories
  categories: () => queryClient.prefetchQuery({
    queryKey: queryKeys.productCategories(),
    queryFn: () => fetch('/api/categories').then(res => res.json()),
    staleTime: 10 * 60 * 1000, // 10 minutes
  }),
  
  // Prefetch user profile
  userProfile: () => queryClient.prefetchQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: () => fetch('/api/auth/me').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  }),
};

// Optimistic update helpers
export const optimisticUpdates = {
  // Optimistic cart update
  updateCart: (productId, quantity) => {
    queryClient.setQueryData(queryKeys.cartItems(), (oldData) => {
      if (!oldData) return oldData;
      
      return oldData.map(item => 
        item.product_id === productId 
          ? { ...item, quantity }
          : item
      );
    });
  },
  
  // Optimistic cart addition
  addToCart: (product, quantity) => {
    queryClient.setQueryData(queryKeys.cartItems(), (oldData) => {
      if (!oldData) return [{ ...product, quantity }];
      
      const existingItem = oldData.find(item => item.product_id === product.id);
      if (existingItem) {
        return oldData.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...oldData, { ...product, quantity, product_id: product.id }];
    });
  },
};

// Background sync for offline support
export const backgroundSync = {
  // Sync cached mutations when back online
  syncOfflineMutations: async () => {
    const mutationCache = queryClient.getMutationCache();
    const offlineMutations = mutationCache.getAll().filter(
      mutation => mutation.state.status === 'error' && mutation.state.error?.name === 'NetworkError'
    );
    
    for (const mutation of offlineMutations) {
      try {
        await mutation.execute();
      } catch (error) {
        console.error('Failed to sync offline mutation:', error);
      }
    }
  },
};

export default queryClient;