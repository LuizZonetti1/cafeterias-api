# 📡 Guia de Integração WebSocket - Frontend

## 🚀 Como Conectar ao WebSocket

### 1. Instalar Socket.IO Client

```bash
# React / Vue / Angular
npm install socket.io-client

# HTML puro (CDN)
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
```

---

## 📋 Exemplo React - Hook useWebSocket

### `src/hooks/useWebSocket.js`

```javascript
import { useEffect, useState, useCallback } from 'react'
import io from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333'

export function useWebSocket() {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      console.warn('⚠️ Token não encontrado. Não é possível conectar ao WebSocket.')
      return
    }

    // Conectar ao WebSocket
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    // Evento: Conexão estabelecida
    newSocket.on('connect', () => {
      console.log('✅ WebSocket conectado:', newSocket.id)
      setIsConnected(true)
    })

    // Evento: Confirmação de conexão do servidor
    newSocket.on('connected', (data) => {
      console.log('🎉 Conectado com sucesso:', data)
    })

    // ===== NOTIFICAÇÕES =====

    // Evento: Nova notificação de estoque baixo
    newSocket.on('notification:created', (data) => {
      console.log('🔔 Nova notificação:', data)

      setNotifications(prev => [data.notification, ...prev])

      // Mostrar toast/alerta
      showToast('⚠️ Alerta de Estoque', data.notification.message, 'warning')

      // Tocar som (opcional)
      playNotificationSound()
    })

    // ===== PEDIDOS =====

    // Evento: Novo pedido criado
    newSocket.on('order:created', (data) => {
      console.log('📋 Novo pedido:', data)

      setOrders(prev => [data.order, ...prev])

      // Toast + som para COZINHA
      showToast('Novo Pedido!', data.message, 'info')
      playOrderSound()
    })

    // Evento: Status do pedido atualizado
    newSocket.on('order:updated', (data) => {
      console.log('🔄 Pedido atualizado:', data)

      setOrders(prev =>
        prev.map(order =>
          order.id === data.orderId
            ? { ...order, status_order: data.newStatus }
            : order
        )
      )

      showToast('Status Atualizado', data.message, 'info')
    })

    // Evento: Pedido finalizado
    newSocket.on('order:completed', (data) => {
      console.log('✅ Pedido finalizado:', data)

      setOrders(prev =>
        prev.map(order =>
          order.id === data.orderId
            ? { ...order, status_order: 'COMPLETED' }
            : order
        )
      )

      showToast('Pedido Concluído!', data.message, 'success')
    })

    // Evento: Pedido cancelado
    newSocket.on('order:cancelled', (data) => {
      console.log('❌ Pedido cancelado:', data)

      setOrders(prev =>
        prev.map(order =>
          order.id === data.orderId
            ? { ...order, status_order: 'CANCELLED' }
            : order
        )
      )

      showToast('Pedido Cancelado', data.message, 'error')
    })

    // ===== EVENTOS DE CONEXÃO =====

    // Evento: Desconectado
    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket desconectado:', reason)
      setIsConnected(false)
    })

    // Evento: Erro de conexão
    newSocket.on('connect_error', (error) => {
      console.error('❌ Erro ao conectar WebSocket:', error.message)
      setIsConnected(false)

      if (error.message.includes('Authentication error')) {
        console.warn('⚠️ Token inválido. Faça login novamente.')
        // Redirecionar para login
        window.location.href = '/login'
      }
    })

    // Evento: Reconectado
    newSocket.on('reconnect', (attemptNumber) => {
      console.log('✅ WebSocket reconectado na tentativa', attemptNumber)
      setIsConnected(true)
    })

    setSocket(newSocket)

    // Cleanup ao desmontar componente
    return () => {
      console.log('🔌 Desconectando WebSocket...')
      newSocket.close()
    }
  }, [])

  // Função para emitir ping (teste de conexão)
  const ping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('ping')
      socket.on('pong', (data) => {
        console.log('🏓 Pong recebido:', data)
      })
    }
  }, [socket, isConnected])

  return {
    socket,
    isConnected,
    notifications,
    orders,
    ping
  }
}

// ===== FUNÇÕES AUXILIARES =====

function showToast(title, message, type = 'info') {
  // Implementar com sua biblioteca de toast (react-hot-toast, sonner, etc)
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`)

  // Exemplo com react-hot-toast:
  // import toast from 'react-hot-toast'
  // if (type === 'success') toast.success(`${title}: ${message}`)
  // if (type === 'error') toast.error(`${title}: ${message}`)
  // if (type === 'warning') toast(`${title}: ${message}`, { icon: '⚠️' })
  // if (type === 'info') toast(`${title}: ${message}`, { icon: 'ℹ️' })
}

