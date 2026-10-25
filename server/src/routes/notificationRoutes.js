const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notificationController");


router.get("/", notificationsController.getMyNotifications);
router.patch("/read-all", notificationsController.markAllAsRead);

router.get("/preferences", notificationsController.getPreferences);
router.put("/preferences", notificationsController.updatePreferences);

router.get("/reminders", notificationsController.getMyReminders);
router.post("/reminders", notificationsController.createReminder);
router.patch("/reminders/:id", notificationsController.updateReminder);
router.delete("/reminders/:id", notificationsController.deleteReminder);

router.get("/:id", notificationsController.getNotificationById);
router.patch("/:id/read", notificationsController.markAsRead);
router.delete("/:id", notificationsController.deleteNotification);

module.exports = router;