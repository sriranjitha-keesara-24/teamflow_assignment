const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { CLIENT_URL, NODE_ENV } = require("./config/env");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const userRoutes = require("./routes/Userroutes");
const taskRoutes = require("./routes/taskRoutes");
const commentRoutes = require('./routes/commentRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const { projectRcaRouter, rcaRouter } = require('./routes/rcaRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const searchRoutes = require('./routes/searchRoutes');


const app = express();

// Security & core middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = CLIENT_URL ? CLIENT_URL.split(",") : [];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const fs = require("fs");

// Serve uploaded files statically
const uploadsDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Health check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, message: "TeamFlow API is running" });
});

// Routes (v1)
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/projects/:projectId/tasks", taskRoutes);
app.use('/api/v1/tasks/:taskId/comments', commentRoutes);
app.use('/api/v1', attachmentRoutes);
app.use('/api/v1/projects/:projectId/rca', projectRcaRouter);
app.use('/api/v1/rca', rcaRouter);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/projects/:projectId/reports', reportRoutes);
app.use('/api/v1/search', searchRoutes);


// 404 + error handling (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
