---
lang: es
title: "Agregando el CAS v2 y Fund Trackers en MetaMask"
description: "Aprende paso a paso cómo agregar el CAS v2, el Agentic CAS Fund (aCAS) y el Agentic POL Fund (aPOL) en tu billetera MetaMask para visualizar saldos y seguir el fondo de infraestructura"
---

# Agregando el CAS v2 y Fund Trackers en MetaMask

Este tutorial explica cómo agregar el **CAS Token v2** y los **Fund Trackers** (wrappers que reflejan el saldo del fondo de infraestructura) en tu billetera **MetaMask**, permitiéndote ver tus saldos directamente en la billetera.

## Requisitos Previos

- MetaMask instalada (extensión del navegador o app móvil)
- Red **Polygon Amoy Testnet** configurada en MetaMask
- Tu dirección de billetera configurada como admin de los Fund Trackers (si quieres ver los saldos del fondo)

---

## Parte 1: Configurar Polygon Amoy Testnet en MetaMask

Si aún no tienes la red de prueba configurada:

1. Abre MetaMask
2. Haz clic en el selector de red en la parte superior (generalmente muestra "Ethereum Mainnet")
3. Haz clic en **Add Network** > **Add a network manually**
4. Completa los datos:

| Campo | Valor |
|---|---|
| **Network Name** | Polygon Amoy Testnet |
| **RPC URL** | `https://rpc-amoy.polygon.technology` |
| **Chain ID** | `80002` |
| **Currency Symbol** | `POL` |
| **Block Explorer URL** | `https://www.oklink.com/amoy` |

5. Haz clic en **Save**

> ¡Listo! Tu MetaMask ahora está conectada a Polygon Amoy Testnet.

---

## Parte 2: Agregar el CAS Token v2 en MetaMask

El CAS v2 es el token principal de Agentic Space. Para verlo en tu billetera:

1. Abre MetaMask
2. Asegúrate de que la red seleccionada sea **Polygon Amoy Testnet**
3. En la pantalla principal, desplázate hacia abajo hasta la sección **Tokens**
4. Haz clic en **Import tokens** (o **Add Token**)
5. Selecciona la pestaña **Custom Token**
6. Completa los datos:

| Campo | Valor |
|---|---|
| **Token Contract Address** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` |
| **Token Symbol** | `CAS` (completado automáticamente) |
| **Token Decimal** | `18` (completado automáticamente) |

7. Haz clic en **Import Tokens** (o **Add Token**)

> El CAS v2 aparecerá en tu lista de tokens con el saldo actual de tu dirección.

### Detalles del CAS Token v2

- **Nombre**: Cryptocoin Agentic Space
- **Símbolo**: CAS
- **Decimales**: 18
- **Supply máximo**: 10.000.000 CAS
- **Dirección del contrato**: `0x86fE62cb65C036412dC100035DeacD5A9345D86F`

---

## Parte 3: Agregar el Agentic CAS Fund (aCAS) en MetaMask

El **Agentic CAS Fund (aCAS)** es un token ERC-20 especial que **refleja el saldo de CAS** custodiado por el InfrastructureFund. Permite seguir cuánto CAS hay en el fondo de infraestructura directamente en MetaMask.

> **Importante**: Solo el **admin** (owner) del Fund Tracker ve el saldo del fondo. Otras direcciones verán saldo 0. El token aCAS **no es transferible** — solo refleja el saldo del fondo.

### Paso a paso

1. Abre MetaMask
2. Asegúrate de que la red sea **Polygon Amoy Testnet**
3. Haz clic en **Import tokens** > **Custom Token**
4. Completa los datos:

| Campo | Valor |
|---|---|
| **Token Contract Address** | `0xbedA5753f950c891d79a49f7c37182F0161c187C` |
| **Token Symbol** | `aCAS` (completado automáticamente) |
| **Token Decimal** | `18` (completado automáticamente) |

5. Haz clic en **Import Tokens**

### Cómo funciona el aCAS

- El `totalSupply()` del aCAS devuelve el saldo de CAS en el InfrastructureFund
- El `balanceOf()` del admin devuelve el total del fondo; otras direcciones devuelven 0
- Cuando CAS se deposita en el InfrastructureFund, el saldo del aCAS aumenta
- Cuando CAS se retira del InfrastructureFund (por el `TREASURER_ROLE`), el saldo del aCAS disminuye
- El aCAS **no puede ser transferido, aprobado o enviado** — es solo un reflejo del saldo

### Detalles del Agentic CAS Fund

- **Nombre**: Agentic CAS Fund
- **Símbolo**: aCAS
- **Decimales**: 18
- **Dirección del contrato**: `0xbedA5753f950c891d79a49f7c37182F0161c187C`
- **InfrastructureFund rastreado**: `0x5924BA298365f28555D85cf27d0B4d29609e628d`
- **Tipo de activo**: CAS (ERC-20)

---

## Parte 4: Agregar el Agentic POL Fund (aPOL) en MetaMask

El **Agentic POL Fund (aPOL)** es el equivalente al aCAS, pero refleja el saldo de **POL nativo** custodiado por el InfrastructureFund.

### Paso a paso

1. Abre MetaMask
2. Asegúrate de que la red sea **Polygon Amoy Testnet**
3. Haz clic en **Import tokens** > **Custom Token**
4. Completa los datos:

| Campo | Valor |
|---|---|
| **Token Contract Address** | `0x041055839123bd236010f4a4e663932F5C1167be` |
| **Token Symbol** | `aPOL` (completado automáticamente) |
| **Token Decimal** | `18` (completado automáticamente) |

5. Haz clic en **Import Tokens**

### Cómo funciona el aPOL

- El `totalSupply()` del aPOL devuelve el saldo de POL en el InfrastructureFund
- El `balanceOf()` del admin devuelve el total del fondo; otras direcciones devuelven 0
- Cuando POL se deposita en el InfrastructureFund (`depositNative()`), el saldo del aPOL aumenta
- Cuando POL se retira del InfrastructureFund (por el `TREASURER_ROLE`), el saldo del aPOL disminuye
- El aPOL **no puede ser transferido, aprobado o enviado** — es solo un reflejo del saldo

### Detalles del Agentic POL Fund

- **Nombre**: Agentic POL Fund
- **Símbolo**: aPOL
- **Decimales**: 18
- **Dirección del contrato**: `0x041055839123bd236010f4a4e663932F5C1167be`
- **InfrastructureFund rastreado**: `0x5924BA298365f28555D85cf27d0B4d29609e628d`
- **Tipo de activo**: POL (nativo)

---

## Parte 5: Siguiendo el Fondo de Infraestructura

Tras agregar los tres tokens (CAS, aCAS y aPOL) en MetaMask, puedes seguir:

| Token | Qué muestra | Quién lo ve |
|---|---|---|
| **CAS** | Tu saldo personal de CAS v2 | Cualquier dirección |
| **aCAS** | Saldo de CAS en el InfrastructureFund v2 | Solo el admin del tracker |
| **aPOL** | Saldo de POL en el InfrastructureFund v2 | Solo el admin del tracker |

### Verificar saldos vía Block Explorer

También puedes verificar los saldos directamente en el block explorer:

1. Accede al explorer de Polygon Amoy: `https://www.oklink.com/amoy`
2. Pega la dirección del InfrastructureFund v2: `0x5924BA298365f28555D85cf27d0B4d29609e628d`
3. Verás:
   - **Token Holdings**: saldo de CAS v2 en el fondo
   - **POL Balance**: saldo de POL nativo en el fondo
