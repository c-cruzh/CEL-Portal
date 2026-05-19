import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import meRouter from "./me";
import teamRouter from "./team";
import projectRouter from "./project";
import notificationRecipientsRouter from "./notificationRecipients";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(meRouter);
router.use(teamRouter);
router.use(projectRouter);
router.use(notificationRecipientsRouter);

export default router;
