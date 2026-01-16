const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Helper function to send notifications
async function sendNotification(tokens, title, body, data) {
  if (!tokens || tokens.length === 0) {
    console.log("No tokens to send notifications to");
    return;
  }

  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: data || {},
    tokens: Array.isArray(tokens) ? tokens : [tokens],
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully sent ${response.successCount} notifications`);
    if (response.failureCount > 0) {
      console.error(`Failed to send ${response.failureCount} notifications`);
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed to send to token ${idx}:`, resp.error);
        }
      });
    }
    return response;
  } catch (error) {
    console.error("Error sending notifications:", error);
    throw error;
  }
}

// Helper function to get user tokens by role
async function getUserTokensByRole(roles) {
  const usersSnapshot = await admin.firestore()
      .collection("users")
      .where("role", "in", roles)
      .where("notificationsEnabled", "==", true)
      .get();

  return usersSnapshot.docs
      .map((doc) => doc.data().fcmToken)
      .filter((token) => token);
}

// 1. Send notification when a new complaint is created
exports.onComplaintCreated = functions.firestore
    .document("complaints/{complaintId}")
    .onCreate(async (snap, context) => {
      const complaint = snap.data();

      console.log("New complaint created:", context.params.complaintId);

      // Get all admin and landlord tokens
      const tokens = await getUserTokensByRole(["admin", "landlord"]);

      if (tokens.length === 0) {
        console.log("No admin or landlord tokens found");
        return null;
      }

      const title = "New Complaint Registered";
      const body = `${complaint.category}: ${complaint.description.substring(0, 50)}...`;
      const data = {
        type: "complaint",
        complaintId: context.params.complaintId,
        url: "/admin/complaints",
        category: complaint.category || "",
        priority: complaint.priority || "normal",
      };

      return sendNotification(tokens, title, body, data);
    });

// 2. Send notification when complaint status changes
exports.onComplaintUpdated = functions.firestore
    .document("complaints/{complaintId}")
    .onUpdate(async (change, context) => {
      const before = change.before.data();
      const after = change.after.data();

      // Only send if status changed
      if (before.status === after.status) {
        console.log("Complaint status unchanged, skipping notification");
        return null;
      }

      console.log(`Complaint ${context.params.complaintId} status changed: ${before.status} -> ${after.status}`);

      // Get the tenant who created the complaint
      const userDoc = await admin.firestore()
          .collection("users")
          .doc(after.userId)
          .get();

      const user = userDoc.data();
      if (!user?.fcmToken || !user?.notificationsEnabled) {
        console.log("User has no FCM token or notifications disabled");
        return null;
      }

      const title = "Complaint Status Updated";
      const body = `Your complaint has been marked as ${after.status}`;
      const data = {
        type: "complaint_update",
        complaintId: context.params.complaintId,
        status: after.status,
        url: "/tenant/complaints",
      };

      return sendNotification([user.fcmToken], title, body, data);
    });

// 3. Send notification for maintenance reminders
exports.onMaintenanceCreated = functions.firestore
    .document("maintenanceRecords/{recordId}")
    .onCreate(async (snap, context) => {
      const record = snap.data();

      console.log("New maintenance record created:", context.params.recordId);

      // Get all tenant tokens
      const tokens = await getUserTokensByRole(["tenant"]);

      if (tokens.length === 0) {
        console.log("No tenant tokens found");
        return null;
      }

      const title = "Maintenance Payment Due";
      const body = `Your maintenance payment of ₹${record.amount} is due on ${new Date(record.dueDate.toDate()).toLocaleDateString()}`;
      const data = {
        type: "maintenance",
        recordId: context.params.recordId,
        url: "/tenant/payments",
        amount: String(record.amount),
        dueDate: record.dueDate.toDate().toISOString(),
      };

      return sendNotification(tokens, title, body, data);
    });

