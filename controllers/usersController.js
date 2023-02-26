const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')
const { restart } = require('nodemon')

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean()
    if (!users?.length) {
        return res.status(400).json({ message: "no users found"});
    } 
    res.json(users);
})

const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body
    //confirmDATA
    if (!username || !password ) {
        return res.status(400).json({ message: 'All fields are required'})
    }
    const duplicate = await User.findOne({ username }).collation({ locale:'en', strength:2 }).lean().exec() // collation({ locale:'en', strength:2 }) => allow to check for case insensitivity

    if (duplicate) {
        return res.status(409).json({ message: 'Username already exists' })
    }
    // Hash the password
    const hashedPwd = await bcrypt.hash(password, 10) // 10 -> salt rounds

    const userObject = (!Array.isArray(roles) || !roles.length)
        ? { username, "password":hashedPwd }
        : { username, "password":hashedPwd, roles }

    // Create and store the new user

    const newUser = await User.create(userObject)

    if (newUser) { // created
        res.status(201).json({ message: `new user ${newUser.username} created` })
    } else {
        res.status(400).json({ message: 'invalid userdata received' })
    }

})

const updateUser = asyncHandler(async (req, res) => {
    const { id, username, roles, active, password } = req.body
    
    // confirm data 
    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({ message: 'all fields are required'})
    }
    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(404).json({ message: 'user not found' })
    }
    // Check for duplicate
    const duplicate = await User.findOne({username}).lean().exec()
    // allow updates to the original user
    if ( duplicate && duplicate?._id.toString() !== id ) {
        return res.status(409).json({message:'Duplicate username'});
    }
    user.username = username
    user.active = active
    user.roles = roles
    if ( password ) {
        // Hash Password
        const hashedPwd = await bcrypt.hash(password,10)
        user.password = hashedPwd
    }

    const updateUser = await user.save()

    res.status(200).json({ message: `${updateUser.username} updated` });
})

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body
    if (!id) {
        return res.status(400).json({ message: 'user ID is required' });
    }
    const note = await Note.findOne({ user: id }).lean().exec() 
    if ( note ) {
        return res.status(400).json({ message: 'User has asigned notes' });
    }
    const user = await User.findById(id).exec()

    if ( !user ) {
        return res.status(400).json({ message: 'User not found' });
    }

    const result = await user.deleteOne();

    res.json(`Username: ${result.username} with ID: ${result.__id} Deleted`)
    
})

module.exports = { getAllUsers, createNewUser, updateUser, deleteUser }