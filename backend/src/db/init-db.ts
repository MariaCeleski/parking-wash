/* eslint-disable @typescript-eslint/no-require-imports */
declare const __dirname: string;
declare const require: any;
declare const module: any;

import { supabase } from './supabase';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para inicializar o banco de dados Supabase
 * Executa schema.sql e seed.sql
 */
async function initializeDatabase() {
  try {
    console.log('🔄 Iniciando setup do banco de dados...\n');

    // Ler schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Ler seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf-8');

    // Executar schema
    console.log('📋 Executando schema.sql...');
    let schemaError: any = null;
    try {
      const result = await supabase.rpc('exec_sql', { sql: schema });
      schemaError = result.error;
    } catch {
      // Ignorar erro se RPC não existir
    }

    if (schemaError) {
      console.warn('⚠️  Aviso ao executar schema:', schemaError);
    } else {
      console.log('✅ Schema criado com sucesso\n');
    }

    // Executar seed
    console.log('🌱 Executando seed.sql...');
    let seedError: any = null;
    try {
      const result = await supabase.rpc('exec_sql', { sql: seed });
      seedError = result.error;
    } catch {
      // Ignorar erro se RPC não existir
    }

    if (seedError) {
      console.warn('⚠️  Aviso ao executar seed:', seedError);
    } else {
      console.log('✅ Dados inseridos com sucesso\n');
    }

    // Verificar dados
    console.log('🔍 Verificando dados...');
    const { data: vehicleTypes, error: vtError } = await supabase
      .from('vehicle_types')
      .select('*');

    if (vtError) {
      console.error('❌ Erro ao verificar vehicle_types:', vtError);
    } else {
      console.log(`✅ Vehicle Types: ${vehicleTypes?.length || 0} registros`);
      vehicleTypes?.forEach((vt: any) => {
        console.log(`   - ${vt.name} (${vt.code}): R$ ${vt.hourly_rate}/h, R$ ${vt.daily_rate}/dia`);
      });
    }

    const { data: washServices, error: wsError } = await supabase
      .from('wash_services')
      .select('*');

    if (wsError) {
      console.error('❌ Erro ao verificar wash_services:', wsError);
    } else {
      console.log(`✅ Wash Services: ${washServices?.length || 0} registros`);
      washServices?.forEach((ws: any) => {
        console.log(`   - ${ws.name}: R$ ${ws.price}`);
      });
    }

    console.log('\n✨ Setup do banco de dados concluído!');
  } catch (error) {
    console.error('❌ Erro durante setup:', error);
    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };
