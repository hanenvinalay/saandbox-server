/* ──────────────────────────────── */
/* COMMON                           */
/* ──────────────────────────────── */
export type Sender = "user" | "agent"

/* ──────────────────────────────── */
/* PAYLOADS                         */
/* ──────────────────────────────── */
export interface ChatMessagePayload {
  content: string
  timestamp?: string
}

export interface TypingNotificationPayload {
  type: "start" | "stop"
}

/* ──────────────────────────────── */
/* ROOM EVENT DATA                  */
/* ──────────────────────────────── */
export type RoomEventData =
  | { kind: "message"; payload: ChatMessagePayload }
  | { kind: "typing"; payload: TypingNotificationPayload }

/* ──────────────────────────────── */
/* ENVELOPE                         */
/* ──────────────────────────────── */
export interface SocketEvent {
  roomId: number
  sender: Sender
  data: RoomEventData
}

/* ──────────────────────────────── */
/* CLIENT → SERVER EVENTS           */
/* ──────────────────────────────── */
export interface ClientToServerEventsV1 {
  "room:join": { roomId: number }
  "room:event": SocketEvent
}

/* ──────────────────────────────── */
/* SERVER → CLIENT EVENTS           */
/* ──────────────────────────────── */
export interface ServerToClientEventsV1 {
  "room:event": SocketEvent
}
export interface ClientToServerEventsV1 {
  'room:join': { roomId: number }
  'room:event': SocketEvent
}

/* ──────────────────────────────── */
/* SERVER → CLIENT EVENTS           */
/* ──────────────────────────────── */
export interface ServerToClientEventsV1 {
  'room:event': SocketEvent
}
