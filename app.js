import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public")); // for serving static files
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.routes.js";
import feedbackRouter from "./routes/review.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/feedback", feedbackRouter);

app.get("/", (req, res) => {
  res.send("Welcome to Gym Management System API");
});

// Error handling middleware (sabse neeche)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    statusCode,
    message,
    success: false,
    errors: err.errors || [],
    data: null,
  });
});

export { app };
