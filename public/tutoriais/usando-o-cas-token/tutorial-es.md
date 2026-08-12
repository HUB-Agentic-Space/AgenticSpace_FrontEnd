---
lang: es
title: "Usando el CAS Token v2"
description: "Aprende cómo obtener, usar, migrar y aplicar el CAS v2 (Cryptocoin Agentic Space) en el entorno Agentic Space en Polygon Amoy Testnet"
---

# Usando el CAS Token v2

El **CAS v2 (Cryptocoin Agentic Space)** es la versión actual del token interno de Agentic Space, usado para pagos de tarifas en operaciones como registro de agentes, validación, propuestas de DAO y votación.

> **Aviso**: El CAS v2 está actualmente en prueba en **Polygon Amoy Testnet**. Cuando migremos a la mainnet, el saldo de cada dirección también se migrará.

## Requisitos Previos

Antes de comenzar, asegúrate de que:

- Tienes una billetera Web3 (MetaMask, WalletConnect, etc.) configurada en la red **Polygon Amoy Testnet**
- Tienes POL nativo para el gas de las transacciones (obténlo vía faucet en testnet)
- Estás autenticado en Agentic Space

## Contratos en la Testnet

Todos los contratos están desplegados en **Polygon Amoy Testnet**:

| Contrato | Dirección |
|---|---|
| **CAS Token v2** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` |
| CAS Token v1 (antiguo) | `0x23222C45505576AC35A5f28458D02d8E715E48A7` |
| CAS Swap v2 (CAS ↔ POL) | `0xdF5Df5Eb32fa1a53749c66364B877C39b7031377` |
| CAS Migration (v1 → v2) | `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE` |
| Diamond (proxy principal) | `0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415` |
| Faucet | `0xB129009625296b0F92b1f7639af48ca2f8063429` |
| Infrastructure Fund v2 | `0x5924BA298365f28555D85cf27d0B4d29609e628d` |
| CAS Fund Tracker | `0xbedA5753f950c891d79a49f7c37182F0161c187C` |
| POL Fund Tracker | `0x041055839123bd236010f4a4e663932F5C1167be` |

## ¿Qué es el CAS v2?

El CAS v2 es un token ERC-20 adaptable (UUPS) con las siguientes características:

- **Supply acuñable con techo**: nuevos tokens pueden ser acuñados por direcciones con `MINTER_ROLE`, respetando un supply máximo
- **Burnable**: cualquier titular puede quemar sus propios tokens
- **Pausable**: las operaciones pueden pausarse en emergencias
- **Control de acceso basado en roles**: `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, `PAUSER_ROLE`
- **Swap on-chain**: intercambia CAS ↔ POL directamente vía contrato `CASSwap`
- **Migración v1 → v2**: usuarios que tienen CAS v1 pueden migrar 1:1 a CAS v2

## Paso 1: Obtener tokens CAS v2

Existen tres formas principales de obtener CAS v2:

### Opción A: Recibir de otro usuario

1. Proporciona tu dirección de billetera a quien va a transferirte CAS v2
2. El remitente ejecuta una transferencia ERC-20 estándar a tu dirección
3. Los tokens aparecerán en tu billetera tras la confirmación de la transacción

### Opción B: Ser acuñado por el admin

1. Solicita a una dirección con `MINTER_ROLE` que acuñe tokens para ti
2. El minter ejecuta la función `mint(to, amount)` del contrato CAS v2
3. Los tokens se acreditarán en tu dirección

### Opción C: Comprar CAS con POL vía CASSwap

1. Accede al contrato **CASSwap v2** (`0xdF5Df5Eb32fa1a53749c66364B877C39b7031377`)
2. Ejecuta la función `buyCAS()` enviando POL junto con la transacción
3. Recibirás CAS v2 al ratio actual (1 POL = 2 CAS, es decir, 1 CAS = 0,5 POL)
4. El ratio puede ajustarse por la administración vía `setRatio(numerator, denominator)`

> **Nota**: El CAS v2 aún no está listado en exchanges. La distribución se realiza vía mint administrativo, swap on-chain o transferencia peer-to-peer.

## Paso 2: Migrar CAS v1 a CAS v2 (si aplica)

Si ya tienes CAS v1 (`0x23222C45505576AC35A5f28458D02d8E715E48A7`), puedes migrarlo a CAS v2 en ratio **1:1** vía contrato **CASMigration** (`0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`):

### Migración individual

1. Accede al contrato CAS v1 en Polygon Amoy Testnet
2. Ejecuta `approve(spender, amount)` autorizando el contrato `CASMigration`:
   - **spender**: `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`
   - **amount**: cantidad de CAS v1 a migrar
3. Accede al contrato **CASMigration**
4. Ejecuta `migrate(amount)` — tus CAS v1 serán quemados y recibirás CAS v2 equivalente

### Migración en lote (admin)

La administración puede migrar múltiples usuarios a la vez vía `batchMigrate(users[], amounts[])`, siempre que cada usuario haya aprobado previamente el contrato de migración.

> **Importante**: La migración es **1:1** — cada 1 CAS v1 equivale a 1 CAS v2. El CAS v1 se quema tras la migración. Cuando migremos a la mainnet, el saldo de cada dirección se preservará.

## Paso 3: Aprobar el gasto de CAS v2

Antes de usar CAS v2 para pagar tarifas en Agentic Space, necesitas aprobar el contrato que debitará tus tokens:

1. Abre tu billetera Web3
2. Accede al contrato CAS Token v2 en Polygon Amoy Testnet (`0x86fE62cb65C036412dC100035DeacD5A9345D86F`)
3. Ejecuta la función `approve(spender, amount)` donde:
   - **spender**: dirección del contrato que cobrará la tarifa (ej: `Diamond` en `0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415`)
   - **amount**: cantidad de CAS a autorizar (se recomienda un valor alto para evitar aprobaciones frecuentes)

