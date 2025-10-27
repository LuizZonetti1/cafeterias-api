-- ===== MIGRATION SIMPLIFICADA: Apenas adicionar novos valores aos enums =====
-- PostgreSQL requer COMMIT entre adicionar enum values e usá-los
-- Por isso esta migration apenas adiciona os valores, a próxima fará a migração dos dados

ALTER TYPE "TipoUser" ADD VALUE IF NOT EXISTS 'GARCOM';
ALTER TYPE "TipoUser" ADD VALUE IF NOT EXISTS 'COZINHA';

ALTER TYPE "WasteReason" ADD VALUE IF NOT EXISTS 'VENCIDO';
ALTER TYPE "WasteReason" ADD VALUE IF NOT EXISTS 'DETERIORADO';
ALTER TYPE "WasteReason" ADD VALUE IF NOT EXISTS 'CONTAMINADO';
ALTER TYPE "WasteReason" ADD VALUE IF NOT EXISTS 'QUEBRA';
ALTER TYPE "WasteReason" ADD VALUE IF NOT EXISTS 'DESPERDICIO_PREPARO';
ALTER TYPE "WasteReason" ADD VALUE IF NOT EXISTS 'OUTROS';

ALTER TYPE "MovementType" ADD VALUE IF NOT EXISTS 'SAIDA_PEDIDO';
