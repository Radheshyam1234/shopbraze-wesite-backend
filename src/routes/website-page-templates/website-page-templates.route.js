import { Router } from "express";
import { verifySeller } from "../../middlewares/verify-seller.js";
import { getTemplatesFromPageType } from "../../controllers/website-page-templates-controller/index.js";

const router = Router();

router.use(verifySeller);

router.route("/:page_type").get(getTemplatesFromPageType);

export default router;
