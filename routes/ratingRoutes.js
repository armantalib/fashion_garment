const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.post('/create', auth, ratingController.createRating);
router.get('/all/:gigId/:id?', ratingController.getUserPosts);
router.get('/user/:userId/:id?', ratingController.getUserRatings);
router.delete('/:id',[auth,admin], ratingController.deleterating);

module.exports = router;
