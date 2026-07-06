require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { PORT } = require("./config/env");
const { initSocket } = require("./sockets/notificationSocket");
const { startDeadlineCron } = require("./jobs/deadlineReminderCron");

connectDB();

const server = app.listen(PORT, () => {
  console.log(`TeamFlow server running on port ${PORT}`);
});

initSocket(server);
startDeadlineCron();