4. Para verificar los Fund Trackers, busca por las direcciones:
   - aCAS: `0xbedA5753f950c891d79a49f7c37182F0161c187C`
   - aPOL: `0x041055839123bd236010f4a4e663932F5C1167be`

### Verificar saldos vía contrato (Read Contract)

Si quieres consultar los saldos directamente en los contratos:

1. Accede al InfrastructureFund en el block explorer
2. Ve a **Contract** > **Read Contract**
3. Llama `casBalance()` para ver el saldo de CAS
4. Llama `nativeBalance()` para ver el saldo de POL

O consulta los Fund Trackers:

1. Accede al contrato aCAS o aPOL en el block explorer
2. Ve a **Contract** > **Read Contract**
3. Llama `totalSupply()` para ver el saldo total rastreado
4. Llama `balanceOf(tu_direccion)` para ver si eres el admin

---

## Parte 6: Transferir la propiedad del Fund Tracker

Si eres el admin actual de los Fund Trackers y deseas pasar la visualización a otra dirección:

1. Accede al contrato del Fund Tracker (aCAS o aPOL) en el block explorer
2. Ve a **Contract** > **Write Contract**
3. Conecta tu billetera (debe ser el admin actual)
4. Llama `transferOwnership(nueva_direccion)`
5. Confirma la transacción

> Tras la transferencia, la nueva dirección verá el saldo del fondo en MetaMask, y la dirección anterior verá 0. Esto **no afecta** al InfrastructureFund — solo cambia quién puede visualizar el saldo.

---

## Resumen de Direcciones

| Contrato | Dirección | Símbolo |
|---|---|---|
| CAS Token v2 | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` | CAS |
| Agentic CAS Fund | `0xbedA5753f950c891d79a49f7c37182F0161c187C` | aCAS |
| Agentic POL Fund | `0x041055839123bd236010f4a4e663932F5C1167be` | aPOL |
| InfrastructureFund v2 | `0x5924BA298365f28555D85cf27d0B4d29609e628d` | — |

---

## Solución de Problemas

| Problema | Causa | Solución |
|---|---|---|
| El token no aparece tras importar | Red incorrecta en MetaMask | Verifica que estés en Polygon Amoy Testnet |
| Saldo aCAS/aPOL muestra 0 | No eres el admin del tracker | Solicita `transferOwnership` del admin actual |
| "FundTracker: non-transferable" al intentar enviar | Los Fund Trackers no son transferibles | Esto es esperado — los trackers solo reflejan saldos |
| El CAS no aparece tras recibir | El token no fue importado | Sigue la Parte 2 para importar el CAS v2 |
| El saldo de CAS aparece como 0 | Dirección sin tokens | Obtén CAS vía swap, mint o transferencia |

---

## Conclusión

Con el CAS v2, aCAS y aPOL agregados en MetaMask, tienes visibilidad completa:

- **CAS**: tu saldo personal para operaciones en Agentic Space
- **aCAS**: cuánto CAS hay en el fondo de infraestructura (si eres admin)
- **aPOL**: cuánto POL hay en el fondo de infraestructura (si eres admin)

Los Fund Trackers son una forma elegante de monitorear la salud financiera del ecosistema Agentic Space directamente en tu billetera, sin necesidad de acceder al block explorer en cada consulta.
