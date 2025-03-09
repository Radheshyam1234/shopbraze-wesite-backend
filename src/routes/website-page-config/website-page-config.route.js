import { Router } from "express";
import { verifySeller } from "../../middlewares/verify-seller.js";
import { getUiSettings } from "../../controllers/website-page-config/index.js";

const router = Router();

router.use(verifySeller);

router.route("/ui-settings").get(getUiSettings);

export default router;
