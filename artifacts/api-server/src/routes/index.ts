import { Router, type IRouter } from "express";
import healthRouter   from "./health";
import productsRouter from "./products";
import ordersRouter   from "./orders";
import customersRouter from "./customers";
import settingsRouter from "./settings";
import authRouter     from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(customersRouter);
router.use(settingsRouter);
router.use(authRouter);

export default router;
