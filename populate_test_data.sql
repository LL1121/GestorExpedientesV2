-- Script para cargar datos de prueba en la base de datos
-- Ejecutar desde la raíz del proyecto: sqlite3 app.db < populate_test_data.sql

-- EXPEDIENTES VENCIDOS
INSERT INTO expedientes (id, numero, año, tipo, asunto, descripcion, area_responsable, prioridad, fecha_inicio, fecha_vencimiento, archivo, nro_infogov, tema, estado, fecha_creacion, fecha_actualizacion)
VALUES 
('11111111-1111-1111-1111-111111111111', 'EXP-001', 2026, 'InfoGov', 'Solicitud de compra de materiales', 'Material para obras', 'Obras', 'ALTA', datetime('now', '-21 days'), datetime('now', '-5 days'), 'Construcción', '2024-001-456', 'Materiales', 'EnProceso', datetime('now'), datetime('now')),
('22222222-2222-2222-2222-222222222222', 'EXP-002', 2026, 'Interno', 'Resolución de conflicto laboral', 'Mediación entre partes', 'Recursos Humanos', 'ALTA', datetime('now', '-12 days'), datetime('now', '-3 days'), 'RRHH', NULL, 'Conflicto Laboral', 'Observado', datetime('now'), datetime('now')),
('33333333-3333-3333-3333-333333333333', 'EXP-003', 2026, 'InfoGov', 'Autorización de gastos especiales', 'Gastos para conferencia', 'Administración', 'MEDIA', datetime('now', '-21 days'), datetime('now', '-12 days'), 'Gastos', '2024-002-789', 'Gastos Especiales', 'EnProceso', datetime('now'), datetime('now'));

-- EXPEDIENTES PRÓXIMOS A VENCER
INSERT INTO expedientes (id, numero, año, tipo, asunto, descripcion, area_responsable, prioridad, fecha_inicio, fecha_vencimiento, archivo, nro_gde, tema, estado, fecha_creacion, fecha_actualizacion)
VALUES 
('44444444-4444-4444-4444-444444444444', 'EXP-004', 2026, 'Gde', 'Trámite de licencia municipal', 'Renovación anual', 'Legal', 'ALTA', datetime('now', '-12 days'), datetime('now', '+3 days'), 'Licencias', '2026-GDE-123', 'Licencia', 'Iniciado', datetime('now'), datetime('now')),
('55555555-5555-5555-5555-555555555555', 'EXP-005', 2026, 'InfoGov', 'Inspección de seguridad', 'Inspección anual', 'Seguridad', 'ALTA', datetime('now', '-12 days'), datetime('now', '+2 days'), 'Seguridad', '2024-003-123', 'Inspección', 'EnProceso', datetime('now'), datetime('now'));

-- ÓRDENES DE COMPRA (SIN PAGAR)
INSERT INTO expedientes (id, numero, año, tipo, asunto, descripcion, area_responsable, prioridad, fecha_inicio, fecha_vencimiento, archivo, tema, estado, oc_señor, oc_domicilio, oc_cuit, oc_descripcion_zona, oc_forma_pago, oc_plazo_entrega, fecha_creacion, fecha_actualizacion)
VALUES 
('66666666-6666-6666-6666-666666666666', 'PAG-001', 2026, 'Pago', 'Orden de compra - Equipos informáticos', 'Laptops y periféricos', 'Compras', 'MEDIA', datetime('now', '-12 days'), datetime('now', '+5 days'), 'Equipos', 'Equipamiento', 'EnProceso', 'Empresa XYZ', 'Calle Principal 123', '20-12345678-9', 'Centro', 'Transferencia', '15 días', datetime('now'), datetime('now')),
('77777777-7777-7777-7777-777777777777', 'PAG-002', 2026, 'Pago', 'Factura por servicios profesionales', 'Asesoría legal', 'Legal', 'MEDIA', datetime('now', '-21 days'), datetime('now', '+7 days'), 'Servicios', 'Asesoría', 'Iniciado', 'Estudio Jurídico ABC', 'Av. Reforma 456', '23-98765432-1', 'Norte', 'Cheque', 'Inmediato', datetime('now'), datetime('now'));

-- EXPEDIENTES PENDIENTES (sin fecha vencimiento, más de 14 días)
INSERT INTO expedientes (id, numero, año, tipo, asunto, descripcion, area_responsable, prioridad, fecha_inicio, fecha_vencimiento, archivo, tema, estado, fecha_creacion, fecha_actualizacion)
VALUES 
('88888888-8888-8888-8888-888888888888', 'EXP-009', 2026, 'Interno', 'Evaluación de ofertas de proveedores', 'Análisis de ofertas', 'Compras', 'MEDIA', datetime('now', '-21 days'), NULL, 'Proveedores', 'Ofertas', 'Iniciado', datetime('now'), datetime('now')),
('99999999-9999-9999-9999-999999999999', 'EXP-010', 2026, 'InfoGov', 'Revisión de documentación técnica', 'Auditoría técnica', 'Sistemas', 'MEDIA', datetime('now', '-18 days'), NULL, 'Sistemas', 'Auditoría', 'EnProceso', datetime('now'), datetime('now'));

-- Verificar inserción
SELECT COUNT(*) as total_expedientes FROM expedientes;
