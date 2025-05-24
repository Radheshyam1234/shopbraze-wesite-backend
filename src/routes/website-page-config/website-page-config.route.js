import { Router } from "express";
import { verifySeller } from "../../middlewares/verify-seller.js";
import { getUiSettings } from "../../controllers/website-page-config/index.js";
import { getWebConfig } from "../../controllers/website-page-config/get-web-config/get-web-config.js";

const router = Router();

router.use(verifySeller);

router.route("/").get(getWebConfig);
router.route("/ui-settings").get(getUiSettings);

export default router;