// 4. Send notification when maintenance payment is made
exports.onMaintenanceUpdated = functions.firestore
    .document("maintenanceRecords/{recordId}")
    .onUpdate(async (change, context) => {
      const before = change.before.data();
      const after = change.after.data();

      // Only notify if payment status changed to paid
      if (before.status === after.status || after.status !== "paid") {
        return null;
      }

      console.log(`Maintenance payment received for record: ${context.params.recordId}`);

      // Notify admins and landlords
      const tokens = await getUserTokensByRole(["admin", "landlord"]);

      if (tokens.length === 0) {
        console.log("No admin or landlord tokens found");
        return null;
      }

      const title = "Maintenance Payment Received";
      const body = `Payment of ₹${after.amount} received from ${after.tenantName || "a tenant"}`;
      const data = {
        type: "payment_received",
        recordId: context.params.recordId,
        url: "/landlord/payments",
        amount: String(after.amount),
      };

      return sendNotification(tokens, title, body, data);
    });

// 5. Send notification for new announcements
exports.onAnnouncementCreated = functions.firestore
    .document("announcements/{announcementId}")
    .onCreate(async (snap, context) => {
      const announcement = snap.data();

      console.log("New announcement created:", context.params.announcementId);

      // Get all user tokens
      const usersSnapshot = await admin.firestore()
          .collection("users")
          .where("notificationsEnabled", "==", true)
          .get();

      const tokens = usersSnapshot.docs
          .map((doc) => doc.data().fcmToken)
          .filter((token) => token);

      if (tokens.length === 0) {
        console.log("No user tokens found");
        return null;
      }

      const title = announcement.title || "New Announcement";
      const body = announcement.message.substring(0, 100) + (announcement.message.length > 100 ? "..." : "");
      const data = {
        type: "announcement",
        announcementId: context.params.announcementId,
        priority: announcement.priority || "normal",
        url: "/announcements",
      };

      return sendNotification(tokens, title, body, data);
    });

// 6. Send notification for visitor approvals
exports.onVisitorCreated = functions.firestore
    .document("visitors/{visitorId}")
    .onCreate(async (snap, context) => {
      const visitor = snap.data();

      console.log("New visitor request created:", context.params.visitorId);

      // Notify admins and security
      const tokens = await getUserTokensByRole(["admin", "landlord"]);

      if (tokens.length === 0) {
        console.log("No admin or landlord tokens found");
        return null;
      }

      const title = "New Visitor Request";
      const body = `Visitor ${visitor.visitorName} requested by ${visitor.tenantName || "a tenant"}`;
      const data = {
        type: "visitor_request",
        visitorId: context.params.visitorId,
        url: "/admin/visitors",
      };

      return sendNotification(tokens, title, body, data);
    });

// 7. Send notification when visitor status changes
exports.onVisitorUpdated = functions.firestore
    .document("visitors/{visitorId}")
    .onUpdate(async (change, context) => {
      const before = change.before.data();
      const after = change.after.data();

      if (before.status === after.status) {
        return null;
      }

      console.log(`Visitor ${context.params.visitorId} status changed: ${before.status} -> ${after.status}`);

      // Get the tenant who requested
      const userDoc = await admin.firestore()
          .collection("users")
          .doc(after.tenantId)
          .get();

      const user = userDoc.data();
      if (!user?.fcmToken || !user?.notificationsEnabled) {
        console.log("User has no FCM token or notifications disabled");
        return null;
      }

      const title = "Visitor Request Updated";
      const body = `Your visitor request for ${after.visitorName} has been ${after.status}`;
      const data = {
        type: "visitor_update",
        visitorId: context.params.visitorId,
        status: after.status,
        url: "/tenant/visitors",
      };

      return sendNotification([user.fcmToken], title, body, data);
    });

// 8. Send notification for emergency alerts
exports.sendEmergencyAlert = functions.https.onCall(async (data, context) => {
  // Verify that the request is from an authenticated admin
  if (!context.auth || context.auth.token.role !== "admin") {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can send emergency alerts"
    );
  }

  const {title, message, priority} = data;

  console.log("Sending emergency alert:", title);

  // Get all user tokens
  const usersSnapshot = await admin.firestore()
      .collection("users")
      .where("notificationsEnabled", "==", true)
      .get();

  const tokens = usersSnapshot.docs
      .map((doc) => doc.data().fcmToken)
      .filter((token) => token);

  if (tokens.length === 0) {
    return {success: false, message: "No users to notify"};
  }

  const notificationData = {
    type: "emergency",
    priority: priority || "high",
    url: "/",
    timestamp: new Date().toISOString(),
  };

  const response = await sendNotification(tokens, title, message, notificationData);

  return {
    success: true,
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
});