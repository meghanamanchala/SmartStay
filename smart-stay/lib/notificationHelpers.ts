import { createNotification } from './notificationService';

export async function notifyNewBooking(hostEmail: string, bookingData: {
  guestName: string;
  propertyTitle: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  bookingId: string;
}) {
  await createNotification({
    type: 'booking',
    recipientEmail: hostEmail,
    title: 'New Booking Request!',
    message: `${bookingData.guestName} wants to book "${bookingData.propertyTitle}" for ${bookingData.nights} night(s) (${bookingData.checkInDate} - ${bookingData.checkOutDate})`,
    actionUrl: `/host/bookings`,
    metadata: {
      guestName: bookingData.guestName,
      propertyTitle: bookingData.propertyTitle,
      nights: bookingData.nights,
    },
  });
}

export async function notifyBookingConfirmed(guestEmail: string, confirmationData: {
  propertyTitle: string;
  checkInDate: string;
  checkOutDate: string;
  confirmedAt: string;
  bookingId: string;
}) {
  await createNotification({
    type: 'booking',
    recipientEmail: guestEmail,
    title: 'Booking Confirmed!',
    message: `Your booking for "${confirmationData.propertyTitle}" (${confirmationData.checkInDate} - ${confirmationData.checkOutDate}) has been confirmed.`,
    actionUrl: `/guest/bookings/${confirmationData.bookingId}`,
    metadata: confirmationData,
  });
}

export async function notifyBookingCancelled(
  email: string,
  isHost: boolean,
  cancellationData: {
    propertyTitle: string;
    guestName?: string;
    reason?: string;
    bookingId: string;
  }
) {
  const title = isHost ? 'Booking Cancelled' : 'Your Booking was Cancelled';
  const message = isHost
    ? `${cancellationData.guestName}'s booking for "${cancellationData.propertyTitle}" has been cancelled.`
    : `Your booking for "${cancellationData.propertyTitle}" has been cancelled. Reason: ${cancellationData.reason || 'Not specified'}`;

  await createNotification({
    type: 'booking',
    recipientEmail: email,
    title,
    message,
    actionUrl: isHost ? `/host/bookings` : `/guest/bookings`,
    metadata: cancellationData,
  });
}


export async function notifyNewReview(hostEmail: string, reviewData: {
  guestName: string;
  propertyTitle: string;
  rating: number;
  reviewTitle: string;
  reviewId: string;
}) {
  const stars = '★'.repeat(reviewData.rating) + '☆'.repeat(5 - reviewData.rating);
  await createNotification({
    type: 'review',
    recipientEmail: hostEmail,
    title: 'New Review Received!',
    message: `${reviewData.guestName} left a ${stars} review for "${reviewData.propertyTitle}": "${reviewData.reviewTitle}"`,
    actionUrl: `/host/reviews`,
    metadata: reviewData,
  });
}

export async function notifyNewMessage(recipientEmail: string, messageData: {
  senderName: string;
  message: string;
  conversationId: string;
}) {
  const preview = messageData.message.substring(0, 60) + (messageData.message.length > 60 ? '...' : '');
  await createNotification({
    type: 'message',
    recipientEmail,
    title: `Message from ${messageData.senderName}`,
    message: preview,
    actionUrl: `/messages/${messageData.conversationId}`,
    metadata: messageData,
  });
}

// ============= ADMIN NOTIFICATIONS =============

export async function notifyAdminsNewUser(userData: {
  name: string;
  email: string;
  role: string;
  userId: string;
}) {
  const clientPromise = await import('@/lib/mongodb');
  const client = await clientPromise.default;
  const db = client.db();
  
  // Get all admin users
  const admins = await db.collection("users").find({ role: "admin" }).toArray();
  
  // Create notification for each admin
  const notifications = admins.map((admin) => ({
    type: "user",
    recipientEmail: admin.email,
    recipientRole: "admin",
    title: "New User Registered",
    message: `${userData.name} (${userData.email}) registered as a ${userData.role}`,
    actionUrl: "/admin/users",
    metadata: userData,
    read: false,
    createdAt: new Date(),
  }));
  
  if (notifications.length > 0) {
    await db.collection("notifications").insertMany(notifications);
  }
}

export async function notifyAdminsNewBooking(bookingData: {
  guestName: string;
  propertyTitle: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  bookingId: string;
}) {
  const clientPromise = await import('@/lib/mongodb');
  const client = await clientPromise.default;
  const db = client.db();
  
  const admins = await db.collection("users").find({ role: "admin" }).toArray();
  
  const notifications = admins.map((admin) => ({
    type: "booking",
    recipientEmail: admin.email,
    recipientRole: "admin",
    title: "New Booking Created",
    message: `${bookingData.guestName} booked "${bookingData.propertyTitle}" (${bookingData.checkInDate} - ${bookingData.checkOutDate}) for $${bookingData.totalPrice}`,
    actionUrl: "/admin/bookings",
    metadata: bookingData,
    read: false,
    createdAt: new Date(),
  }));
  
  if (notifications.length > 0) {
    await db.collection("notifications").insertMany(notifications);
  }
}

