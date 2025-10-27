# 📱 Guia WebSocket - React Native com Expo

## 🚀 Configuração Inicial

### 1. Instalar Socket.IO Client

```bash
npx expo install socket.io-client
```

### 2. Configurar Variáveis de Ambiente

Crie `.env` na raiz do projeto:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3333
```

> ⚠️ **IMPORTANTE:** Use o IP local da sua máquina, não `localhost`!
> 
> Para descobrir seu IP:
> - **Windows:** `ipconfig` no CMD → IPv4
> - **Mac/Linux:** `ifconfig` ou `ip addr`
> - Exemplo: `192.168.1.100` ou `10.0.0.5`

---

## 📋 Hook useWebSocket para React Native

### `src/hooks/useWebSocket.js`

```javascript
import { useEffect, useState, useCallback, useRef } from 'react'
import { AppState } from 'react-native'
import io from 'socket.io-client'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3333'

export function useWebSocket() {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [orders, setOrders] = useState([])
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    let newSocket = null

    const connectSocket = async () => {
      try {
        // Buscar token do AsyncStorage
        const token = await AsyncStorage.getItem('@token')

        if (!token) {
          console.warn('⚠️ Token não encontrado. Faça login primeiro.')
          return
        }

        console.log('🔌 Conectando ao WebSocket:', SOCKET_URL)

        // Criar conexão
        newSocket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000
        })

        // ===== EVENTOS DE CONEXÃO =====

        newSocket.on('connect', () => {
          console.log('✅ WebSocket conectado:', newSocket.id)
          setIsConnected(true)
        })

        newSocket.on('connected', (data) => {
          console.log('🎉 Confirmação do servidor:', data)
        })

        newSocket.on('disconnect', (reason) => {
          console.log('❌ WebSocket desconectado:', reason)
          setIsConnected(false)
        })

        newSocket.on('connect_error', (error) => {
          console.error('❌ Erro de conexão:', error.message)
          setIsConnected(false)

          if (error.message.includes('Authentication error')) {
            console.warn('⚠️ Token inválido. Redirecionando para login...')
            // Redirecionar para tela de login
            // navigation.navigate('Login')
          }
        })

        newSocket.on('reconnect', (attemptNumber) => {
          console.log('✅ Reconectado na tentativa', attemptNumber)
          setIsConnected(true)
        })

        // ===== EVENTOS DE NOTIFICAÇÕES =====

        newSocket.on('notification:created', (data) => {
          console.log('🔔 Nova notificação:', data)

          setNotifications(prev => [data.notification, ...prev])

          // Mostrar notificação push (opcional)
          // showPushNotification('Alerta de Estoque', data.notification.message)

          // Tocar som (opcional)
          // playNotificationSound()
        })

        // ===== EVENTOS DE PEDIDOS =====

        newSocket.on('order:created', (data) => {
          console.log('📋 Novo pedido:', data)

          setOrders(prev => [data.order, ...prev])

          // Notificação para COZINHA
          // showPushNotification('Novo Pedido!', data.message)
          // playOrderSound()
        })

        newSocket.on('order:updated', (data) => {
          console.log('🔄 Pedido atualizado:', data)

          setOrders(prev =>
            prev.map(order =>
              order.id === data.orderId
                ? { ...order, status_order: data.newStatus }
                : order
            )
          )
        })

        newSocket.on('order:completed', (data) => {
          console.log('✅ Pedido finalizado:', data)

          setOrders(prev =>
            prev.map(order =>
              order.id === data.orderId
                ? { ...order, status_order: 'COMPLETED' }
                : order
            )
          )

          // showPushNotification('Pedido Concluído!', data.message)
        })

        newSocket.on('order:cancelled', (data) => {
          console.log('❌ Pedido cancelado:', data)

          setOrders(prev =>
            prev.map(order =>
              order.id === data.orderId
                ? { ...order, status_order: 'CANCELLED' }
                : order
            )
          )
        })

        setSocket(newSocket)
      } catch (error) {
        console.error('❌ Erro ao conectar WebSocket:', error)
      }
    }

    connectSocket()

    // ===== GERENCIAR ESTADO DO APP (Background/Foreground) =====

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 App voltou para foreground - reconectando...')
        if (newSocket && !newSocket.connected) {
          newSocket.connect()
        }
      } else if (nextAppState === 'background') {
        console.log('📱 App foi para background')
        // Opcional: desconectar para economizar bateria
        // newSocket?.disconnect()
      }

      appState.current = nextAppState
    })

    // Cleanup
    return () => {
      console.log('🔌 Desconectando WebSocket...')
      subscription?.remove()
      newSocket?.close()
    }
  }, [])

  // Função para enviar ping (teste de conexão)
  const ping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('ping')
      socket.on('pong', (data) => {
        console.log('🏓 Pong recebido:', data)
      })
    }
  }, [socket, isConnected])

  // Função para reconectar manualmente
  const reconnect = useCallback(() => {
    if (socket && !isConnected) {
      console.log('🔄 Tentando reconectar...')
      socket.connect()
    }
  }, [socket, isConnected])

  return {
    socket,
    isConnected,
    notifications,
    orders,
    ping,
    reconnect
  }
}
```

---

## 🎯 Usar no App

### `App.js` ou `_layout.js` (Provider Global)

```javascript
import React, { createContext, useContext } from 'react'
import { useWebSocket } from './hooks/useWebSocket'

