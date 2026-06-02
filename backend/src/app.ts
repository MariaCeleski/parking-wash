import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middleware/error.middleware';
import { parkingRouter } from './modules/parking/parking.router';
import { washOrdersRouter } from './modules/wash-orders/wash-orders.router';
import { washServicesRouter } from './modules/wash-services/wash-services.router';
import vehicleTypesRouter from './modules/vehicle-types/vehicle-type.router';
import { notificationRouter } from './modules/notifications/notification.router';
import { billingRouter } from './modules/billing/billing.router';
import { settingsRouter } from './modules/settings/settings.router';
import { washServicePricesRouter } from './modules/wash-service-prices/wash-service-prices.router';

const app = express();

// Global middleware
app.use(cors() as any);
app.use(express.json());

// Vehicle Types routes
app.use('/api/vehicle-types', vehicleTypesRouter);

// Task 4.3: import and register parkingRouter
app.use('/api/parking', parkingRouter);

// Task 5.3: import and register washOrdersRouter
app.use('/api/wash-orders', washOrdersRouter);

// Task 6.1: import and register washServicesRouter
app.use('/api/wash-services', washServicesRouter);

// Notifications routes
app.use('/api/notifications', notificationRouter);

// Billing routes
app.use('/api/billing', billingRouter);

// Settings routes
app.use('/api/settings', settingsRouter);

// Wash Service Prices routes
app.use('/api/wash-service-prices', washServicePricesRouter);

// Centralized error handling — must be last
app.use(errorMiddleware);

export { app };
