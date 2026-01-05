import { createServer } from 'http'
import { Server } from 'socket.io'
import axios from 'axios'
import dotenv from 'dotenv'

import type {
  ClientToServerEventsV1,
  ServerToClientEventsV1,
  SocketEvent
} from './events-v1'

dotenv.config()

const PORT = Number(process.env.PORT || 3004)
const API_BASE_URL = process.env.API_BASE_URL!

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      })
    )
    return
  }

  res.writeHead(200)
  res.end('OK')
})


const io = new Server<
  ClientToServerEventsV1,
  ServerToClientEventsV1
>(httpServer, {
  cors: { origin: '*' }
})

/* ──────────────────────────────── */
/* Persistencia                     */
/* ──────────────────────────────── */
async function saveMessage (event: SocketEvent) {
  if (event.data.kind !== 'message') return

  await axios.post(
    `${API_BASE_URL}/room/messages/${event.roomId}`,
    {
      content: event.data.payload.content,
      sender: event.sender,
      timestamp: event.data.payload.timestamp
    },
    { headers: { 'Content-Type': 'application/json' } }
  )
}

/* ──────────────────────────────── */
/* Socket lifecycle                 */
/* ──────────────────────────────── */
io.on('connection', socket => {
  console.log('🔌 conectado:', socket.id)

  socket.on(
    'room:join',
    (payload: ClientToServerEventsV1['room:join']) => {
      const { roomId } = payload
      socket.join(`room:${roomId}`)
    }
  )

  socket.on(
    'room:event',
    async (event: SocketEvent) => {
      socket
        .to(`room:${event.roomId}`)
        .emit('room:event', event)

      await saveMessage(event)
    }
  )

  socket.on('disconnect', () => {
    console.log('❌ desconectado:', socket.id)
  })
})

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket server corriendo en ${PORT}`)
})