function playNotificationSound() {
  // Tocar som de notificação
  const audio = new Audio('/sounds/notification.mp3')
  audio.play().catch(err => console.warn('Erro ao tocar som:', err))
}

function playOrderSound() {
  // Tocar som específico para pedidos
  const audio = new Audio('/sounds/new-order.mp3')
  audio.play().catch(err => console.warn('Erro ao tocar som:', err))
}
```

---

## 🎯 Usar no Componente

### Exemplo: Tela da Cozinha

```javascript
import { useWebSocket } from '../hooks/useWebSocket'

function CozinhaPage() {
  const { orders, notifications, isConnected } = useWebSocket()

  return (
    <div>
      <header>
        <h1>Pedidos da Cozinha</h1>
        <span className={isConnected ? 'online' : 'offline'}>
          {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
        </span>
      </header>

      {/* Notificações de estoque baixo */}
      {notifications.length > 0 && (
        <div className="notifications">
          <h3>⚠️ Alertas de Estoque ({notifications.filter(n => !n.is_read).length})</h3>
          {notifications.map(notif => (
            <div key={notif.id} className="notification">
              {notif.message}
            </div>
          ))}
        </div>
      )}

      {/* Lista de pedidos atualizada em tempo real */}
      <div className="orders">
        <h2>Pedidos Pendentes ({orders.filter(o => o.status_order === 'PENDING').length})</h2>
        
        {orders
          .filter(o => o.status_order === 'PENDING')
          .map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
      </div>
    </div>
  )
}
```

---

### Exemplo: Tela do Admin

```javascript
import { useWebSocket } from '../hooks/useWebSocket'

function AdminDashboard() {
  const { notifications, orders, isConnected, ping } = useWebSocket()

  return (
    <div>
      <header>
        <h1>Dashboard Administrativo</h1>
        <div>
          {isConnected ? '🟢 Online' : '🔴 Offline'}
          <button onClick={ping}>Testar Conexão</button>
        </div>
      </header>

      {/* Notificações em tempo real */}
      <NotificationPanel notifications={notifications} />

      {/* Pedidos em tempo real */}
      <OrdersPanel orders={orders} />

      {/* Estatísticas atualizadas */}
      <StatsPanel 
        totalOrders={orders.length}
        pendingOrders={orders.filter(o => o.status_order === 'PENDING').length}
        alertsCount={notifications.filter(n => !n.is_read).length}
      />
    </div>
  )
}
```

---

## 📱 Exemplo HTML Puro (sem framework)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>WebSocket Test</title>
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
  <h1>Teste de WebSocket</h1>
  <div id="status">Desconectado</div>
  <button id="connect-btn">Conectar</button>
  <button id="ping-btn">Ping</button>
  
  <h2>Notificações</h2>
  <ul id="notifications"></ul>
  
  <h2>Pedidos</h2>
  <ul id="orders"></ul>

  <script>
    let socket = null
    const token = localStorage.getItem('token') // Token JWT

    document.getElementById('connect-btn').addEventListener('click', () => {
      if (socket) {
        console.log('Já conectado!')
        return
      }

      socket = io('http://localhost:3333', {
        auth: { token },
        transports: ['websocket', 'polling']
      })

      socket.on('connect', () => {
        console.log('✅ Conectado:', socket.id)
        document.getElementById('status').textContent = '🟢 Conectado'
      })

      socket.on('connected', (data) => {
        console.log('Confirmação:', data)
      })

      socket.on('notification:created', (data) => {
        console.log('🔔 Nova notificação:', data)
        
        const li = document.createElement('li')
        li.textContent = data.notification.message
        document.getElementById('notifications').appendChild(li)
      })

      socket.on('order:created', (data) => {
        console.log('📋 Novo pedido:', data)
        
        const li = document.createElement('li')
        li.textContent = `Pedido #${data.order.id} - ${data.message}`
        document.getElementById('orders').appendChild(li)
      })

      socket.on('disconnect', () => {
        console.log('❌ Desconectado')
        document.getElementById('status').textContent = '🔴 Desconectado'
      })
    })

    document.getElementById('ping-btn').addEventListener('click', () => {
      if (socket) {
        socket.emit('ping')
        socket.on('pong', (data) => {
          console.log('🏓 Pong:', data)
          alert('Conexão OK!')
        })
      }
    })
  </script>
