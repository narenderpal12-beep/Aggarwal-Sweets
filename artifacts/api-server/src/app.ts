import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";
import { handleRazorpayWebhook } from "./routes/payments";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
// Razorpay signs the exact request bytes; this route must run before express.json().
app.post("/api/payments/razorpay/webhook",
  express.raw({ type: "application/json", limit: "256kb" }), handleRazorpayWebhook);
// Logo uploads are sent as Base64 data URLs inside JSON. The default
// body-parser limit is 100 KB, which is too small for normal image files.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err && typeof err === "object" && "type" in err && err.type === "entity.too.large") {
    res.status(413).json({ error: "The image or combined images are too large. Choose smaller images and try again." });
    return;
  }
  logger.error({ err, method: req.method, url: req.url }, "Unhandled API error");
  res.status(500).json({ error: "The server could not complete that request. Please try again." });
});

const publicDir = path.resolve(__dirname, "../../aggarwal-sweets/dist/public");
const indexFile = path.join(publicDir, "index.html");

app.use(express.static(publicDir));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) {
    next();
    return;
  }
  res.sendFile(indexFile);
});

export default app;
