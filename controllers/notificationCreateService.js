const Notification = require("../models/Notification");
const admin = require("firebase-admin");

exports.sendNotification = async ({
     user = '',
     to_id = '',
     type = '',
     description_en = '',
     description_sp = '',
     title_en = '',
     title_sp = '',
     fcmtoken = '',
     gig='',
     request='',
     order='',
     noti=false
}) => {
     try {

          // Create an object to store the fields to be updated
  const updateFields = Object.fromEntries(
     Object.entries({
          user,
          to_id,
          type,
          description_en,
          title_en,
          description_sp,
          title_sp,
          gig,
          request,
          order,     
     }).filter(([key, value]) => value !== "")
   );
 
          const notification = new Notification(updateFields);

          await notification.save();
          if (noti==true && (fcmtoken!==null && fcmtoken!=="null" && fcmtoken!=='') ) {
               const message = {
                 token: fcmtoken, // replace with the user's device token
                 notification: {
                   title: title_sp,
                   body: description_sp,
                 },
                 android: {
                   notification: {
                     sound: "default",
                   },
                 },
                 apns: {
                   payload: {
                     aps: {
                       sound: "default",
                     },
                   },
                 },
               };
         
             await admin.messaging().send(message);

             }
     } catch (error) {
          throw new Error(error)
     }
}

