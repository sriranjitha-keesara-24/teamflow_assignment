require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { PORT } = require("./config/env");
const { initSocket } = require("./sockets/notificationSocket");

connectDB();

const server = app.listen(PORT, () => {
  console.log(`TeamFlow server running on port ${PORT}`);
});

initSocket(server);

