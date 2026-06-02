import { WashOrderService } from '../src/modules/wash-orders/wash-orders.service';
import { supabase } from '../src/db/supabase';
import {
  ValidationError,
  NotFoundError,
  ServiceUnavailableError,
} from '../src/middleware/errors';
import * as fc from 'fast-check';

// Mock WashServicePricesService
jest.mock('../src/modules/wash-service-prices/wash-service-prices.service', () => {
  return {
    WashServicePricesService: jest.fn().mockImplementation(() => ({
      resolvePrice: jest.fn().mockResolvedValue({ price: 50.0, isDefault: true }),
    })),
  };
});

// Mock Supabase
jest.mock('../src/db/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('WashOrderService', () => {
  let service: WashOrderService;
  let mockSupabase: any;

  beforeEach(() => {
    service = new WashOrderService();
    mockSupabase = supabase as any;
    jest.clearAllMocks();
  });

  // ============================================================================
  // Arbitraries for Property-Based Testing
  // ============================================================================

  const validPlateArb = fc.oneof(
    // Legacy format: AAA-9999
    fc.tuple(
      fc.stringMatching(/^[A-Z]{3}$/),
      fc.stringMatching(/^\d{4}$/)
    ).map(([letters, digits]) => `${letters}-${digits}`),
    // Mercosul format: AAA9A99
    fc.stringMatching(/^[A-Z]{3}\d[A-Z]\d{2}$/)
  );

  const uuidArb = fc.uuid();

  const washServiceArb = fc.record({
    id: uuidArb,
    name: fc.string({ minLength: 1, maxLength: 100 }),
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }),
    duration_estimate: fc.integer({ min: 0, max: 480 }),
    is_active: fc.boolean(),
  });

  // ============================================================================
  // Helper to create chainable mock
  // ============================================================================

  function createChainMock(resolvedValue: any) {
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(resolvedValue),
    };
    // Make order also resolve directly for listOrders (which doesn't call .single())
    chain.order.mockResolvedValue(resolvedValue);
    return chain;
  }

  // ============================================================================
  // createOrder Tests
  // ============================================================================

  describe('createOrder', () => {
    it('Property 6: creates valid wash order for any valid plate and active service', async () => {
      await fc.assert(
        fc.asyncProperty(validPlateArb, uuidArb, washServiceArb, async (plate, serviceId, washSvc) => {
          jest.clearAllMocks();

          const activeService = { ...washSvc, id: serviceId, is_active: true, price: 50.0 };
          const createdOrder = {
            id: fc.sample(uuidArb, 1)[0],
            license_plate: plate,
            wash_service_id: serviceId,
            vehicle_type_id: null,
            price: 50.0,
            status: 'Waiting',
            created_at: new Date().toISOString(),
            started_at: null,
            completed_at: null,
            payment_method: null,
          };

          // Call 1: fetch wash service
          const serviceChain = createChainMock({ data: activeService, error: null });
          // Call 2: fetch parking_records (no vehicle type found)
          const parkingChain = createChainMock({ data: null, error: { code: 'PGRST116' } });
          // Call 3: insert order
          const insertChain = createChainMock({ data: createdOrder, error: null });

          let callCount = 0;
          mockSupabase.from.mockImplementation((table: string) => {
            callCount++;
            if (table === 'wash_services' && callCount === 1) return serviceChain;
            if (table === 'parking_records') return parkingChain;
            if (table === 'wash_orders') return insertChain;
            return serviceChain;
          });

          // Act
          const result = await service.createOrder(plate, serviceId);

          // Assert
          expect(result.licensePlate).toBe(plate);
          expect(result.status).toBe('Waiting');
          expect(result.createdAt).toBeDefined();
          expect(result.startedAt).toBeNull();
          expect(result.completedAt).toBeNull();
          expect(result.price).toBe(50.0);
        }),
        { numRuns: 50 }
      );
    });

    it('Example: throws ValidationError when service not found', async () => {
      const plate = 'ABC-1234';
      const serviceId = fc.sample(uuidArb, 1)[0];

      const chain = createChainMock({ data: null, error: { message: 'Not found' } });
      mockSupabase.from.mockReturnValue(chain);

      await expect(service.createOrder(plate, serviceId)).rejects.toThrow(
        'Serviço de lavagem não encontrado'
      );
    });

    it('Example: throws ValidationError when service is inactive', async () => {
      const plate = 'ABC-1234';
      const serviceId = fc.sample(uuidArb, 1)[0];
      const inactiveService = {
        id: serviceId,
        name: 'Lavagem Simples',
        price: 50.0,
        duration_estimate: 30,
        is_active: false,
      };

      const chain = createChainMock({ data: inactiveService, error: null });
      mockSupabase.from.mockReturnValue(chain);

      await expect(service.createOrder(plate, serviceId)).rejects.toThrow(
        'Serviço de lavagem não está disponível'
      );
    });

    it('Example: throws ServiceUnavailableError on insert error', async () => {
      const plate = 'ABC-1234';
      const serviceId = fc.sample(uuidArb, 1)[0];
      const activeService = {
        id: serviceId,
        name: 'Lavagem Simples',
        price: 50.0,
        duration_estimate: 30,
        is_active: true,
      };

      // Service lookup succeeds
      const serviceChain = createChainMock({ data: activeService, error: null });
      // Parking records lookup (no match)
      const parkingChain = createChainMock({ data: null, error: { code: 'PGRST116' } });
      // Insert fails
      const insertChain = createChainMock({ data: null, error: { message: 'Database error' } });

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;
        if (table === 'wash_services') return serviceChain;
        if (table === 'parking_records') return parkingChain;
        if (table === 'wash_orders') return insertChain;
        return serviceChain;
      });

      await expect(service.createOrder(plate, serviceId)).rejects.toThrow(
        ServiceUnavailableError
      );
    });
  });

  // ============================================================================
  // advanceStatus Tests
  // ============================================================================

  describe('advanceStatus', () => {
    it('Property 7: Waiting→InProgress transition sets started_at in ISO 8601', async () => {
      await fc.assert(
        fc.asyncProperty(validPlateArb, uuidArb, async (plate, serviceId) => {
          jest.clearAllMocks();

          const orderId = fc.sample(uuidArb, 1)[0];
          const currentOrder = {
            id: orderId,
            license_plate: plate,
            wash_service_id: serviceId,
            vehicle_type_id: null,
            price: 50.0,
            status: 'Waiting',
            created_at: new Date().toISOString(),
            started_at: null,
            completed_at: null,
            payment_method: null,
          };
          const updatedOrder = {
            ...currentOrder,
            status: 'InProgress',
            started_at: new Date().toISOString(),
          };
          const washSvc = {
            id: serviceId,
            name: 'Lavagem Simples',
            price: 50.0,
            duration_estimate: 30,
            is_active: true,
          };

          // Call 1: fetch order
          const orderChain = createChainMock({ data: currentOrder, error: null });
          // Call 2: update order (wash_orders again)
          const updateChain = createChainMock({ data: updatedOrder, error: null });
          // Call 3: fetch service
          const serviceChain = createChainMock({ data: washSvc, error: null });

          let callCount = 0;
          mockSupabase.from.mockImplementation((table: string) => {
            callCount++;
            if (table === 'wash_orders' && callCount === 1) return orderChain;
            if (table === 'wash_orders' && callCount === 2) return updateChain;
            if (table === 'wash_services') return serviceChain;
            return orderChain;
          });

          const result = await service.advanceStatus(orderId, 'InProgress');
          expect(result.status).toBe('InProgress');
          expect(result.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        }),
        { numRuns: 50 }
      );
    });

    it('Property 7: InProgress→Completed transition sets completed_at in ISO 8601', async () => {
      await fc.assert(
        fc.asyncProperty(validPlateArb, uuidArb, async (plate, serviceId) => {
          jest.clearAllMocks();

          const orderId = fc.sample(uuidArb, 1)[0];
          const currentOrder = {
            id: orderId,
            license_plate: plate,
            wash_service_id: serviceId,
            vehicle_type_id: null,
            price: 50.0,
            status: 'InProgress',
            created_at: new Date().toISOString(),
            started_at: new Date().toISOString(),
            completed_at: null,
            payment_method: null,
          };
          const updatedOrder = {
            ...currentOrder,
            status: 'Completed',
            completed_at: new Date().toISOString(),
          };
          const washSvc = {
            id: serviceId,
            name: 'Lavagem Simples',
            price: 50.0,
            duration_estimate: 30,
            is_active: true,
          };

          // Call 1: fetch order
          const orderChain = createChainMock({ data: currentOrder, error: null });
          // Call 2: update order
          const updateChain = createChainMock({ data: updatedOrder, error: null });
          // Call 3: fetch service
          const serviceChain = createChainMock({ data: washSvc, error: null });

          let callCount = 0;
          mockSupabase.from.mockImplementation((table: string) => {
            callCount++;
            if (table === 'wash_orders' && callCount === 1) return orderChain;
            if (table === 'wash_orders' && callCount === 2) return updateChain;
            if (table === 'wash_services') return serviceChain;
            return orderChain;
          });

          const result = await service.advanceStatus(orderId, 'Completed');
          expect(result.status).toBe('Completed');
          expect(result.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        }),
        { numRuns: 50 }
      );
    });

    it('Property 8: invalid transitions are always rejected', async () => {
      await fc.assert(
        fc.asyncProperty(validPlateArb, uuidArb, async (plate, serviceId) => {
          jest.clearAllMocks();

          const orderId = fc.sample(uuidArb, 1)[0];
          const currentOrder = {
            id: orderId,
            license_plate: plate,
            wash_service_id: serviceId,
            vehicle_type_id: null,
            price: 50.0,
            status: 'Waiting',
            created_at: new Date().toISOString(),
            started_at: null,
            completed_at: null,
            payment_method: null,
          };

          const orderChain = createChainMock({ data: currentOrder, error: null });
          mockSupabase.from.mockReturnValue(orderChain);

          // Waiting → Completed is invalid
          await expect(service.advanceStatus(orderId, 'Completed')).rejects.toThrow(
            ValidationError
          );
        }),
        { numRuns: 50 }
      );
    });

    it('Example: throws NotFoundError when order not found', async () => {
      const orderId = fc.sample(uuidArb, 1)[0];

      const chain = createChainMock({ data: null, error: { message: 'Not found' } });
      mockSupabase.from.mockReturnValue(chain);

      await expect(service.advanceStatus(orderId, 'InProgress')).rejects.toThrow(
        'Ordem de lavagem não encontrada'
      );
    });

    it('Example: throws ValidationError for Completed→InProgress transition', async () => {
      const orderId = fc.sample(uuidArb, 1)[0];
      const completedOrder = {
        id: orderId,
        license_plate: 'ABC-1234',
        wash_service_id: fc.sample(uuidArb, 1)[0],
        vehicle_type_id: null,
        price: 50.0,
        status: 'Completed',
        created_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        payment_method: null,
      };

      const chain = createChainMock({ data: completedOrder, error: null });
      mockSupabase.from.mockReturnValue(chain);

      await expect(service.advanceStatus(orderId, 'InProgress')).rejects.toThrow(
        'Transição inválida'
      );
    });
  });

  // ============================================================================
  // listOrders Tests
  // ============================================================================

  describe('listOrders', () => {
    it('Property 9: filtering by status returns only matching orders', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Waiting', 'InProgress', 'Completed'),
          async (statusFilter: string) => {
            jest.clearAllMocks();

            const serviceId = fc.sample(uuidArb, 1)[0];
            const orders = [
              {
                id: fc.sample(uuidArb, 1)[0],
                license_plate: 'ABC-1234',
                wash_service_id: serviceId,
                vehicle_type_id: null,
                price: 50.0,
                status: statusFilter,
                created_at: new Date().toISOString(),
                started_at: statusFilter !== 'Waiting' ? new Date().toISOString() : null,
                completed_at: statusFilter === 'Completed' ? new Date().toISOString() : null,
                payment_method: null,
                wash_services: {
                  id: serviceId,
                  name: 'Lavagem Simples',
                  price: 50.0,
                },
                vehicle_types: null,
              },
            ];

            // For listOrders, the chain ends with order() which resolves directly
            const chain: any = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              or: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              lte: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({ data: orders, error: null }),
            };
            mockSupabase.from.mockReturnValue(chain);

            const result = await service.listOrders(statusFilter);
            expect(result).toHaveLength(1);
            expect(result[0].status).toBe(statusFilter);
          }
        ),
        { numRuns: 30 }
      );
    }, 60000);

    it('Example: returns all orders when no status filter provided', async () => {
      const serviceId1 = fc.sample(uuidArb, 1)[0];
      const serviceId2 = fc.sample(uuidArb, 1)[0];
      const orders = [
        {
          id: fc.sample(uuidArb, 1)[0],
          license_plate: 'ABC-1234',
          wash_service_id: serviceId1,
          vehicle_type_id: null,
          price: 50.0,
          status: 'Waiting',
          created_at: new Date().toISOString(),
          started_at: null,
          completed_at: null,
          payment_method: null,
          wash_services: {
            id: serviceId1,
            name: 'Lavagem Simples',
            price: 50.0,
          },
          vehicle_types: null,
        },
        {
          id: fc.sample(uuidArb, 1)[0],
          license_plate: 'XYZ-5678',
          wash_service_id: serviceId2,
          vehicle_type_id: null,
          price: 100.0,
          status: 'InProgress',
          created_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          completed_at: null,
          payment_method: null,
          wash_services: {
            id: serviceId2,
            name: 'Lavagem Completa',
            price: 100.0,
          },
          vehicle_types: null,
        },
      ];

      const chain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: orders, error: null }),
      };
      mockSupabase.from.mockReturnValue(chain);

      const result = await service.listOrders();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('Waiting');
      expect(result[1].status).toBe('InProgress');
    }, 60000);

    it('Example: throws ValidationError for invalid status filter', async () => {
      await expect(service.listOrders('InvalidStatus')).rejects.toThrow(
        ValidationError
      );
      await expect(service.listOrders('InvalidStatus')).rejects.toThrow(
        'Status inválido'
      );
    });

    it('Example: returns empty array when no orders match filter', async () => {
      const chain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockSupabase.from.mockReturnValue(chain);

      const result = await service.listOrders('Waiting');

      expect(result).toEqual([]);
    }, 60000);

    it('Example: throws ServiceUnavailableError on database error', async () => {
      const chain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      };
      mockSupabase.from.mockReturnValue(chain);

      await expect(service.listOrders()).rejects.toThrow(ServiceUnavailableError);
    }, 60000);
  });
});
