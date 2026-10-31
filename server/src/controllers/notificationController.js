const Notification = require("../models/notification");
const User = require("../models/user");
const Event = require("../models/events");

function getUserId(req) {
  return req.user?.id || req.user?._id;
}

function defaultPrefs() {
  return { push: true, email: true, reminndMinutesBefore: 15 };
}

async function getPrefs(userId) {
  const user = await User.findById(userId).select("notificationPreferences");
  const stored =
    user?.notificationPreferences?.toObject?.() ||
    user?.notificationPreferences ||
    {};
  return { ...defaultPrefs(), ...stored };
}

function channelsFromPrefs(prefs) {
  const channels = ["in_app"];
  if (prefs.push) channels.push("push");
  if (prefs.email) channels.push("email");
  return channels;
}

function eventStart(event) {
  return event?.startTime || event?.startDate || event?.date;
}

function eventLabel(event) {
  if (!event) return "an event";
  const when = event.date || event.startTime || event.startDate;
  const where = event.venue || event.location;
  if (when && where) return `${event.title} on ${when} at ${where}`;
  if (when) return `${event.title} on ${when}`;
  return event.title;
}

async function createNotification({
  userId,
  type,
  title,
  message,
  eventId = null,
  lobbyId = null,
  groupId = null,
  offsetMinutes = null,
  scheduledFor,
  metadata = {},
}) {
  const prefs = await getPrefs(userId);
  const when = scheduledFor ? new Date(scheduledFor) : new Date();
  const isFuture = when.getTime() > Date.now();

  return Notification.create({
    userId,
    type,
    title,
    message,
    eventId,
    lobbyId,
    groupId,
    channels: channelsFromPrefs(prefs),
    offsetMinutes,
    scheduledFor: when,
    status: isFuture ? "pending" : "sent",
    sentAt: isFuture ? null : new Date(),
    metadata,
  });
}

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { unread, type, page = 1, limit = 20 } = req.query;
    const filter = { userId, status: "sent" };

    if (unread === "true") filter.isRead = false;
    if (type) filter.type = type;

    const pageNum = Math.max(Number(page), 1);
    const pageSize = Math.min(Math.max(Number(limit), 1), 50);
    const skip = (pageNum - 1) * pageSize;

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate("eventId", "title startTime startDate date venue location")
        .populate("lobbyId", "name")
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, status: "sent", isRead: false }),
    ]);

    return res.json({ items, total, unreadCount, page: pageNum, limit: pageSize });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load notifications", error: err.message });
  }
};

exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: getUserId(req),
    })
      .populate("eventId", "title startTime startDate date venue location")
      .populate("lobbyId", "name");

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    return res.json(notification);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load notification", error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: getUserId(req), status: "sent" },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    return res.json(notification);
  } catch (err) {
    return res.status(500).json({ message: "Failed to mark as read", error: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: getUserId(req), status: "sent", isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return res.json({ updated: result.modifiedCount });
  } catch (err) {
    return res.status(500).json({ message: "Failed to mark all as read", error: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: getUserId(req),
    });
    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }
    return res.json({ message: "Notification deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete notification", error: err.message });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    return res.json(await getPrefs(getUserId(req)));
  } catch (err) {
    return res.status(500).json({ message: "Failed to load preferences", error: err.message });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { push, email, reminndMinutesBefore } = req.body;
    const update = {};

    if (typeof push === "boolean") {
      update["notificationPreferences.push"] = push;
    }
    if (typeof email === "boolean") {
      update["notificationPreferences.email"] = email;
    }
    if (reminndMinutesBefore != null) {
      const minutes = Number(reminndMinutesBefore);
      if (Number.isNaN(minutes) || minutes < 0) {
        return res.status(400).json({
          message: "reminndMinutesBefore must be a non-negative number",
        });
      }
      update["notificationPreferences.reminndMinutesBefore"] = minutes;
    }

    if (Object.keys(update).length === 0) {
      return res.json(await getPrefs(getUserId(req)));
    }

    const user = await User.findByIdAndUpdate(
      getUserId(req),
      { $set: update },
      { new: true, runValidators: true }
    ).select("notificationPreferences");

    if (!user) return res.status(404).json({ message: "User not found" });

    const stored = user.notificationPreferences?.toObject?.() || user.notificationPreferences;
    return res.json({ ...defaultPrefs(), ...stored });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update preferences", error: err.message });
  }
};

exports.getMyReminders = async (req, res) => {
  try {
    const reminders = await Notification.find({
      userId: getUserId(req),
      type: "event_reminder",
      status: { $in: ["pending", "sent"] },
    })
      .populate("eventId", "title startTime startDate date venue location")
      .sort({ scheduledFor: 1 });

    return res.json(reminders);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load reminders", error: err.message });
  }
};

