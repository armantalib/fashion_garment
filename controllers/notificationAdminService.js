const Notification = require("../models/Notification");
const { User } = require("../models/user");

exports.notificationAdminService = async ({
     user = '',
     type = '',
     description_en = '',
     description_sp = '',
     title_en = '',
     title_sp = '',
     gig='',
     request='',
     order='',
}) => {
     try {
          const adminUser=await User.findOne({type:'admin'}).lean()

          // Create an object to store the fields to be updated
  const updateFields = Object.fromEntries(
     Object.entries({
          user,
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
 
          const notification = new Notification({to_id:adminUser._id,...updateFields});
          await notification.save();
     } catch (error) {
          throw new Error(error)
     }
}