</body>
</html>
```

---

## 🔊 Sons de Notificação

### Adicionar sons na pasta `public/sounds/`

**notification.mp3** - Som curto para alertas de estoque  
**new-order.mp3** - Som mais alto para novos pedidos  
**order-complete.mp3** - Som de confirmação

**Fontes de sons gratuitos:**
- https://freesound.org/
- https://mixkit.co/free-sound-effects/notification/
- https://notificationsounds.com/

---

## ⚙️ Variáveis de Ambiente

### `.env` do Frontend

```env
VITE_API_URL=http://localhost:3333
VITE_WS_URL=ws://localhost:3333
```

---

## 🎯 Eventos Disponíveis

### Servidor → Cliente (receber)

| Evento | Dados | Descrição |
|--------|-------|-----------|
| `connected` | `{ message, userId, restaurantId, tipoUser }` | Confirmação de conexão |
| `notification:created` | `{ notification, message, timestamp }` | Nova notificação de estoque baixo |
| `order:created` | `{ order, message, timestamp }` | Novo pedido criado pelo garçom |
| `order:updated` | `{ orderId, previousStatus, newStatus, updatedBy, message, timestamp }` | Status do pedido alterado |
| `order:completed` | `{ orderId, status, completedBy, stockConsumed, warnings, message, timestamp }` | Pedido finalizado e estoque consumido |
| `order:cancelled` | `{ orderId, previousStatus, reason, cancelledBy, message, timestamp }` | Pedido cancelado |

### Cliente → Servidor (enviar)

| Evento | Dados | Descrição |
|--------|-------|-----------|
| `ping` | - | Testar conexão (retorna `pong`) |

---

## 🔧 Troubleshooting

### WebSocket não conecta

1. **Verificar token JWT:**
   ```javascript
   const token = localStorage.getItem('token')
   console.log('Token:', token)
   ```

2. **Verificar CORS:**
   - Backend deve permitir origem do frontend
   - Verificar `src/config/socket.js` → `origin`

3. **Verificar porta:**
   - Backend rodando em `http://localhost:3333`?
   - `npm run dev` iniciado?

4. **Console do navegador:**
   - `F12` → Console
   - Procurar erros de autenticação

### Eventos não estão chegando

1. **Confirmar conexão:**
   ```javascript
   console.log('Conectado?', isConnected)
   console.log('Socket ID:', socket?.id)
   ```

2. **Verificar sala do restaurante:**
   - Cliente deve estar na sala `restaurant:{id}`
   - Servidor emite para essa sala específica

3. **Logs do servidor:**
   - Verificar se eventos estão sendo emitidos
   - Buscar por "emitido via WebSocket"

---

## ✅ Checklist de Integração

- [ ] Socket.IO client instalado
- [ ] Hook `useWebSocket` criado
- [ ] Token JWT sendo enviado na autenticação
- [ ] Eventos de notificação configurados
- [ ] Eventos de pedido configurados
- [ ] Toast/alertas funcionando
- [ ] Sons de notificação adicionados (opcional)
- [ ] Tratamento de desconexão implementado
- [ ] Reconexão automática funcionando
- [ ] Testado com múltiplos usuários

---

**Criado em:** Outubro 2025  
**Versão:** 1.0.0  
**Backend:** WebSocket implementado e funcionando ✅
