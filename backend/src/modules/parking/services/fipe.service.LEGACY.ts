/**
 * ============================================================================
 * ARQUIVO LEGADO — NÃO ESTÁ EM USO
 * ============================================================================
 *
 * Este arquivo contém a implementação ANTERIOR do serviço de consulta de
 * veículos por placa, que utilizava APIs externas (SINESP + FIPE).
 *
 * FOI SUBSTITUÍDO POR: fipe.service.ts (versão mock local)
 *
 * MOTIVO DA SUBSTITUIÇÃO:
 * - Não existe API oficial e gratuita para consulta de placas no Brasil
 * - A API do SINESP (sinesp.gov.br) não é pública e retornava erros
 * - A API FIPE não faz lookup por placa (apenas por código FIPE)
 * - Para fins acadêmicos, um mock local é mais confiável e previsível
 *
 * COMO RESTAURAR (se necessário):
 * 1. Renomeie este arquivo para `fipe.service.ts` (substituindo o atual)
 * 2. Certifique-se de que `sinesp.service.ts` existe na mesma pasta
 * 3. Instale axios se não estiver instalado: npm install axios
 * 4. Configure as variáveis de ambiente necessárias (se houver)
 * 5. Reinicie o backend
 *
 * DEPENDÊNCIAS:
 * - axios (para chamadas HTTP)
 * - ./sinesp.service.ts (serviço SINESP como fonte primária)
 * - ./fipe.types.ts (interfaces de tipos)
 *
 * FLUXO DE DADOS (antigo):
 * 1. Verifica cache local (24h TTL)
 * 2. Tenta SINESP (fonte primária) → https://www.sinesp.gov.br/api/v1/veiculos/:placa
 * 3. Se falhar, tenta FIPE API (fallback) → placeholder, nunca funcionou
 * 4. Se ambos falharem, retorna dados genéricos ("Desconhecido")
 *
 * ============================================================================
 */

import { FipeVehicleData, FipeApiResponse, FipeCacheEntry } from './fipe.types';
// import { getVehicleDataFromSinesp } from './sinesp.service'; // ← descomente se restaurar

/**
 * In-memory cache for FIPE data
 * Stores vehicle information to avoid repeated API calls
 * Cache expires after 24 hours
 */
const fipeCache: Map<string, FipeCacheEntry> = new Map();

/**
 * Fallback vehicle data when both SINESP and FIPE APIs are unavailable
 * Used to ensure application continues working even if external APIs fail
 */
const FALLBACK_VEHICLE_DATA: Record<string, FipeVehicleData> = {
  default: {
    brand: 'Desconhecido',
    model: 'Modelo Desconhecido',
    year: new Date().getFullYear(),
    fuel: 'Gasolina',
    fipeValue: 0,
    vehicleType: 'Carro',
    retrievedAt: new Date().toISOString(),
  },
};

/**
 * Normalize license plate format
 * Converts to uppercase and removes hyphens
 * Supports both old format (AAA-9999) and Mercosul format (AAA9A99)
 */
function normalizeLicensePlate(plate: string): string {
  return plate.toUpperCase().replace(/-/g, '');
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: FipeCacheEntry): boolean {
  const now = new Date();
  const expiresAt = new Date(entry.expiresAt);
  return now < expiresAt;
}

/**
 * Get vehicle data from FIPE API (versão com APIs externas)
 * Attempts to fetch real data from SINESP first, then FIPE API
 * Falls back to default data if both are unavailable
 *
 * @param licensePlate - Vehicle license plate (AAA-9999 or AAA9A99 format)
 * @returns Vehicle data from SINESP/FIPE or fallback data
 */
