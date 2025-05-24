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

import pincodeRouter from "./routes/pin-code/pin-code.route.js";
import websitePageTemplatesRouter from "./routes/website-page-templates/website-page-templates.route.js";
import websitePageConfigRouter from "./routes/website-page-config/website-page-config.route.js";
import collectionRouter from "./routes/collection/collection.route.js";
import catalogueRouter from "./routes/catalogue/catalogue.route.js";
import cartRouter from "./routes/cart/cart.route.js";
import couponsRouter from "./routes/coupons/coupons.route.js";
import authRouter from "./routes/auth/auth.route.js";
import checkoutRouter from "./routes/checkout/checkout.route.js";
import orderRouter from "./routes/orders/orders.route.js";
import testimonialRouter from "./routes/testimonials/testimonials.route.js";
import websiteNavigationRouter from "./routes/website-navigation-menu/website-navigation-menu.route.js";

app.use("/api/pincode", pincodeRouter);

app.use("/auth", authRouter);

app.use("/website-page-templates", websitePageTemplatesRouter);
app.use("/website-page-config", websitePageConfigRouter);
app.use("/website-navigations", websiteNavigationRouter);
app.use("/collection", collectionRouter);
app.use("/catalogue", catalogueRouter);
app.use("/cart", cartRouter);
app.use("/coupons", couponsRouter);
app.use("/checkout", checkoutRouter);
app.use("/orders", orderRouter);
app.use("/testimonials", testimonialRouter);

export { app };
