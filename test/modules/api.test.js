// Import the functions to be tested
import * as api from '../../public/src/modules/api';
import { fire as fireHook } from 'hooks';
import { confirm } from 'bootbox';

// Mock dependencies
jest.mock('hooks', () => ({
  fire: jest.fn(),
}));
jest.mock('bootbox', () => ({
  confirm: jest.fn(),
}));
global.fetch = jest.fn();

// Mock config
global.config = {
  relative_path: '/test-path',
  csrf_token: 'test-csrf-token',
};

// Test suite
describe('api.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('call', () => {
    it('should call xhr with correct options and return result', async () => {
      const mockResponse = { response: { data: 'test' }, status: { message: 'Success' } };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: {
          get: () => 'application/json',
        },
      });
      fireHook.mockResolvedValue({ url: 'test-login' });

      const result = await api.get('/test-route', { key: 'value' });
      expect(result).toEqual({ data: 'test' });
      expect(global.fetch).toHaveBeenCalledWith(
        '/test-path/api/v3/test-route?key=value',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle reauthentication error', async () => {
      const error = new Error('A valid login session was not found. Please log in and try again.');
      global.fetch.mockRejectedValue(error);

      fireHook.mockResolvedValue({ url: 'login' });
      confirm.mockImplementation((_, cb) => cb(true));

      try {
        await api.get('/test-route');
      } catch (err) {
        expect(err).toBe(error);
      }
      expect(confirm).toHaveBeenCalledWith('[[error:api.reauth-required]]', expect.any(Function));
    });

    it('should throw an error for non-reauthentication issues', async () => {
      const error = new Error('Test Error');
      global.fetch.mockRejectedValue(error);

      await expect(api.get('/test-route')).rejects.toThrow('Test Error');
    });
  });

  describe('xhr', () => {
    it('should handle JSON responses correctly', async () => {
      const mockResponse = { response: { data: 'test' }, status: { message: 'Success' } };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: {
          get: () => 'application/json',
        },
      });

      const result = await api.get('/test-route');
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle non-JSON responses correctly', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => 'test-response',
        headers: {
          get: () => 'text/plain',
        },
      });

      const result = await api.get('/test-route');
      expect(result).toEqual('test-response');
    });

    it('should throw an error for non-OK responses', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        statusText: 'Test Error',
        headers: {
          get: () => 'text/plain',
        },
      });

      await expect(api.get('/test-route')).rejects.toThrow('Test Error');
    });
  });

  describe('HTTP methods', () => {
    it('should make GET requests correctly', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
        headers: {
          get: () => 'application/json',
        },
      });

      await api.get('/test-route', { key: 'value' });
      expect(global.fetch).toHaveBeenCalledWith(
        '/test-path/api/v3/test-route?key=value',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should make POST requests correctly', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
        headers: {
          get: () => 'application/json',
        },
      });

      await api.post('/test-route', { key: 'value' });
      expect(global.fetch).toHaveBeenCalledWith(
        '/test-path/api/v3/test-route',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ key: 'value' }),
          headers: expect.objectContaining({ 'x-csrf-token': 'test-csrf-token' }),
        })
      );
    });

    it('should make DELETE requests correctly', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
        headers: {
          get: () => 'application/json',
        },
      });

      await api.del('/test-route', { key: 'value' });
      expect(global.fetch).toHaveBeenCalledWith(
        '/test-path/api/v3/test-route',
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ key: 'value' }),
          headers: expect.objectContaining({ 'x-csrf-token': 'test-csrf-token' }),
        })
      );
    });
  });
});