exports.createReminder = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { eventId, offsetMinutes } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: "eventId is required" });
    }

    const prefs = await getPrefs(userId);
    const minutes =
      offsetMinutes != null ? Number(offsetMinutes) : prefs.reminndMinutesBefore;

    if (Number.isNaN(minutes) || minutes < 0) {
      return res.status(400).json({ message: "offsetMinutes must be a non-negative number" });
    }

    const event = await Event.findById(eventId).select(
      "title startTime startDate date venue location"
    );
    if (!event) return res.status(404).json({ message: "Event not found" });

    const start = eventStart(event);
    if (!start) {
      return res.status(400).json({ message: "Event has no start time" });
    }

    const notifyAt = new Date(new Date(start).getTime() - minutes * 60 * 1000);
    if (notifyAt.getTime() <= Date.now()) {
      return res.status(400).json({ message: "Reminder time is already in the past" });
    }

    const reminder = await createNotification({
      userId,
      type: "event_reminder",
      title: `Reminder: ${event.title}`,
      message: `${event.title} starts at ${new Date(start).toISOString()}`,
      eventId,
      offsetMinutes: minutes,
      scheduledFor: notifyAt,
    });

    return res.status(201).json(reminder);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "A reminder with this timing already exists for this event",
      });
    }
    return res.status(500).json({ message: "Failed to create reminder", error: err.message });
  }
};

exports.updateReminder = async (req, res) => {
  try {
    const userId = getUserId(req);
    const reminder = await Notification.findOne({
      _id: req.params.id,
      userId,
      type: "event_reminder",
    });

    if (!reminder) return res.status(404).json({ message: "Reminder not found" });

    const { offsetMinutes, enabled } = req.body;

    if (typeof enabled === "boolean") {
      reminder.status = enabled ? "pending" : "cancelled";
      if (!enabled) reminder.sentAt = null;
    }

    if (offsetMinutes != null) {
      const minutes = Number(offsetMinutes);
      if (Number.isNaN(minutes) || minutes < 0) {
        return res.status(400).json({ message: "offsetMinutes must be a non-negative number" });
      }

      const event = await Event.findById(reminder.eventId).select(
        "title startTime startDate date"
      );
      const start = eventStart(event);
      reminder.offsetMinutes = minutes;
      reminder.scheduledFor = new Date(new Date(start).getTime() - minutes * 60 * 1000);
      reminder.title = `Reminder: ${event.title}`;
      reminder.message = `${event.title} starts at ${new Date(start).toISOString()}`;
      if (reminder.status !== "cancelled") {
        reminder.status = reminder.scheduledFor.getTime() > Date.now() ? "pending" : "sent";
        reminder.sentAt = reminder.status === "sent" ? new Date() : null;
        reminder.isRead = false;
      }
    }

    await reminder.save();
    return res.json(reminder);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "A reminder with this timing already exists for this event",
      });
    }
    return res.status(500).json({ message: "Failed to update reminder", error: err.message });
  }
};

exports.deleteReminder = async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: getUserId(req),
      type: "event_reminder",
    });

    if (!deleted) return res.status(404).json({ message: "Reminder not found" });
    return res.json({ message: "Reminder deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete reminder", error: err.message });
  }
};

exports.dispatchDueReminders = async (req, res) => {
  try {
    const due = await Notification.find({
      type: "event_reminder",
      status: "pending",
      scheduledFor: { $lte: new Date() },
    });

    if (due.length) {
      await Notification.updateMany(
        { _id: { $in: due.map((n) => n._id) } },
        { status: "sent", sentAt: new Date() }
      );
    }

    const payload = { processed: due.length };
    if (res) return res.json(payload);
    return payload;
  } catch (err) {
    if (res) {
      return res.status(500).json({ message: "Failed to dispatch reminders", error: err.message });
    }
    throw err;
  }
};

// --- lobby helpers: call these from the lobby controller, not from Vue ---

exports.notifyLobbyInvite = async (userId, lobby, hostName) => {
  return createNotification({
    userId,
    type: "lobby_invite",
    title: "Lobby invitation",
    message: `${hostName} invited you to ${lobby.name}. Accept or decline to confirm.`,
    lobbyId: lobby._id,
    eventId: lobby.pitchedEventId || null,
    metadata: { via: "invitation", hostId: lobby.hostId },
  });
};

exports.notifyJoinedViaLink = async (hostId, lobby, member) => {
  return createNotification({
    userId: hostId,
    type: "lobby_joined_via_link",
    title: "Someone joined your lobby",
    message: `${member.name} joined ${lobby.name} via invite link.`,
    lobbyId: lobby._id,
    metadata: { memberId: member.id || member._id, via: "link" },
  });
};

exports.notifyMemberResponded = async (hostId, lobby, member, status) => {
  const verb = status === "accepted" ? "accepted" : "declined";
  return createNotification({
    userId: hostId,
    type: "lobby_member_responded",
    title: "Lobby reply",
    message: `${member.name} ${verb} the invitation to ${lobby.name}.`,
    lobbyId: lobby._id,
    eventId: lobby.pitchedEventId || null,
    metadata: { memberId: member.id || member._id, status },
  });
};