export async function getVehicleDataFromFipe(
  licensePlate: string
): Promise<FipeVehicleData> {
  try {
    const normalizedPlate = normalizeLicensePlate(licensePlate);

    // Check cache first
    const cached = fipeCache.get(normalizedPlate);
    if (cached && isCacheValid(cached)) {
      console.log(`[FIPE] Cache hit for plate: ${licensePlate}`);
      return cached.data;
    }

    // =========================================================================
    // FONTE PRIMÁRIA: SINESP
    // =========================================================================
    // Descomente o bloco abaixo e o import no topo para ativar
    /*
    try {
      console.log(`[FIPE] Attempting SINESP lookup for plate: ${licensePlate}`);
      const vehicleData = await getVehicleDataFromSinesp(licensePlate);
      
      // Cache the result
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      fipeCache.set(normalizedPlate, {
        licensePlate: normalizedPlate,
        data: vehicleData,
        cachedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });

      console.log(`[FIPE] Successfully retrieved data from SINESP for plate: ${licensePlate}`);
      return vehicleData;
    } catch (sinespError) {
      console.warn(`[FIPE] SINESP lookup failed, trying FIPE fallback:`, sinespError);
      
      // Try to fetch from FIPE API as fallback
      const vehicleData = await fetchFromFipeApi(normalizedPlate);

      // Cache the result
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      fipeCache.set(normalizedPlate, {
        licensePlate: normalizedPlate,
        data: vehicleData,
        cachedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });

      console.log(`[FIPE] Successfully retrieved data from FIPE for plate: ${licensePlate}`);
      return vehicleData;
    }
    */

    // Sem APIs externas ativas, retorna fallback
    return FALLBACK_VEHICLE_DATA.default;
  } catch (error) {
    console.error(`[FIPE] Error fetching vehicle data for plate ${licensePlate}:`, error);
    return FALLBACK_VEHICLE_DATA.default;
  }
}

/**
 * =========================================================================
 * FIPE API (placeholder)
 * =========================================================================
 * Esta função nunca funcionou de verdade porque a FIPE não oferece
 * lookup por placa. Seria necessário:
 * 1. Descobrir marca/modelo via SINESP ou outra fonte
 * 2. Usar o código FIPE para consultar o valor na tabela FIPE
 *
 * Alternativas reais para produção:
 * - API Placas (paga): https://apiplacas.com.br
 * - Consulta Placa (paga): https://consultaplaca.info
 * - Olho no Carro (paga): https://olhonocarro.com.br
 */
async function fetchFromFipeApi(normalizedPlate: string): Promise<FipeVehicleData> {
  // Placeholder — em produção, integrar com API paga
  /*
  const response = await axios.get(`https://api-provider.com/vehicles/${normalizedPlate}`, {
    headers: { 'Authorization': `Bearer ${process.env.VEHICLE_API_KEY}` },
    timeout: 5000,
  });

  return {
    brand: response.data.brand,
    model: response.data.model,
    year: response.data.year,
    fuel: response.data.fuel,
    fipeValue: response.data.fipeValue,
    vehicleType: response.data.vehicleType,
    retrievedAt: new Date().toISOString(),
  };
  */

  return FALLBACK_VEHICLE_DATA.default;
}

/**
 * Get vehicle data with fallback (entry point)
 */
export async function getVehicleData(licensePlate: string): Promise<FipeVehicleData> {
  return getVehicleDataFromFipe(licensePlate);
}

/**
 * Clear FIPE cache
 */
export function clearFipeCache(): void {
  fipeCache.clear();
  console.log('[FIPE] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getFipeCacheStats(): {
  totalEntries: number;
  entries: Array<{ plate: string; cachedAt: string; expiresAt: string }>;
} {
  const entries = Array.from(fipeCache.values()).map((entry) => ({
    plate: entry.licensePlate,
    cachedAt: entry.cachedAt,
    expiresAt: entry.expiresAt,
  }));

  return {
    totalEntries: fipeCache.size,
    entries,
  };
}


// =============================================================================
// SINESP SERVICE (código do arquivo sinesp.service.ts para referência)
// =============================================================================
//
// O arquivo sinesp.service.ts continua existindo na pasta, mas não é mais
// importado pelo fipe.service.ts atual (versão mock).
//
// Endpoint usado: https://www.sinesp.gov.br/api/v1/veiculos/:placa
// Timeout: 5 segundos
// Headers: { 'User-Agent': 'ParkingWash/1.0' }
//
// Resposta esperada do SINESP:
// {
//   brand/marca: string,
//   model/modelo: string,
//   year/ano: number,
//   fuel/combustivel: string,
// }
//
// NOTA: Esta API NÃO é pública. O SINESP Cidadão requer autenticação
// e não disponibiliza endpoint REST aberto. O código acima era uma
// tentativa que nunca funcionou em produção.
// =============================================================================
