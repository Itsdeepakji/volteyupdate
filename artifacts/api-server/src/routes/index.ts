import { Router, type IRouter } from "express";
import healthRouter from "./health";
import destinationsRouter from "./destinations";
import packagesRouter from "./packages";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import stripeRouter from "./stripe";
import contentRouter from "./content";
import paymentGatewaysRouter from "./paymentGateways";
import kycRouter from "./kyc";
import notificationsRouter from "./notifications";
import reviewsRouter from "./reviews";
import currenciesRouter from "./currencies";
import failoverRouter from "./failover";
import smtpSettingsRouter from "./smtpSettings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(destinationsRouter);
router.use(packagesRouter);
router.use(stripeRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(contentRouter);
router.use(paymentGatewaysRouter);
router.use(kycRouter);
router.use(notificationsRouter);
router.use(reviewsRouter);
router.use(currenciesRouter);
router.use(failoverRouter);
router.use(smtpSettingsRouter);

export default router;