export async function notifyAdminsNewProperty(propertyData: {
  hostName: string;
  propertyTitle: string;
  location: string;
  price: number;
  propertyId: string;
}) {
  const clientPromise = await import('@/lib/mongodb');
  const client = await clientPromise.default;
  const db = client.db();
  
  const admins = await db.collection("users").find({ role: "admin" }).toArray();
  
  const notifications = admins.map((admin) => ({
    type: "property",
    recipientEmail: admin.email,
    recipientRole: "admin",
    title: "New Property Listed",
    message: `${propertyData.hostName} added "${propertyData.propertyTitle}" in ${propertyData.location} at $${propertyData.price}/night`,
    actionUrl: "/admin/properties",
    metadata: propertyData,
    read: false,
    createdAt: new Date(),
  }));
  
  if (notifications.length > 0) {
    await db.collection("notifications").insertMany(notifications);
  }
}

export async function notifyAdminsPropertyDeleted(propertyData: {
  hostName: string;
  propertyTitle: string;
  propertyId: string;
}) {
  const clientPromise = await import('@/lib/mongodb');
  const client = await clientPromise.default;
  const db = client.db();
  
  const admins = await db.collection("users").find({ role: "admin" }).toArray();
  
  const notifications = admins.map((admin) => ({
    type: "property_deleted",
    recipientEmail: admin.email,
    recipientRole: "admin",
    title: "Property Deleted",
    message: `${propertyData.hostName} deleted property "${propertyData.propertyTitle}"`,
    actionUrl: "/admin/properties",
    metadata: propertyData,
    read: false,
    createdAt: new Date(),
  }));
  
  if (notifications.length > 0) {
    await db.collection("notifications").insertMany(notifications);
  }
}

export async function notifyReplyMessage(recipientEmail: string, messageData: {
  senderName: string;
  message: string;
  conversationId: string;
}) {
  const preview = messageData.message.substring(0, 60) + (messageData.message.length > 60 ? '...' : '');
  await createNotification({
    type: 'message',
    recipientEmail,
    title: `New reply from ${messageData.senderName}`,
    message: preview,
    actionUrl: `/messages/${messageData.conversationId}`,
  });
}

export async function notifySuccess(email: string, message: {
  title: string;
  message: string;
  actionUrl?: string;
}) {
  await createNotification({
    type: 'success',
    recipientEmail: email,
    title: message.title,
    message: message.message,
    actionUrl: message.actionUrl,
  });
}


export async function notifyError(email: string, message: {
  title: string;
  message: string;
}) {
  await createNotification({
    type: 'error',
    recipientEmail: email,
    title: message.title,
    message: message.message,
  });
}

export async function notifyInfo(email: string, message: {
  title: string;
  message: string;
  actionUrl?: string;
}) {
  await createNotification({
    type: 'info',
    recipientEmail: email,
    title: message.title,
    message: message.message,
    actionUrl: message.actionUrl,
  });
}

export async function notifyPropertyReviewRequest(guestEmail: string, reviewData: {
  propertyTitle: string;
  hostName: string;
  bookingId: string;
}) {
  await createNotification({
    type: 'review',
    recipientEmail: guestEmail,
    title: 'Leave a Review',
    message: `How was your stay at "${reviewData.propertyTitle}" hosted by ${reviewData.hostName}? Share your feedback!`,
    actionUrl: `/guest/bookings/${reviewData.bookingId}`,
    metadata: reviewData,
  });
}


export async function notifyPropertyPublished(hostEmail: string, propertyData: {
  propertyTitle: string;
  propertyId: string;
}) {
  await createNotification({
    type: 'info',
    recipientEmail: hostEmail,
    title: 'Property Published!',
    message: `"${propertyData.propertyTitle}" is now live and visible to guests!`,
    actionUrl: `/host/properties/${propertyData.propertyId}`,
    metadata: propertyData,
  });
}


export async function notifyPriceChange(hostEmail: string, priceData: {
  propertyTitle: string;
  oldPrice: number;
  newPrice: number;
  propertyId: string;
}) {
  await createNotification({
    type: 'info',
    recipientEmail: hostEmail,
    title: 'Price Updated',
    message: `Price for "${priceData.propertyTitle}" changed from $${priceData.oldPrice} to $${priceData.newPrice}/night`,
    actionUrl: `/host/properties/${priceData.propertyId}`,
    metadata: priceData,
  });
}


export async function notifyLowAvailability(hostEmail: string, propertyData: {
  propertyTitle: string;
  availableDays: number;
  propertyId: string;
}) {
  await createNotification({
    type: 'info',
    recipientEmail: hostEmail,
    title: 'Low Availability Alert',
    message: `"${propertyData.propertyTitle}" has only ${propertyData.availableDays} days available in the next 30 days.`,
    actionUrl: `/host/properties/${propertyData.propertyId}`,
    metadata: propertyData,
  });
}
