import { Router } from "express";
import { verifySeller } from "../../middlewares/verify-seller.js";
import { getCatalogueDetails } from "../../controllers/catalogue/index.js";

const router = Router();

router.use(verifySeller);

router.route("/:catalogue_id").get(getCatalogueDetails);

export default router;
