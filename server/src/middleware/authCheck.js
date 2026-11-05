const jwt = require('jsonwebtoken');
const Lobby = require('../models/Lobby');

const LOGIN_DAYS = '7d';
const LOGIN = 'login';
const GOOGLE_LINK = 'google-link';

const sameId = (a, b) => String(a) === String(b);

// The signed pass the browser gets when it logs in
exports.signLoginToken = (userId) =>
    jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { audience: LOGIN, expiresIn: LOGIN_DAYS });

// Survives the trip to Google and back, so nobody can link their Google to another user's account
exports.signGoogleLinkState = (userId) =>
    jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { audience: GOOGLE_LINK, expiresIn: '10m' });

exports.readGoogleLinkState = (state) =>
    jwt.verify(String(state), process.env.JWT_SECRET, { audience: GOOGLE_LINK }).sub;

// Every protected route: who is this? The answer comes from the token, not from the request.
exports.requireAuth = (req, res, next) => {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Please log in' });
    }
    try {
        const { sub } = jwt.verify(token, process.env.JWT_SECRET, { audience: LOGIN });
        req.user = { id: sub };
        return next();
    } catch (err) {
        return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
    }
};

// A user id in the address must be the logged-in user, e.g. selfParam('id') for /users/:id
exports.selfParam = (name) => (req, res, next) => {
    if (!sameId(req.params[name], req.user.id)) {
        return res.status(403).json({ message: "You can't do that for another user" });
    }
    return next();
};

// Same for a user id in the query or body. If it's missing, the logged-in user is filled in.
exports.selfField = (source, field) => (req, res, next) => {
    const values = req[source] || (req[source] = {});
    if (values[field] !== undefined && !sameId(values[field], req.user.id)) {
        return res.status(403).json({ message: "You can't do that for another user" });
    }
    values[field] = req.user.id;
    return next();
};

function findLobby(req, res, canAccess, refusal) {
    const lobbyId = req.params.lobbyId || req.body?.lobbyId;
    return Lobby.findById(lobbyId).select('host participants invited declined').then(lobby => {
        if (!lobby) {
            res.status(404).json({ message: 'Lobby not found' });
            return false;
        }
        if (!canAccess(lobby)) {
            res.status(403).json({ message: refusal });
            return false;
        }
        return true;
    });
}

// Only the host can run these lobby actions
exports.requireLobbyHost = async (req, res, next) => {
    try {
        const allowed = await findLobby(req, res, lobby => sameId(lobby.host, req.user.id), 'Only the host can do that');
        if (allowed) next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid lobby id' });
    }
};

// Anyone in the lobby, including people who are invited or said no and can change their reply
exports.requireLobbyMember = async (req, res, next) => {
    try {
        const allowed = await findLobby(req, res, lobby =>
            [lobby.host, ...lobby.participants, ...lobby.invited, ...lobby.declined].some(id => sameId(id, req.user.id)),
            "You're not in this lobby");
        if (allowed) next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid lobby id' });
    }
};
