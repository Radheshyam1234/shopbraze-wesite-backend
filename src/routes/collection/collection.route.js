import { Router } from "express";
import { verifySeller } from "../../middlewares/verify-seller.js";
import { getCollectionCatalogues } from "../../controllers/collection/index.js";

const router = Router();

router.use(verifySeller);

router.route("/:collection_id").get(getCollectionCatalogues);

export default router;
