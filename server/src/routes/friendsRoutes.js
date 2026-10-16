const express = require('express');
const friendsController = require('../controllers/friendsController');
const router = express.Router();

router.post('/request', friendsController.sendFriendRequest);

router.put('/:friendshipId/accept', friendsController.acceptFriendRequest);

router.get('/:userId/accepted', friendsController.getAcceptedFriends);

//router.put('/:friendshipId/block', friendsController.blockFriend);

router.delete('/remove', friendsController.removeFriend);
module.exports = router;