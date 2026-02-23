#!/usr/bin/env python3
import sqlite3
import json
from datetime import datetime, timedelta

# Conectar a la BD
conn = sqlite3.connect('app.db')
cursor = conn.cursor()

# Obtener todos los expedientes
cursor.execute("SELECT id, numero, año, tipo, estado, fecha_vencimiento, fecha_inicio FROM expedientes")
expedientes = cursor.fetchall()

print(f"\n📊 Total expedientes: {len(expedientes)}\n")

# Analizar notificaciones
hoy = datetime.now().date()
vencidos = []
proximos = []
sin_pagar = []
pendientes = []

for exp in expedientes:
    exp_id, numero, año, tipo, estado, fecha_venc, fecha_inicio = exp
    
    print(f"📄 {numero}-{año}")
    print(f"   Tipo: {tipo}, Estado: {estado}")
    
    # Vencidos
    if fecha_venc:
        fecha_venc_dt = datetime.fromisoformat(fecha_venc.replace('Z', '+00:00')).date()
        print(f"   Vencimiento: {fecha_venc_dt}")
        
        if fecha_venc_dt < hoy:
            dias_vencido = (hoy - fecha_venc_dt).days
            print(f"   ⚠️ VENCIDO hace {dias_vencido} días")
            vencidos.append((numero, año, dias_vencido))
        else:
            dias_para_vencer = (fecha_venc_dt - hoy).days
            if 0 < dias_para_vencer <= 7:
                print(f"   ⏰ Próximo a vencer en {dias_para_vencer} días")
                proximos.append((numero, año, dias_para_vencer))
    
    # Sin pagar
    if tipo == "PAGO" and estado != "FINALIZADO":
        print(f"   💰 SIN PAGAR")
        sin_pagar.append((numero, año))
    
    # Pendientes
    if estado in ["INICIADO", "ENPROCESO"]:
        fecha_inicio_dt = datetime.fromisoformat(fecha_inicio.replace('Z', '+00:00')).date()
        dias_pendiente = (hoy - fecha_inicio_dt).days
        if dias_pendiente > 14:
            print(f"   ⏳ PENDIENTE ({dias_pendiente} días)")
            pendientes.append((numero, año, dias_pendiente))
    
    print()

print("\n" + "="*60)
print("📊 RESUMEN DE NOTIFICACIONES")
print("="*60)
print(f"🔴 Vencidos: {len(vencidos)}")
for num, año, dias in vencidos:
    print(f"   • {num}-{año} (hace {dias} días)")

print(f"\n⏰ Próximos a vencer: {len(proximos)}")
for num, año, dias in proximos:
    print(f"   • {num}-{año} (en {dias} días)")

print(f"\n💰 Sin pagar: {len(sin_pagar)}")
for num, año in sin_pagar:
    print(f"   • {num}-{año}")

print(f"\n⏳ Pendientes: {len(pendientes)}")
for num, año, dias in pendientes:
    print(f"   • {num}-{año} ({dias} días)")

print("\n" + "="*60 + "\n")

conn.close()
