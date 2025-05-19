import { Router } from "express";
import { getLocationByPinCode } from "../../controllers/pin-code/index.js";
import { verifySeller } from "../../middlewares/verify-seller.js";
import { getTestimonials } from "../../controllers/testimonials/index.js";

const router = Router();

router.use(verifySeller);

router.route("/").get(getTestimonials);

export default router;
