import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

// import { corsMiddleware } from "./middlewares/cors-middleware.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", true);

app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// app.use(corsMiddleware);

app.get("/", (req, res) => {
  res.send("Welcome to Shop Braze website Backend");
});

export { app };
