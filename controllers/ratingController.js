const Gig = require('../models/Gig');
const Rating = require('../models/Rating');
const { User } = require('../models/user');
const lang2 = require('../routes/lang.json');
const lang = require('../routes/lang.json');

function calculateAverage(initialValue, numberToAdd) {
  if (initialValue == 0) return Number(numberToAdd)

  const sum = Number(initialValue) + Number(numberToAdd);
  const average = sum / 2; // Divide by 2 since there are two values

  return Number(Math.min(average, 5)); // Cap the average at 5 using Math.min
}

exports.createRating = async (req, res) => {
  try {
    const { to_id, rating, review, gig } = req.body;
    const userId = req.user._id;

    const ratings = new Rating({
      user: userId,
      to_id, rating, review, gig
    });

    const user = await User.findById(to_id)

    if (!user) return res.status(500).json({ message:req?.user?.lang=='english'?lang["nouserfound"]:lang2["nouserfound"]});

    user.rating = calculateAverage(user?.rating || 0, rating)

    await user.save()
    const findgig = await Gig.findById(gig)

    if (!findgig) return res.status(500).json({ message: req?.user?.lang=='english'?lang["notgigfound"]:lang2["notgigfound"] });

    findgig.rating = calculateAverage(findgig?.rating || 0, rating)

    findgig.totalRatings = Number(findgig?.totalRatings || 0) + 1

    await findgig.save()

    await ratings.save();

    res.status(201).json({ success: true, message:req?.user?.lang=='english'?lang["ratingdone"]:lang2["ratingdone"], ratings });
  } catch (error) {
    res.status(500).json({ success: false, message:req?.user?.lang=='english'?lang["error"]:lang2["error"], error });
  }
};

exports.checkRating = async (req, res) => {
  try {
    const userId = req.user._id;
    const trainingId = req.params.id;

    const user = await User.findById(userId)

    if (user) {
      for (let index = 0; index < user.ScholarCareer.length; index++) {
        const element = user.ScholarCareer[index];
        if (element.TrainingId == trainingId) {
          return res.status(200).json({ success: true, message: req?.user?.lang=='english'?lang["ratingyes"]:lang2["ratingyes"] });
        }
      }
      return res.status(200).json({ success: false, message:req?.user?.lang=='english'?lang["ratingnotper"]:lang2["ratingnotper"]});
    }

    res.status(200).json({ success: false, message: req?.user?.lang=='english'?lang["ratingnotper"]:lang2["ratingnotper"] });
  } catch (error) {
    res.status(500).json({ success: false, message: req?.user?.lang=='english'?lang["error"]:lang2["error"], error });
  }
};

exports.getUserPosts = async (req, res) => {
  let query = {};
  query.gig = req.params.gigId

  if (req.params.id) {
    query._id = { $lt: req.params.id };
  }

  const pageSize = 10;

  try {
    const rating = await Rating.find(query).sort({ _id: -1 }).populate("user")
      .limit(pageSize)
      .lean();

    const totalLength = await Rating.countDocuments({ gig: req.params.gigId, })
    const rating1 = await Rating.countDocuments({ gig: req.params.gigId, rating: 1 });
    const rating2 = await Rating.countDocuments({ gig: req.params.gigId, rating: 2 });
    const rating3 = await Rating.countDocuments({ gig: req.params.gigId, rating: 3 });
    const rating4 = await Rating.countDocuments({ gig: req.params.gigId, rating: 4 });
    const rating5 = await Rating.countDocuments({ gig: req.params.gigId, rating: 5 });
    
    if (rating.length > 0) {
      res.status(200).json({
        success: true, ratings: rating,
        totalLength: totalLength,
        totalsRating: {
          1: rating1,
          2: rating2,
          3: rating3,
          4: rating4,
          5: rating5,
        }
      });
    } else {
      res.status(200).json({
        success: false, message: req?.user?.lang=='english'?lang["nomorerat"]:lang2["nomorerat"],
        ratings: [],
        totalLength: totalLength,
        totalsRating: {
          1: rating1,
          2: rating2,
          3: rating3,
          4: rating4,
          5: rating5,
        }
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: req?.user?.lang=='english'?lang["error"]:lang2["error"]});
  }
};

exports.getUserRatings = async (req, res) => {
  let query = {};
  query.to_id = req.params.userId

  if (req.params.id) {
    query._id = { $lt: req.params.id };
  }

  const pageSize = 10;

  try {
    const user = await User.findById(req.params.userId)
    if (!user) return res.status(500).json({ message:req?.user?.lang=='english'?lang["nouserfound"]:lang2["nouserfound"]});

    const rating = await Rating.find(query).sort({ _id: -1 }).populate("user")
      .limit(pageSize)
      .lean();

    const totalLength = await Rating.countDocuments({ to_id: req.params.userId, });
    const rating1 = await Rating.countDocuments({ to_id: req.params.userId, rating: 1 });
    const rating2 = await Rating.countDocuments({ to_id: req.params.userId, rating: 2 });
    const rating3 = await Rating.countDocuments({ to_id: req.params.userId, rating: 3 });
    const rating4 = await Rating.countDocuments({ to_id: req.params.userId, rating: 4 });
    const rating5 = await Rating.countDocuments({ to_id: req.params.userId, rating: 5 });

    const numbers = [(rating1*1), (rating2*2), (rating3*3),(rating4*4),(rating5*5)];
    const average = numbers.reduce((a, b) => a + b, 0) / totalLength;
    if (rating.length > 0) {
      res.status(200).json({
        success: true,
        ratings: rating,
        totalLength: totalLength,
        totalsRating: {
          1: rating1,
          2: rating2,
          3: rating3,
          4: rating4,
          5: rating5,
        },
        avg_rating:average||0
      });
    } else {
      res.status(200).json({
        success: false, message: req?.user?.lang=='english'?lang["nomorerat"]:lang2["nomorerat"],
        ratings: [],
        totalLength: totalLength,
        totalsRating: {
          1: rating1,
          2: rating2,
          3: rating3,
          4: rating4,
          5: rating5,
        },
        avg_rating:average||0
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: req?.user?.lang=='english'?lang["error"]:lang2["error"] });
  }
};


exports.deleterating = async (req, res) => {
  try {
    const serviceId = req.params.id;

    const service = await Rating.findByIdAndDelete(serviceId);

    if (service == null) {
      return res.status(404).json({ message:req?.user?.lang=='english'?lang["Invalid_last_id"]:lang2["Invalid_last_id"] });
    }

    res.status(200).json({ message:req?.user?.lang=='english'?lang["ratingdell"]:lang2["ratingdell"], rating: service });

  } catch (error) {
    res.status(500).json({ message:req?.user?.lang=='english'?lang["error"]:lang2["error"] });
  }
};