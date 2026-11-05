const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notificationController");
const { requireAuth, selfField } = require("../middleware/authCheck");

router.use(requireAuth, selfField("query", "userId"));


router.get("/", notificationsController.getMyNotifications);
router.put("/read-all", notificationsController.markAllAsRead);

router.get("/preferences", notificationsController.getPreferences);
router.put("/preferences", notificationsController.updatePreferences);

router.get("/reminders", notificationsController.getMyReminders);
router.post("/reminders", notificationsController.createReminder);
router.put("/reminders/:id", notificationsController.updateReminder);
router.delete("/reminders/:id", notificationsController.deleteReminder);
router.post('/dispatch-upcoming', notificationsController.dispatchUpcomingEvents);

router.get("/:id", notificationsController.getNotificationById);
router.put("/:id/read", notificationsController.markAsRead);
router.delete("/:id", notificationsController.deleteNotification);

module.exports = router;