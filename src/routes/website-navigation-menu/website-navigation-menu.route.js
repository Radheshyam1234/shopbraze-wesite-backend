import { Router } from "express";
import { verifySeller } from "../../middlewares/verify-seller.js";
import { getNavigationMenuItems } from "../../controllers/website-navigation-menu/index.js";

const router = Router();

router.use(verifySeller);

router.route("/").get(getNavigationMenuItems);

export default router;
