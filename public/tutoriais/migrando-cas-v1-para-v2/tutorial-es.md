---
lang: es
title: "Migrando CAS v1 a CAS v2 y Usando los Nuevos Contratos"
description: "Guía completa para migrar tus tokens CAS v1 a CAS v2, comprar vía CASSwap v2 con ratio 2:1, y usar todos los nuevos contratos desplegados en Polygon Amoy Testnet"
---

# Migrando CAS v1 a CAS v2 y Usando los Nuevos Contratos

Este tutorial explica cómo **migrar tus tokens CAS v1 a CAS v2** en ratio 1:1, cómo **comprar CAS v2 con POL** vía CASSwap v2 (ratio 2:1), y cómo usar los nuevos contratos desplegados en Polygon Amoy Testnet.

## Requisitos Previos

- MetaMask instalada y configurada en la red **Polygon Amoy Testnet**
- Poseer tokens CAS v1 (dirección `0x23222C45505576AC35A5f28458D02d8E715E48A7`)
- POL nativo para el gas de las transacciones

---

## Contratos Actualizados (Amoy Testnet)

| Contrato | Dirección | Función |
|---|---|---|
| **CAS Token v2** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` | Token nuevo con MAX_SUPPLY 10M |
| **CAS Token v1** (antiguo) | `0x23222C45505576AC35A5f28458D02d8E715E48A7` | Token antiguo, será descontinuado |
| **CASMigration** | `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE` | Migración v1 → v2 (1:1) |
| **CASSwap v2** | `0xdF5Df5Eb32fa1a53749c66364B877C39b7031377` | Swap CAS ↔ POL (ratio 2:1) |
| **InfrastructureFund v2** | `0x5924BA298365f28555D85cf27d0B4d29609e628d` | Treasury con `receive()` |
| **Diamond** | `0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415` | Proxy principal (registra todos) |

> Todos los contratos anteriores están registrados en el Diamond vía `ContractRegistryFacet`.

---

## Parte 1: Migrar CAS v1 a CAS v2

La migración es **1:1** — cada 1 CAS v1 equivale a 1 CAS v2. El CAS v1 se envía a `0xdead` (quemado) y recibes CAS v2 del contrato de migración.

### Paso 1: Aprobar el CASMigration en CAS v1

Antes de migrar, necesitas autorizar al contrato CASMigration a gastar tus CAS v1:

1. Accede al CAS v1 en Polygonscan: https://amoy.polygonscan.com/token/0x23222C45505576AC35A5f28458D02d8E715E48A7#writeContract
2. Conecta tu MetaMask
3. Ve a **Write Contract** → `approve`
4. Completa:
   - **spender**: `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`
   - **amount**: cantidad de CAS v1 en wei (ej: `100000000000000000000` = 100 CAS)
5. Confirma la transacción en MetaMask

### Paso 2: Ejecutar la migración

1. Accede al CASMigration en Polygonscan: https://amoy.polygonscan.com/address/0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE#writeContract
2. Conecta tu MetaMask
3. Ve a **Write Contract** → `migrate`
4. Completa:
   - **amount**: la misma cantidad aprobada en el Paso 1 (ej: `100000000000000000000` = 100 CAS)
5. Confirma la transacción

### Paso 3: Verificar

Tras la confirmación:
- Tu saldo de CAS v1 será **0** (tokens quemados)
- Tu saldo de CAS v2 será igual a la cantidad migrada
- Importa el CAS v2 en MetaMask: `0x86fE62cb65C036412dC100035DeacD5A9345D86F`

> **Importante**: La migración es **irreversible**. Una vez que el CAS v1 se migra, no se puede deshacer.

### Migración en lote (para admins)

Si eres owner del CASMigration, puedes migrar múltiples usuarios a la vez:

```
batchMigrate(
  ["0xdireccion1", "0xdireccion2"],
  ["100000000000000000000", "50000000000000000000"]
)
```

Cada usuario debe haber aprobado previamente el CASMigration.

---

## Parte 2: Comprar CAS v2 con POL vía CASSwap v2

El CASSwap v2 permite comprar CAS v2 enviando POL. El ratio actual es **2:1** (1 POL = 2 CAS, es decir, 1 CAS = 0,5 POL).

### Comprar CAS (buyCAS)

1. Accede al CASSwap v2: https://amoy.polygonscan.com/address/0xdF5Df5Eb32fa1a53749c66364B877C39b7031377#writeContract
2. Conecta tu MetaMask
3. Ve a **Write Contract** → `buyCAS`
4. En **Value (POL)**, inserta la cantidad de POL (ej: `0.001` POL → recibirás `0.002` CAS)
5. Confirma la transacción

### Vender CAS por POL (sellCAS)

1. Aprueba el CASSwap v2 en el CAS Token v2:
   - Accede al CAS v2: https://amoy.polygonscan.com/token/0x86fE62cb65C036412dC100035DeacD5A9345D86F#writeContract
   - `approve("0xdF5Df5Eb32fa1a53749c66364B877C39b7031377", amount)`
2. Accede al CASSwap v2 → **Write Contract** → `sellCAS`
3. Completa la cantidad de CAS a vender (ej: `2000000000000000000` = 2 CAS → recibirás 1 POL)
4. Confirma la transacción

> **Nota**: El CASSwap necesita tener POL disponible para vender. Si no hay POL suficiente, la transacción se revertirá con `InsufficientPOLBalance`.

---

## Parte 3: Registrar CAS v2 en MetaMask

Si aún no registraste el CAS v2:

1. Abre MetaMask en la red **Polygon Amoy Testnet**
2. Haz clic en **Import tokens** > **Custom Token**
3. Completa:

| Campo | Valor |
|---|---|
| **Token Contract Address** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` |
| **Token Symbol** | `CAS` (auto) |
| **Token Decimal** | `18` (auto) |

