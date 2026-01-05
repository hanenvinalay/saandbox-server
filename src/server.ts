import { createServer } from "http"
import { Server } from "socket.io"
import axios from "axios"

import type { ClientToServerEventsV1, ServerToClientEventsV1, SocketEvent } from "./events-v1"

const PORT = Number(process.env.PORT || 3004)
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000"

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }),
    )
    return
  }

  res.writeHead(200)
  res.end("Socket.IO Server Running")
})

const io = new Server<ClientToServerEventsV1, ServerToClientEventsV1>(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

/* ──────────────────────────────── */
/* Persistencia                     */
/* ──────────────────────────────── */
async function saveMessage(event: SocketEvent): Promise<void> {
  if (event.data.kind !== "message") return

  try {
    await axios.post(
      `${API_BASE_URL}/room/messages/${event.roomId}`,
      {
        content: event.data.payload.content,
        sender: event.sender,
        timestamp: event.data.payload.timestamp || new Date().toISOString(),
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
      },
    )
    console.log(`✅ Mensaje guardado en room ${event.roomId}`)
  } catch (error) {
    console.error("❌ Error guardando mensaje:", error)
  }
}

/* ──────────────────────────────── */
/* Socket lifecycle                 */
/* ──────────────────────────────── */
io.on("connection", (socket) => {
  console.log("🔌 Cliente conectado:", socket.id)

  socket.on("room:join", (payload) => {
    const { roomId } = payload
    socket.join(`room:${roomId}`)
    console.log(`📥 Cliente ${socket.id} se unió a room:${roomId}`)
  })

  socket.on("room:event", async (event) => {
    // Emitir a todos en la room excepto el emisor
    socket.to(`room:${event.roomId}`).emit("room:event", event)

    // Guardar mensaje si es de tipo message
    await saveMessage(event)
  })

  socket.on("disconnect", () => {
    console.log("❌ Cliente desconectado:", socket.id)
  })
})

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Socket.IO server corriendo en puerto ${PORT}`)
  console.log(`📡 API Base URL: ${API_BASE_URL}`)
})

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason)
})
