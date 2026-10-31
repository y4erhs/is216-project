const express = require('express');
const lobbyController = require('../controllers/lobbyController');
const router = express.Router();

router.post('/', lobbyController.createLobby);

router.get('/user/:userId', lobbyController.getLobbyForUser);

router.get('/lobby/:lobbyId', lobbyController.getLobbyById);

router.put('/invite', lobbyController.inviteUser);

router.put('/accept', lobbyController.acceptInvite);

router.put('/decline', lobbyController.declineInvite);

router.post('/:lobbyId/signup', lobbyController.signUpLobbyForEvent);

router.put('/remove', lobbyController.removeUser);

router.delete('/:lobbyId', lobbyController.deleteLobby);

router.patch('/:lobbyId', lobbyController.updateLobby);

router.put('/:lobbyId/event', lobbyController.pitchEvent);

router.post('/:lobbyId/plan-next', lobbyController.planNext);

router.post('/:lobbyId/join', lobbyController.joinViaLink);

module.exports = router;