const express = require('express');
const lobbyController = require('../controllers/lobbyController');
const lobbyCalendarController = require('../controllers/lobbyCalendarController');
const { requireAuth, selfParam, selfField, requireLobbyHost, requireLobbyMember } = require('../middleware/authCheck');
const router = express.Router();

router.use(requireAuth);

router.post('/', selfField('body', 'host'), lobbyController.createLobby);

router.get('/user/:userId', selfParam('userId'), lobbyController.getLobbyForUser);

router.get('/lobby/:lobbyId', requireLobbyMember, lobbyController.getLobbyById);

router.put('/invite', selfField('body', 'inviterId'), lobbyController.inviteUser);

router.put('/accept', selfField('body', 'userId'), requireLobbyMember, lobbyController.acceptInvite);

router.put('/decline', selfField('body', 'userId'), requireLobbyMember, lobbyController.declineInvite);

router.post('/:lobbyId/signup', requireLobbyHost, lobbyController.signUpLobbyForEvent);

router.put('/remove', lobbyController.removeUser);

router.delete('/:lobbyId', requireLobbyHost, lobbyController.deleteLobby);

router.patch('/:lobbyId', requireLobbyHost, lobbyController.updateLobby);

router.put('/:lobbyId/event', requireLobbyHost, lobbyController.pitchEvent);

router.post('/:lobbyId/plan-next', requireLobbyHost, lobbyController.planNext);

router.get('/:lobbyId/calendar', selfField('query', 'userId'), lobbyCalendarController.getCalendar);

router.get('/:lobbyId/recommendations', selfField('query', 'userId'), lobbyController.getRecommendations);

module.exports = router;