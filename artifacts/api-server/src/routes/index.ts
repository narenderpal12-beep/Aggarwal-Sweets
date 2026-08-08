import { Router, type IRouter } from "express";
import healthRouter    from "./health";
import productsRouter  from "./products";
import ordersRouter    from "./orders";
import customersRouter from "./customers";
import settingsRouter  from "./settings";
import authRouter      from "./auth";
import blogRouter      from "./blog";
import couponsRouter   from "./coupons";
import reviewsRouter   from "./reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(customersRouter);
router.use(settingsRouter);
router.use(authRouter);
router.use(blogRouter);
router.use(couponsRouter);
router.use(reviewsRouter);

export default router;
