import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const PORT = Number(process.env.PORT || 3004)
const API_BASE_URL = process.env.API_BASE_URL!
const API_KEY = process.env.API_KEY

const httpServer = createServer((_req, res) => {
  res.writeHead(200)
  res.end('OK')
})

const io = new Server(httpServer, {
  cors: { origin: '*' }
})

interface SocketEvent<T = unknown> {
  event: string
  roomId: number
  data: T
}

function saveMessage(roomId: number, data: any) {
  console.log(`Iniciando guardado de mensaje para la sala ${roomId}`)
  axios
    .post(`${API_BASE_URL}/room/messages/${roomId}`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(() => {
      console.log(`Mensaje guardado exitosamente para la sala ${roomId}`)
    })
    .catch(error => {
      console.error(
        `Error al guardar el mensaje para la sala ${roomId}:`,
        error
      )
    })
}

io.on('connection', (socket: Socket) => {
  socket.on('event', <T>(payload: SocketEvent<T>) => {
    const { event, roomId, data } = payload

    socket.to(`room:${roomId}`).emit(event, data)

    // Persistencia solo si es mensaje
    if (event === 'room:message') {
      saveMessage(roomId, data)
    }
  })

  socket.on('room:join', ({ roomId }: { roomId: number }) => {
    socket.join(`room:${roomId}`)
  })
})

setInterval(() => {
  io.emit('heartbeat', { time: Date.now() })
  console.log('💓 Heartbeat emitido:', new Date().toISOString())
}, 40000)

async function startServer() {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Socket.IO server corriendo en puerto ${PORT}`)
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`)
    console.log(`🏥 Health check: http://localhost:${PORT}/health`)
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`)
    console.log(`🔗 API Base URL: ${API_BASE_URL}`)
  })
}

startServer()

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})