const WebSocketContext = createContext()

export function WebSocketProvider({ children }) {
  const websocket = useWebSocket()

  return (
    <WebSocketContext.Provider value={websocket}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext deve ser usado dentro de WebSocketProvider')
  }
  return context
}

// No App.js principal
export default function App() {
  return (
    <WebSocketProvider>
      <NavigationContainer>
        {/* Suas telas */}
      </NavigationContainer>
    </WebSocketProvider>
  )
}
```

---

## 📱 Telas de Exemplo

### 1. Tela da Cozinha (Pedidos em Tempo Real)

```javascript
import React, { useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { useWebSocketContext } from '../contexts/WebSocketContext'

export default function CozinhaScreen() {
  const { orders, isConnected, notifications } = useWebSocketContext()

  const pendingOrders = orders.filter(o => o.status_order === 'PENDING')

  return (
    <View style={styles.container}>
      {/* Header com status de conexão */}
      <View style={styles.header}>
        <Text style={styles.title}>Pedidos da Cozinha</Text>
        <View style={[styles.status, isConnected ? styles.online : styles.offline]}>
          <Text style={styles.statusText}>
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </Text>
        </View>
      </View>

      {/* Alertas de estoque */}
      {notifications.length > 0 && (
        <View style={styles.alerts}>
          <Text style={styles.alertTitle}>
            ⚠️ Alertas de Estoque ({notifications.filter(n => !n.is_read).length})
          </Text>
          {notifications.slice(0, 3).map(notif => (
            <Text key={notif.id} style={styles.alertText}>
              {notif.message}
            </Text>
          ))}
        </View>
      )}

      {/* Lista de pedidos (atualiza automaticamente!) */}
      <FlatList
        data={pendingOrders}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <OrderCard order={item} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum pedido pendente</Text>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  )
}

function OrderCard({ order }) {
  return (
    <View style={styles.card}>
      <Text style={styles.orderNumber}>Pedido #{order.id}</Text>
      <Text style={styles.orderInfo}>
        {order.itemsCount} itens • R$ {order.totalAmount}
      </Text>
      <Text style={styles.orderTime}>
        {new Date(order.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  status: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  online: {
    backgroundColor: '#e8f5e9'
  },
  offline: {
    backgroundColor: '#ffebee'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  alerts: {
    backgroundColor: '#fff3cd',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107'
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8
  },
  alertText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  list: {
    padding: 16
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2'
  },
  orderInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  orderTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 8
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40
  }
})
```

---

### 2. Tela do Admin (Dashboard com Notificações)

```javascript
import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useWebSocketContext } from '../contexts/WebSocketContext'

export default function AdminDashboard() {
  const { notifications, orders, isConnected, ping } = useWebSocketContext()

  const unreadNotifications = notifications.filter(n => !n.is_read)
  const pendingOrders = orders.filter(o => o.status_order === 'PENDING')
  const completedOrders = orders.filter(o => o.status_order === 'COMPLETED')

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Administrativo</Text>
        <View style={[styles.badge, isConnected ? styles.online : styles.offline]}>
          <Text style={styles.badgeText}>
            {isConnected ? '🟢' : '🔴'}
          </Text>
        </View>
      </View>

      {/* Cards de Estatísticas */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Pedidos Pendentes"
          value={pendingOrders.length}
          color="#ff9800"
        />
        <StatCard
          title="Pedidos Finalizados"
          value={completedOrders.length}
          color="#4caf50"
        />
        <StatCard
          title="Alertas de Estoque"
          value={unreadNotifications.length}
          color="#f44336"
        />
      </View>

      {/* Notificações não lidas */}
      {unreadNotifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Alertas Urgentes</Text>
          {unreadNotifications.map(notif => (
            <View key={notif.id} style={styles.notification}>
              <Text style={styles.notifMessage}>{notif.message}</Text>
              <Text style={styles.notifTime}>
                {new Date(notif.created_at).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Botão de teste */}
      <TouchableOpacity style={styles.testButton} onPress={ping}>
        <Text style={styles.testButtonText}>Testar Conexão (Ping)</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function StatCard({ title, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1976d2'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  online: {
    backgroundColor: '#4caf50'
  },
  offline: {
    backgroundColor: '#f44336'
  },
  badgeText: {
    fontSize: 16
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 2
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333'
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  notification: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  notifMessage: {
    fontSize: 14,
    color: '#333'
  },
  notifTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  testButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1976d2',
    borderRadius: 8,
    alignItems: 'center'
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
})
```

---

## 🔊 Notificações Push e Sons

### 1. Instalar Expo Notifications

```bash
npx expo install expo-notifications expo-av @react-native-async-storage/async-storage
```

### 2. Configurar Notificações Push

```javascript
import * as Notifications from 'expo-notifications'
import { Audio } from 'expo-av'

// Configurar comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

// Função para mostrar notificação local
export async function showPushNotification(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      vibrate: [0, 250, 250, 250],
    },
    trigger: null, // Mostrar imediatamente
  })
}

// Função para tocar som
export async function playNotificationSound() {
  const { sound } = await Audio.Sound.createAsync(
    require('../assets/sounds/notification.mp3')
  )
  await sound.playAsync()
}

export async function playOrderSound() {
  const { sound } = await Audio.Sound.createAsync(
    require('../assets/sounds/new-order.mp3')
  )
  await sound.playAsync()
}
```

### 3. Adicionar no Hook useWebSocket

```javascript
import { showPushNotification, playOrderSound } from '../utils/notifications'

// Dentro dos eventos:
newSocket.on('order:created', (data) => {
  console.log('📋 Novo pedido:', data)
  setOrders(prev => [data.order, ...prev])
  
  // Notificação push
  showPushNotification('Novo Pedido!', data.message)
  playOrderSound()
})
```

---

## 📲 App.json - Configurações

```json
{
  "expo": {
    "name": "Cafeteria App",
    "slug": "cafeteria-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": [
            "./assets/sounds/notification.mp3",
            "./assets/sounds/new-order.mp3"
          ]
        }
      ]
    ],
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "android.permission.VIBRATE",
        "android.permission.RECEIVE_BOOT_COMPLETED"
      ]
    },
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

---

## 🔧 Troubleshooting

### 1. WebSocket não conecta no dispositivo físico

**Problema:** `connect_error: timeout`

**Solução:**
- Use o IP local da máquina (não `localhost`)
- Certifique-se que dispositivo está na mesma rede Wi-Fi
- Desative firewall temporariamente para testar
- Verifique se backend está rodando: `http://SEU_IP:3333/health`

### 2. App não recebe eventos em background

**Problema:** Eventos param quando app minimiza

**Solução:**
- WebSocket se mantém conectado mesmo em background
- Para notificações em background, use Expo Notifications
- Configure `app.json` com permissões necessárias

### 3. Token inválido ao conectar

**Problema:** `Authentication error`

**Solução:**
```javascript
// Verificar se token está salvo
const token = await AsyncStorage.getItem('@token')
console.log('Token:', token)

// Se não tiver, redirecionar para login
if (!token) {
  navigation.navigate('Login')
}
```

---

## ✅ Checklist de Implementação

- [ ] Socket.IO client instalado
- [ ] Hook `useWebSocket` criado
- [ ] `WebSocketProvider` configurado no App.js
- [ ] Variável de ambiente `EXPO_PUBLIC_API_URL` configurada com IP local
- [ ] Telas usando `useWebSocketContext()`
- [ ] Expo Notifications instalado (opcional)
- [ ] Sons de notificação adicionados em `assets/sounds/`
- [ ] Testado em dispositivo físico ou emulador
- [ ] Reconexão automática funcionando
- [ ] Eventos aparecendo em tempo real

---

## 🎯 Estrutura de Pastas Sugerida

```
src/
├── hooks/
│   └── useWebSocket.js
├── contexts/
│   └── WebSocketContext.js
├── screens/
│   ├── CozinhaScreen.js
│   ├── AdminDashboard.js
│   └── GarcomScreen.js
├── components/
│   ├── OrderCard.js
│   └── NotificationBadge.js
├── utils/
│   └── notifications.js
└── services/
    └── api.js

assets/
├── sounds/
│   ├── notification.mp3
│   └── new-order.mp3
└── images/
```

---

**Pronto! Seu app React Native com Expo está configurado para receber atualizações em tempo real via WebSocket! 🎉**

*Documentação criada em: Outubro 2025*  
*Plataforma: React Native + Expo*  
*Backend: WebSocket ✅ Implementado*