exports.notifyEventPitched = async (memberIds, lobby, hostName, event) => {
  return Promise.all(
    memberIds.map((userId) =>
      createNotification({
        userId,
        type: "lobby_event_pitched",
        title: "Event pitched",
        message: `${hostName} pitched ${eventLabel(event)} to ${lobby.name}. Accept or decline before the host registers the group.`,
        lobbyId: lobby._id,
        eventId: event._id || event.id,
      })
    )
  );
};

exports.notifyGroupRegistered = async (acceptedUserIds, pendingUserIds, lobby, event) => {
  const accepted = acceptedUserIds.map((userId) =>
    createNotification({
      userId,
      type: "group_register",
      title: "Group registered",
      message: `You're signed up for ${eventLabel(event)} with ${lobby.name}.`,
      eventId: event._id || event.id,
      lobbyId: lobby._id,
    })
  );

  const leftOut = pendingUserIds.map((userId) =>
    createNotification({
      userId,
      type: "lobby_left_out",
      title: "Group registered without you",
      message: `${lobby.name} registered for ${event.title}. You were left out because your reply was still pending.`,
      eventId: event._id || event.id,
      lobbyId: lobby._id,
    })
  );

  return Promise.all([...accepted, ...leftOut]);
};

exports.notifyPlanAnother = async (memberIds, lobby) => {
  return Promise.all(
    memberIds.map((userId) =>
      createNotification({
        userId,
        type: "lobby_plan_another",
        title: "New event to confirm",
        message: `${lobby.name} is planning another event. Accept or decline again.`,
        lobbyId: lobby._id,
      })
    )
  );
};

exports.notifyRemovedFromLobby = async (userId, lobby) => {
  return createNotification({
    userId,
    type: "lobby_removed",
    title: "Removed from lobby",
    message: `You were removed from ${lobby.name}.`,
    lobbyId: lobby._id,
  });
};

exports.notifyLobbyDeleted = async (memberIds, lobby) => {
  return Promise.all(
    memberIds.map((userId) =>
      createNotification({
        userId,
        type: "lobby_deleted",
        title: "Lobby deleted",
        message: `${lobby.name} was deleted. Events already registered were not cancelled.`,
        lobbyId: lobby._id,
      })
    )
  );
};

exports.notifyUpcomingEvent = async (userId, event) => {
  return createNotification({
    userId,
    type: "upcoming_event",
    title: "Upcoming event",
    message: `${event.title} is coming up.`,
    eventId: event._id,
  });
};

exports.dispatchUpcomingEvents = async (req, res) => {
  try {
    const Event = require('../models/events');
    const now = new Date();
    const next24Hours = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );
    const events = await Event.find({
      attendees: { $exists: true, $ne: [] },
      sessions: {
        $elemMatch: {
          startTime: {
            $gte: now,
            $lte: next24Hours
          }
        }
      }
    }).populate('attendees', '_id');
    let count = 0;
    for (const event of events) {
      for (const attendee of event.attendees) {
        const existing =
          await Notification.findOne({
            userId: attendee._id,
            eventId: event._id,
            type: 'upcoming_event'
          });
        if (!existing) {
          await exports.notifyUpcomingEvent(
            attendee._id,
            event
          );
          count++;
        }
      }
    }
    const payload = {
      processed: count
    };
    if (res) {
      return res.json(payload);
    }
    return payload;
  } catch (err) {
    if (res) {
      return res.status(500).json({
        message: 'Failed to dispatch upcoming notifications',
        error: err.message
      });
    }
    throw err;
  }
};

exports.notifyGroupFreeSlots = async (userIds, group, slotsSummary) => {
  return Promise.all(
    userIds.map((userId) =>
      createNotification({
        userId,
        type: "group_free_slot",
        title: "Common free time found",
        message: slotsSummary,
        groupId: group._id,
      })
    )
  );
};

exports.notifyGroupRecommendation = async (userIds, group, event) => {
  return Promise.all(
    userIds.map((userId) =>
      createNotification({
        userId,
        type: "group_recommendation",
        title: "Event for your group",
        message: `${event.title} fits your group's shared free time and interests.`,
        eventId: event._id,
        groupId: group._id,
      })
    )
  );
};

exports.notifyRsvpUpdate = async (userId, event, status) => {
  return createNotification({
    userId,
    type: "rsvp_update",
    title: "RSVP updated",
    message: `Your status for ${event.title} is now "${status}".`,
    eventId: event._id,
    metadata: { status },
  });
};

exports.notifyFriendRequest = async (receiverId,requesterName,friendshipId) => {
  return createNotification({
    userId: receiverId,

    type: "friend_request",

    title: "Friend Request",

    message: `${requesterName} sent you a friend request.`,

    metadata: {
      friendshipId
    }
  });
};

exports.createNotification = createNotification;