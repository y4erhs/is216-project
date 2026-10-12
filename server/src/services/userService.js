const bcrypt = require('bcrypt')
const User = require('../models/user')
const Recommendation = require('../models/recommendation')

//CREATE
//create a user
exports.createUser = async ({ username, email, password, dob, preferences, bio, major, year, ccas }) => {
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({username, email, password: hashedPassword, dob, preferences, bio, major, year, ccas})

    const userObject = user.toObject()
    delete userObject.password
    return userObject
}

//DELETE
//delete a user by their id
exports.deleteUser = async (userId) => {
    const user = await User.findByIdAndDelete(userId)
    if (!user) {
        return null
    }

    await Recommendation.deleteMany({ user: userId })

    return user
}

//GETS
//get the certin user object using their id
exports.getUser = async (userId) => {
    const user = await User.findById(userId)
    return user
}

//get all the interests indicated by user
exports.getInterests = async (userId) => {
    const user = await exports.getUser(userId)
    if (!user) {
        return []
    }
    return user.preferences
}


//UPDATES
//find user by id and update username
exports.updateUsername = async (userId, username) => {
    const user = await User.findByIdAndUpdate (userId, {username:username}, {new: true, runValidators: true})
    return user
}

//find user by id and update email
exports.updateEmail = async (userId, email) => {
    const user = await User.findByIdAndUpdate (userId, {email:email}, {new: true, runValidators: true})
    return user
}

//find user by id and update avatar
exports.updateAvatar = async (userId, avatar) => {
    const user = await User.findByIdAndUpdate (userId, {avatar:avatar}, {new: true, runValidators: true})
    return user
}

//find user by id and update dob
exports.updateDob = async (userId, dob) => {
    const user = await User.findByIdAndUpdate (userId, {dob:dob}, {new: true, runValidators: true})
    return user
}

//find user by id and update preferences
exports.updatePreferences = async (userId, preferences) => {
    const user = await User.findByIdAndUpdate (userId, {preferences:preferences}, {new: true, runValidators: true})
    return user
}

//find user by id and update bio
exports.updateBio = async (userId, bio) => {
    const user = await User.findByIdAndUpdate (userId, {bio:bio}, {new: true, runValidators: true})
    return user
}

//find user by id and update major
exports.updateMajor = async (userId, major) => {
    const user = await User.findByIdAndUpdate (userId, {major:major}, {new: true, runValidators: true})
    return user
}

//find user by id and update year
exports.updateYear = async (userId, year) => {
    const user = await User.findByIdAndUpdate (userId, {year:year}, {new: true, runValidators: true})
    return user
}

//find user by id and update ccas
exports.updateCcas = async (userId, ccas) => {
    const user = await User.findByIdAndUpdate (userId, {ccas:ccas}, {new: true, runValidators: true})
    return user
}



