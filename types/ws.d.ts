// `ws` is a runtime-only dependency of @neondatabase/serverless (Node.js
// WebSocket transport). @types/ws is blocked by pnpm's ignored-builds policy,
// so declare the module loosely here.
declare module "ws" {
  const ws: import("@neondatabase/serverless").WebSocketConstructor;
  export default ws;
}
