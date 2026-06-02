/**
 * Unit tests for PaymentService
 * Tests error handling for gateway timeouts, invalid payment methods,
 * insufficient funds, and generic gateway errors.
 *
 * Validates: Requirements 7.3
 */

import axios, { AxiosError } from 'axios';
import { PaymentService, PaymentRequest, PaymentResponse } from '../src/modules/parking/services/payment.service';

// Mock axios but keep AxiosError as the real implementation
jest.mock('axios', () => {
  const actualAxios = jest.requireActual('axios');
  return {
    ...actualAxios,
    __esModule: true,
    default: {
      ...actualAxios.default,
      post: jest.fn(),
    },
    post: jest.fn(),
  };
});
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock config
jest.mock('../src/config/env', () => ({
  config: {
    paymentGatewayUrl: 'https://api.test-gateway.com',
    paymentGatewayKey: 'test-key',
    paymentGatewaySecret: 'test-secret',
  },
}));

describe('PaymentService', () => {
  let paymentService: PaymentService;

  const validRequest: PaymentRequest = {
    amount: 60.00,
    currency: 'BRL',
    description: 'ABC-1234',
    metadata: {
      parkingId: '550e8400-e29b-41d4-a716-446655440000',
      vehicleType: 'car',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    paymentService = new PaymentService();
  });

  // ========================================================================
  // Successful payment processing
  // ========================================================================
  describe('processPayment - success', () => {
    it('should return success with transactionId when gateway responds 2xx', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          transactionId: 'txn_abc123',
          message: 'Payment approved',
        },
      });

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('success');
      expect(result.transactionId).toBe('txn_abc123');
      expect(result.message).toBe('Payment approved');
      expect(result.errorType).toBeUndefined();
    });

    it('should use response.data.id as transactionId fallback', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          id: 'txn_fallback_456',
        },
      });

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('success');
      expect(result.transactionId).toBe('txn_fallback_456');
    });

    it('should send correct headers and payload to gateway', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { transactionId: 'txn_test' },
      });

      await paymentService.processPayment(validRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.test-gateway.com/payments',
        {
          amount: 60.00,
          currency: 'BRL',
          description: 'ABC-1234',
          metadata: {
            parkingId: '550e8400-e29b-41d4-a716-446655440000',
            vehicleType: 'car',
          },
        },
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-key',
            'X-Gateway-Secret': 'test-secret',
          },
          timeout: 30000,
        })
      );
    });
  });

  // ========================================================================
  // Gateway timeout errors
  // ========================================================================
  describe('processPayment - gateway timeout', () => {
    it('should return failed with GATEWAY_TIMEOUT on ECONNABORTED', async () => {
      const timeoutError = new AxiosError(
        'timeout of 30000ms exceeded',
        'ECONNABORTED',
        undefined,
        {},
        undefined
      );
      mockedAxios.post.mockRejectedValue(timeoutError);

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('failed');
      expect(result.errorType).toBe('GATEWAY_TIMEOUT');
      expect(result.transactionId).toBe('');
      expect(result.message).toContain('Tempo limite');
    });

    it('should return failed with GATEWAY_TIMEOUT on ETIMEDOUT', async () => {
      const timeoutError = new AxiosError(
        'connect ETIMEDOUT',
        'ETIMEDOUT',
        undefined,
        {},
        undefined
      );
      mockedAxios.post.mockRejectedValue(timeoutError);

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('failed');
      expect(result.errorType).toBe('GATEWAY_TIMEOUT');
      expect(result.transactionId).toBe('');
      expect(result.message).toContain('Tempo limite');
    });
  });

  // ========================================================================
  // Invalid payment method errors
  // ========================================================================
  describe('processPayment - invalid payment method', () => {
    it('should return failed with INVALID_PAYMENT_METHOD on HTTP 400', async () => {
      const error = new AxiosError('Bad Request', 'ERR_BAD_REQUEST');
      error.response = {
        status: 400,
        statusText: 'Bad Request',
        data: { message: 'Método de pagamento não suportado' },
        headers: {},
        config: {} as any,
      };
      mockedAxios.post.mockRejectedValue(error);

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('failed');
      expect(result.errorType).toBe('INVALID_PAYMENT_METHOD');
      expect(result.transactionId).toBe('');
      expect(result.message).toBe('Método de pagamento não suportado');
    });

    it('should return failed with INVALID_PAYMENT_METHOD on HTTP 422', async () => {
      const error = new AxiosError('Unprocessable Entity', 'ERR_BAD_REQUEST');
      error.response = {
        status: 422,
        statusText: 'Unprocessable Entity',
        data: { message: 'Dados do cartão inválidos' },
        headers: {},
        config: {} as any,
      };
      mockedAxios.post.mockRejectedValue(error);

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('failed');
      expect(result.errorType).toBe('INVALID_PAYMENT_METHOD');
      expect(result.message).toBe('Dados do cartão inválidos');
    });

    it('should use default message when gateway returns no message on 400', async () => {
      const error = new AxiosError('Bad Request', 'ERR_BAD_REQUEST');
      error.response = {
        status: 400,
        statusText: 'Bad Request',
        data: {},
        headers: {},
        config: {} as any,
      };
      mockedAxios.post.mockRejectedValue(error);

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('failed');
      expect(result.errorType).toBe('INVALID_PAYMENT_METHOD');
      expect(result.message).toContain('inválido');
    });
  });

  // ========================================================================
  // Insufficient funds errors
  // ========================================================================
  describe('processPayment - insufficient funds', () => {
    it('should return failed with INSUFFICIENT_FUNDS on HTTP 402', async () => {
      const error = new AxiosError('Payment Required', 'ERR_BAD_RESPONSE');
      error.response = {
        status: 402,
        statusText: 'Payment Required',
        data: { message: 'Saldo insuficiente no cartão' },
        headers: {},
        config: {} as any,
      };
      mockedAxios.post.mockRejectedValue(error);

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('failed');
      expect(result.errorType).toBe('INSUFFICIENT_FUNDS');
      expect(result.transactionId).toBe('');
      expect(result.message).toBe('Saldo insuficiente no cartão');
    });

    it('should use default message when gateway returns no message on 402', async () => {
      const error = new AxiosError('Payment Required', 'ERR_BAD_RESPONSE');
      error.response = {
        status: 402,
        statusText: 'Payment Required',
        data: {},
        headers: {},
        config: {} as any,
      };
      mockedAxios.post.mockRejectedValue(error);

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('failed');
      expect(result.errorType).toBe('INSUFFICIENT_FUNDS');
      expect(result.message).toContain('insuficientes');
    });
  });

  // ========================================================================
  // Generic gateway errors (5xx)
  // ========================================================================
  describe('processPayment - gateway server errors', () => {
    it('should return failed with GATEWAY_ERROR on HTTP 500', async () => {
      const error = new AxiosError('Internal Server Error', 'ERR_BAD_RESPONSE');
      error.response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: { message: 'Internal gateway failure' },
        headers: {},
        config: {} as any,
      };
      mockedAxios.post.mockRejectedValue(error);

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('failed');
      expect(result.errorType).toBe('GATEWAY_ERROR');
      expect(result.transactionId).toBe('');
      expect(result.message).toBe('Internal gateway failure');
    });

    it('should return failed with GATEWAY_ERROR on HTTP 503', async () => {
      const error = new AxiosError('Service Unavailable', 'ERR_BAD_RESPONSE');
      error.response = {
        status: 503,
        statusText: 'Service Unavailable',
        data: {},
        headers: {},
        config: {} as any,
      };
      mockedAxios.post.mockRejectedValue(error);

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('failed');
      expect(result.errorType).toBe('GATEWAY_ERROR');
      expect(result.message).toContain('indisponível');
    });

    it('should return failed with GATEWAY_ERROR on other client errors (e.g. 403)', async () => {
      const error = new AxiosError('Forbidden', 'ERR_BAD_RESPONSE');
      error.response = {
        status: 403,
        statusText: 'Forbidden',
        data: { message: 'Access denied' },
        headers: {},
        config: {} as any,
      };
      mockedAxios.post.mockRejectedValue(error);

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('failed');
      expect(result.errorType).toBe('GATEWAY_ERROR');
      expect(result.message).toBe('Access denied');
    });
  });

  // ========================================================================
  // Network errors (no response)
  // ========================================================================
  describe('processPayment - network errors', () => {
    it('should return failed with NETWORK_ERROR when no response received', async () => {
      const error = new AxiosError('Network Error', 'ERR_NETWORK');
      // No error.response set — simulates network failure
      mockedAxios.post.mockRejectedValue(error);

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('failed');
      expect(result.errorType).toBe('NETWORK_ERROR');
      expect(result.transactionId).toBe('');
      expect(result.message).toContain('conectar');
    });
  });

  // ========================================================================
  // Unknown errors (non-Axios)
  // ========================================================================
  describe('processPayment - unknown errors', () => {
    it('should return failed with UNKNOWN_ERROR for non-Axios errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Something unexpected'));

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('failed');
      expect(result.errorType).toBe('UNKNOWN_ERROR');
      expect(result.transactionId).toBe('');
      expect(result.message).toContain('inesperado');
    });

    it('should return failed with UNKNOWN_ERROR for null/undefined errors', async () => {
      mockedAxios.post.mockRejectedValue(null);

      const result = await paymentService.processPayment(validRequest);

      expect(result.status).toBe('failed');
      expect(result.errorType).toBe('UNKNOWN_ERROR');
    });
  });

  // ========================================================================
  // Constructor options
  // ========================================================================
  describe('constructor options', () => {
    it('should accept custom gateway configuration', async () => {
      const customService = new PaymentService({
        gatewayUrl: 'https://custom-gateway.com',
        gatewayKey: 'custom-key',
        gatewaySecret: 'custom-secret',
        timeoutMs: 5000,
      });

      mockedAxios.post.mockResolvedValue({
        data: { transactionId: 'txn_custom' },
      });

      await customService.processPayment(validRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://custom-gateway.com/payments',
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer custom-key',
            'X-Gateway-Secret': 'custom-secret',
          }),
          timeout: 5000,
        })
      );
    });
  });
});
