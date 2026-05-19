import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import meRouter from "./me";
import teamRouter from "./team";
import projectRouter from "./project";
import notificationRecipientsRouter from "./notificationRecipients";
import kanbanRouter from "./kanban";
import milestonesRouter from "./milestones";
import documentsRouter from "./documents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(meRouter);
router.use(teamRouter);
router.use(projectRouter);
router.use(notificationRecipientsRouter);
router.use(kanbanRouter);
router.use(milestonesRouter);
router.use(documentsRouter);

export default router;
