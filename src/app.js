import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import { corsMiddleware } from "./middlewares/cors-middleware.js";

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

app.use(corsMiddleware);

app.get("/", (req, res) => {
  res.send("Welcome to Shop Braze website Backend");
});

import websitePageTemplatesRouter from "./routes/website-page-templates/website-page-templates.route.js";
import websitePageConfigRouter from "./routes/website-page-config/website-page-config.route.js";
import collectionRouter from "./routes/collection/collection.route.js";
import catalogueRouter from "./routes/catalogue/catalogue.route.js";

app.use("/website-page-templates", websitePageTemplatesRouter);
app.use("/website-page-config", websitePageConfigRouter);
app.use("/collection", collectionRouter);
app.use("/catalogue", catalogueRouter);

export { app };
