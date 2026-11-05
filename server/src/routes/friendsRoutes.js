const express = require('express');
const friendsController = require('../controllers/friendsController');
const { requireAuth, selfParam, selfField } = require('../middleware/authCheck');
const router = express.Router();

router.use(requireAuth);

router.post('/request', selfField('body', 'requesterId'), friendsController.sendFriendRequest);

router.get('/:userId/sent', selfParam('userId'), friendsController.getSentRequests);

router.get('/:userId/requests', selfParam('userId'), friendsController.getPendingRequests);

router.put('/:friendshipId/accept', friendsController.acceptFriendRequest);

router.delete('/:friendshipId/reject', friendsController.rejectFriendRequest);

router.get('/:userId/accepted', selfParam('userId'), friendsController.getAcceptedFriends);

//router.put('/:friendshipId/block', friendsController.blockFriend);

router.delete('/remove', friendsController.removeFriend);

router.delete('/:friendshipId', friendsController.removeFriendById);

module.exports = router;