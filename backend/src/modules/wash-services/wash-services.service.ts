import { supabase } from '../../db/supabase';
import { ServiceUnavailableError, NotFoundError, ValidationError } from '../../middleware/errors';
import { WashService } from './wash-services.types';

export class WashServicesService {
  async listActiveServices(): Promise<WashService[]> {
    const { data, error } = await supabase
      .from('wash_services')
      .select('*')
      .eq('is_active', true);

    if (error) {
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }

    return data || [];
  }

  async updatePrice(id: string, price: number): Promise<WashService> {
    if (price < 0.01) {
      throw new ValidationError('O preço deve ser maior que 0.01');
    }

    const { data, error } = await supabase
      .from('wash_services')
      .update({ price })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Serviço de lavagem não encontrado');
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }

    return data;
  }
}
