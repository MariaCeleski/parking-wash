import 'dotenv/config';

const hourlyRate = parseFloat(process.env.HOURLY_RATE ?? '10.00');
const dailyRateCap = parseFloat(process.env.DAILY_RATE_CAP ?? '80.00');
const parkingTimeLimitHours = parseInt(process.env.PARKING_TIME_LIMIT_HOURS ?? '24', 10);

export const config = {
  port: parseInt(process.env.PORT ?? '3333', 10),
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseKey: process.env.SUPABASE_SERVICE_KEY ?? '',
  hourlyRate: hourlyRate <= 0 ? 10.00 : hourlyRate,
  dailyRateCap: dailyRateCap <= 0 ? 80.00 : dailyRateCap,
  parkingTimeLimitHours: parkingTimeLimitHours <= 0 ? 24 : parkingTimeLimitHours,
  paymentGatewayUrl: process.env.PAYMENT_GATEWAY_URL ?? '',
  paymentGatewayKey: process.env.PAYMENT_GATEWAY_KEY ?? '',
  paymentGatewaySecret: process.env.PAYMENT_GATEWAY_SECRET ?? '',
} as const;