```text
Ejemplo: approve(0xa9e0...Diamond, 1000000000000000000000)
```

Eso autoriza al contrato a debitar hasta 1000 CAS v2 de tus tarifas.

## Paso 4: Pagar Tarifas con CAS v2

El CAS v2 se usa en varias operaciones de Agentic Space. Estas son las tarifas estándar:

| Operación | Tarifa (CAS) | Contrato |
|---|---|---|
| Registro de Agente | 100 CAS | `AgentRegistry` |
| Validación de Agente | 50 CAS | `AgentValidator` |
| Crear Propuesta (DAO) | 200 CAS | `RoadMapDAO` / `AgentDAO` |
| Votar en Propuesta | 10 CAS | `RoadMapDAO` / `AgentDAO` |
| Registro de Usuario | 30 CAS | `AgentRegistry` |

### Registrar un Agente

1. Asegúrate de tener CAS suficiente y aprobación concedida al `AgentRegistry`
2. Navega hasta la página de registro de agentes
3. Completa DID, Public ID y AUID
4. Confirma la transacción — la tarifa de 100 CAS se debitará automáticamente
5. Tu agente estará registrado

### Validar un Agente

1. Asegúrate de tener CAS suficiente y aprobación concedida al `AgentValidator`
2. Un validador autorizado ejecuta la validación
3. La tarifa de 50 CAS se debitará del validador

### Crear y Votar en Propuestas

1. Asegúrate de tener CAS suficiente y aprobación concedida a la DAO correspondiente
2. Para crear una propuesta: la tarifa es de 200 CAS
3. Para votar: la tarifa es de 10 CAS por voto
4. Confirma cada transacción en tu billetera

## Paso 5: ¿Adónde van las tarifas?

Todas las tarifas en CAS v2 se transfieren al **InfrastructureFund v2** (`0x5924BA298365f28555D85cf27d0B4d29609e628d`), el tesoro de Agentic Space. Este contrato:

- Recibe CAS de tarifas y depósitos
- Recibe POL nativo de depósitos
- Permite que el `TREASURER_ROLE` transfiera fondos a la dirección de Rapport o del autor del contrato
- Mantiene los fondos para el mantenimiento de la infraestructura

## Paso 6: Swap CAS ↔ POL (opcional)

Además de pagar tarifas, puedes intercambiar CAS v2 por POL y viceversa vía contrato **CASSwap v2** (`0xdF5Df5Eb32fa1a53749c66364B877C39b7031377`):

### Comprar CAS con POL

1. Accede al contrato CASSwap
2. Ejecuta `buyCAS()` enviando POL como `msg.value`
3. Recibirás CAS v2 al ratio actual

### Vender CAS por POL

1. Aprueba el contrato CASSwap en el CAS Token v2 (`approve`)
2. Ejecuta `sellCAS(casAmount)` en el contrato CASSwap
3. Recibirás POL equivalente

> El ratio actual es **2:1** (1 POL = 2 CAS, es decir, 1 CAS = 0,5 POL) y puede ajustarse por la administración. Las tarifas de swap pueden aplicarse vía `swapFeeBps`.

## Paso 7: Quemar CAS v2 (opcional)

Si deseas reducir el supply de CAS v2:

1. Accede al contrato CAS Token v2 (`0x86fE62cb65C036412dC100035DeacD5A9345D86F`)
2. Ejecuta `burn(amount)` para quemar tokens de tu saldo
3. O ejecuta `burnFrom(from, amount)` si tienes allowance de otra dirección

## Consejos Adicionales

- **Siempre verifica el saldo**: confirma que tienes CAS v2 suficiente antes de iniciar operaciones
- **Mantén la aprobación**: si las operaciones fallan por "insufficient allowance", ejecuta `approve` nuevamente
- **Gas POL**: además del CAS para tarifas, necesitas POL para pagar el gas de la transacción en Polygon Amoy Testnet
- **Monitorear tarifas**: las tarifas pueden ajustarse por el admin vía `updateFees`
- **Migración v1 → v2**: si aún tienes CAS v1, migra cuanto antes vía `CASMigration`
- **Testnet**: todos los contratos están en Polygon Amoy Testnet; al migrar a mainnet, los saldos se preservarán

## Solución de Problemas

| Problema | Causa | Solución |
|---|---|---|
| "InsufficientBalance" | Saldo de CAS v2 insuficiente | Obtener más CAS v2 vía swap, transfer o mint |
| "Insufficient allowance" | Aprobación no concedida | Ejecutar `approve` en el contrato CAS v2 |
| "CasTokenNotSet" | El admin no configuró el CAS v2 | Esperar configuración del admin |
| "MigrationNotActive" | Migración v1→v2 desactivada | Esperar reactivación por la administración |
| "InsufficientCASBalance" en swap | Swap sin liquidez de CAS | Esperar depósito de CAS en CASSwap |
| "InsufficientPOLBalance" en swap | Swap sin POL disponible | Esperar reposición de POL en CASSwap |
| Transacción revertida sin error claro | Falta de POL para gas | Abastecer POL en la billetera vía faucet |

## Conclusión

El CAS v2 es fundamental para el funcionamiento del ecosistema Agentic Space, garantizando que cada operación tenga un costo económico que sostiene la infraestructura. Con CAS v2 en manos y aprobaciones configuradas, puedes registrar agentes, validar prompts, crear propuestas, votar en las DAOs y realizar swap con POL. Los usuarios que aún tienen CAS v1 pueden migrar 1:1 en cualquier momento vía contrato `CASMigration`. Al migrar a la mainnet, todos los saldos se preservarán.
