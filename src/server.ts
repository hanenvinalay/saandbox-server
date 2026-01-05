import { createServer } from 'http'
import { Server } from 'socket.io'
import axios from 'axios'
import dotenv from 'dotenv'

import {
  ClientToServerEventsV1,
  ServerToClientEventsV1,
  SocketEvent
} from './events.v1'

dotenv.config()

const PORT = Number(process.env.PORT || 3004)
const API_BASE_URL = process.env.API_BASE_URL!

const httpServer = createServer((_req, res) => {
  res.writeHead(200)
  res.end('OK')
})

const io = new Server<
  ClientToServerEventsV1,
  ServerToClientEventsV1
>(httpServer, {
  cors: { origin: '*' }
})

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

io.on('connection', socket => {
  console.log('🔌 conectado:', socket.id)

  socket.on('room:join', ({ roomId }) => {
    socket.join(`room:${roomId}`)
    console.log(`📥 joined room:${roomId}`)
  })

  socket.on('room:event', async event => {
    // reenviar a la room
    socket.to(`room:${event.roomId}`).emit('room:event', event)

    // persistir solo mensajes
    await saveMessage(event)
  })

  socket.on('disconnect', () => {
    console.log('❌ desconectado:', socket.id)
  })
})

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket server en puerto ${PORT}`)
})
