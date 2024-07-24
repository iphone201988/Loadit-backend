const serverKey = process.env.FCMKEY;
const FCM = require('fcm-node');
const apn = require('apn');
const fs = require('fs');

// Initialize FCM
const fcm = new FCM(serverKey);

// Initialize APN Provider
const apnProvider = new apn.Provider({
    cert: fs.readFileSync('BindedPush.pem', { encoding: 'utf-8' }),
    key: fs.readFileSync('BindedPush.pem', { encoding: 'utf-8' }),
    production: false,
  });

const sendPushNotification = async (devices, title, message, data) => {
  try {
    const sendNotificationToDevice = async (deviceType, deviceToken) => {
      if (deviceType === 2) { // iOS
        const notification = new apn.Notification();
        notification.alert = { title, body: message };
        notification.badge = 1;
        notification.sound = 'default';
        notification.topic = 'com.Binded.Binded';
        notification.payload = data;

        try {
          const result = await apnProvider.send(notification, deviceToken);
          if (result.failed.length > 0) {
            throw new Error(`Failed to send iOS notification: ${result.failed[0].response.reason}`);
          }
          return result;
        } catch (error) {
          console.error('Error sending iOS push notification:', error);
          throw error;
        }
      } else if (deviceType === 1) { // Android
        let payload = {
          notification: {
            title: title,
            body: message,
          },
          data: {
            ...data,
            title: title,
            body: message,
          },
          to: deviceToken,
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              click_action: 'FLUTTER_NOTIFICATION_CLICK', // Or your app-specific action
            },
          },
        };

        return new Promise((resolve, reject) => {
          fcm.send(payload, (err, response) => {
            if (err) {
              console.error('Error sending push notification:', err);
              reject(err);
            } else {
              console.log('Push notification sent successfully:', response);
              resolve(response);
            }
          });
        });
      } else {
        throw new Error('Unsupported device type');
      }
    };

    const notificationPromises = devices.map(device =>
      sendNotificationToDevice(device.deviceType, device.deviceToken)
    );

    await Promise.all(notificationPromises);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

// Export the function
module.exports = {
  sendPushNotification,
};