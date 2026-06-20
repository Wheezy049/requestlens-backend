import http from "http";
import app from "./app.js";
import { initSocket } from "./utils/socket.js";
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
