const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "upcoming_event",
  "event_reminder",
  "lobby_invite",
  "lobby_joined_via_link",
  "lobby_member_responded",
  "lobby_event_pitched",
  "lobby_status",
  "group_register",
  "lobby_left_out",
  "lobby_plan_another",
  "lobby_removed",
  "lobby_deleted",
  "group_free_slot",
  "group_recommendation",
  "rsvp_update",
];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },
    lobbyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lobby",
      default: null,
    },
    // groupId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Group",
    //   default: null,
    // },
    channels: {
      type: [String],
      enum: ["in_app", "email", "push"],
      default: ["in_app"],
    },
    offsetMinutes: { type: Number, default: null, min: 0 },
    scheduledFor: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "sent", "cancelled"],
      default: "sent",
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, status: 1 });
notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ lobbyId: 1, type: 1 });
notificationSchema.index(
  { userId: 1, eventId: 1, type: 1, offsetMinutes: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "event_reminder",
      status: { $in: ["pending", "sent"] },
    },
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;