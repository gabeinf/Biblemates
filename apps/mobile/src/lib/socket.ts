import { io } from "socket.io-client";
import { SERVER_URL, accessToken } from "./server";

/** Streams chat answers from apps/server. Connect on demand; the token is sent on each (re)connect. */
export const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket"],
  auth: (cb) => {
    accessToken()
      .then((token) => cb({ token }))
      .catch(() => cb({}));
  },
});
