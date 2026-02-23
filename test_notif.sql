-- Test query for notifications
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN tipo = 'PAGO' AND estado != 'FINALIZADO' THEN 1 ELSE 0 END) as sin_pagar,
    SUM(CASE WHEN fecha_vencimiento < datetime('now') THEN 1 ELSE 0 END) as vencidos,
    SUM(CASE WHEN fecha_vencimiento BETWEEN datetime('now') AND datetime('now', '+7 days') THEN 1 ELSE 0 END) as proximos,
    SUM(CASE WHEN (estado = 'INICIADO' OR estado = 'ENPROCESO') AND julianday('now') - julianday(fecha_inicio) > 14 THEN 1 ELSE 0 END) as pendientes
FROM expedientes;