4. Haz clic en **Import Tokens**

---

## Parte 4: Verificar Saldo de la Migración

Para verificar cuánto CAS v2 está disponible para migración:

1. Accede al CASMigration: https://amoy.polygonscan.com/address/0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE#readContract
2. Ve a **Read Contract**
3. `availableNewCAS()` — devuelve el saldo de CAS v2 disponible
4. `totalMigrated()` — devuelve cuánto ya se migró en total
5. `migrationActive()` — devuelve `true` si la migración está activa

---

## Parte 5: Consultar Contratos en el Diamond

Todos los contratos están registrados en el Diamond. Para consultar:

1. Accede al Diamond: https://amoy.polygonscan.com/address/0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415#readContract
2. Ve a **Read Contract** → `getAddress`
3. Escribe el nombre del contrato:
   - `CASToken` → devuelve `0x86fE62cb65C036412dC100035DeacD5A9345D86F`
   - `InfrastructureFund` → devuelve `0x5924BA298365f28555D85cf27d0B4d29609e628d`
   - `CASSwap` → devuelve `0xdF5Df5Eb32fa1a53749c66364B877C39b7031377`
   - `CASMigration` → devuelve `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`

---

## Solución de Problemas

| Problema | Causa | Solución |
|---|---|---|
| `MigrationNotActive` | Migración desactivada por el admin | Esperar reactivación |
| `ZeroAmount` | Intentó migrar 0 CAS | Especificar un valor mayor que 0 |
| Transacción revertida sin error | No aprobó el CAS v1 primero | Ejecutar `approve` en CAS v1 antes de `migrate` |
| `InsufficientPOLBalance` en sellCAS | CASSwap sin POL suficiente | Esperar reposición de POL en el swap |
| `InsufficientCASBalance` en buyCAS | CASSwap sin CAS suficiente | Esperar depósito de CAS en el swap |
| CAS v2 no aparece en MetaMask | Token no importado | Sigue la Parte 3 para importar |
| Saldo CAS v1 no se anula tras migrate | Transacción no confirmada | Verifica el estado en Polygonscan |

---

## Resumen

| Acción | Contrato | Función |
|---|---|---|
| Aprobar migración | CAS v1 | `approve(migrationAddr, amount)` |
| Migrar v1 → v2 | CASMigration | `migrate(amount)` |
| Comprar CAS con POL | CASSwap v2 | `buyCAS()` con `msg.value` = POL |
| Vender CAS por POL | CASSwap v2 | `sellCAS(amount)` (requiere `approve` previo) |
| Ver saldo de migración | CASMigration | `availableNewCAS()` |
| Ver ratio del swap | CASSwap v2 | `getRatio()` |

## Conclusión

La migración de CAS v1 a v2 es simple y segura: aprueba, migra, y tus nuevos tokens estarán disponibles. El CASSwap v2 con ratio 2:1 (1 POL = 2 CAS) hace el CAS más accesible en la fase inicial. Todos los contratos están registrados en el Diamond, garantizando descubrimiento automático por el backend y frontend de Agentic Space.
