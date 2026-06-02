/**
 * Payment Service
 * Integrates with external payment gateway to process parking payments
 *
 * Handles:
 * - Sending payment requests to the gateway
 * - Processing success/failure responses
 * - Error handling for timeouts, invalid methods, and gateway errors
 *
 * Requirements: 7.1, 7.2, 7.3
 */

import axios, { AxiosError } from 'axios';
import { config } from '../../../config/env';

// --- Interfaces ---

export interface PaymentRequest {
  amount: number;
  currency: string;              // "BRL"
  description: string;           // License plate
  metadata: {
    parkingId: string;
    vehicleType: string;
  };
}

export type PaymentErrorType =
  | 'GATEWAY_TIMEOUT'
  | 'INVALID_PAYMENT_METHOD'
  | 'INSUFFICIENT_FUNDS'
  | 'GATEWAY_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface PaymentResponse {
  transactionId: string;
  status: 'success' | 'failed';
  message?: string;
  errorType?: PaymentErrorType;
}

export interface PaymentServiceOptions {
  gatewayUrl?: string;
  gatewayKey?: string;
  gatewaySecret?: string;
  timeoutMs?: number;
}

// --- Service ---

export class PaymentService {
  private readonly gatewayUrl: string;
  private readonly gatewayKey: string;
  private readonly gatewaySecret: string;
  private readonly timeoutMs: number;

  constructor(options?: PaymentServiceOptions) {
    this.gatewayUrl = options?.gatewayUrl ?? config.paymentGatewayUrl;
    this.gatewayKey = options?.gatewayKey ?? config.paymentGatewayKey;
    this.gatewaySecret = options?.gatewaySecret ?? config.paymentGatewaySecret;
    this.timeoutMs = options?.timeoutMs ?? 30000;
  }

  /**
   * Process a payment through the external payment gateway
   * If no gateway URL is configured, simulates a successful payment (dev/academic mode)
   *
   * @param request - PaymentRequest with amount, currency, description, and metadata
   * @returns PaymentResponse with transactionId and status
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Modo simulação: se não há gateway configurado, simular sucesso
    if (!this.gatewayUrl) {
      const mockTransactionId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      console.log(`[PAYMENT] Modo simulação — gateway não configurado. Transação: ${mockTransactionId}, Valor: R$ ${request.amount.toFixed(2)}`);
      return {
        transactionId: mockTransactionId,
        status: 'success',
        message: 'Pagamento simulado com sucesso (modo desenvolvimento)',
      };
    }

    try {
      const response = await axios.post(
        `${this.gatewayUrl}/payments`,
        {
          amount: request.amount,
          currency: request.currency,
          description: request.description,
          metadata: request.metadata,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.gatewayKey}`,
            'X-Gateway-Secret': this.gatewaySecret,
          },
          timeout: this.timeoutMs,
        }
      );

      // Success response (2xx)
      return {
        transactionId: response.data.transactionId || response.data.id,
        status: 'success',
        message: response.data.message || 'Pagamento processado com sucesso',
      };
    } catch (error) {
      return this.handlePaymentError(error);
    }
  }

  /**
   * Handle payment gateway errors and return appropriate PaymentResponse
   */
  private handlePaymentError(error: unknown): PaymentResponse {
    // Use duck-typing to identify Axios errors since jest.mock can break instanceof
    if (this.isAxiosLikeError(error)) {
      const err = error as { code?: string; response?: { status: number; data?: Record<string, unknown> } };

      // Timeout — check code FIRST before response
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        return {
          transactionId: '',
          status: 'failed',
          errorType: 'GATEWAY_TIMEOUT',
          message: 'Tempo limite de conexão com o gateway de pagamento excedido',
        };
      }

      // Gateway responded with error status (4xx or 5xx)
      if (err.response) {
        const statusCode = err.response.status;
        const responseData = err.response.data;

        // HTTP 400 or 422 — invalid payment method
        if (statusCode === 400 || statusCode === 422) {
          return {
            transactionId: '',
            status: 'failed',
            errorType: 'INVALID_PAYMENT_METHOD',
            message: (responseData?.message as string) || 'Método de pagamento inválido',
          };
        }

        // HTTP 402 — insufficient funds
        if (statusCode === 402) {
          return {
            transactionId: '',
            status: 'failed',
            errorType: 'INSUFFICIENT_FUNDS',
            message: (responseData?.message as string) || 'Fundos insuficientes',
          };
        }

        // All other errors (403, 5xx, etc.) — gateway error
        return {
          transactionId: '',
          status: 'failed',
          errorType: 'GATEWAY_ERROR',
          message: (responseData?.message as string) || 'Serviço de pagamento temporariamente indisponível',
        };
      }

      // Network error (no response received)
      return {
        transactionId: '',
        status: 'failed',
        errorType: 'NETWORK_ERROR',
        message: 'Não foi possível conectar ao gateway de pagamento',
      };
    }

    // Unknown error (non-Axios)
    return {
      transactionId: '',
      status: 'failed',
      errorType: 'UNKNOWN_ERROR',
      message: 'Erro inesperado ao processar pagamento',
    };
  }

  /**
   * Check if an error is an Axios-like error using duck-typing.
   * This handles both real AxiosError instances and mocked ones from jest.
   */
  private isAxiosLikeError(error: unknown): boolean {
    if (error instanceof AxiosError) {
      return true;
    }
    if (error === null || error === undefined || typeof error !== 'object') {
      return false;
    }
    // Duck-type: AxiosError has isAxiosError = true
    if ('isAxiosError' in error && (error as { isAxiosError: boolean }).isAxiosError === true) {
      return true;
    }
    // Duck-type: has a code property typical of Axios errors
    if ('code' in error && typeof (error as { code: unknown }).code === 'string') {
      return true;
    }
    // Duck-type: has a response property with status (from AxiosError)
    if ('response' in error && error.response !== null && typeof error.response === 'object') {
      const resp = error.response as Record<string, unknown>;
      if ('status' in resp && typeof resp.status === 'number') {
        return true;
      }
    }
    return false;
  }
}
