import { Router } from "express";
import { verifySeller } from "../../middlewares/verify-seller.js";
import {
  getCatalogueFiltersForCollection,
  getCollectionCatalogues,
} from "../../controllers/collection/index.js";

const router = Router();

router.use(verifySeller);

router.route("/:collection_id").get(getCollectionCatalogues);
router
  .route("/catalogues-filters/:collection_id")
  .get(getCatalogueFiltersForCollection);

export default router;
