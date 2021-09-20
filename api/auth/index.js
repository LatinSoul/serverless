// const { createToken } = require('../utils/jwt')
// const errorHandler = require('../utils/errorHandler')
// const User = require('../models/User')
import jwt from 'jsonwebtoken'
// User
const mongoose = require('mongoose')
const { isEmail } = require('validator')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: [true, 'Please enter your first name or nickname'],
        lowercase: true,
        // validate: [isEmail, 'Please enter a valid email']
    },
    lastname: {
        type: String,
        required: [true, 'Please enter your last name'],
        lowercase: true,
        // validate: [isEmail, 'Please enter a valid email']
    },
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minLength: [6, 'Password must be be at least 6 character/digits length']
    }
})
// In model() function below, the 'user' (1st arg) is the singular of the collection name in the mongodb. Mongo db uses it as the single unit of the same name collection.
// thus, if the collection name is 'users' in Mongo db, the user arg here should be named 'user' 

// Encrypt password before creating a user in Mongo (Mongoose Hooks) 
// 1st arg = hook name (check Mongoose doc for hooks)
// 2nd arg = next (typical function to call when using hooks to let the program move on to the next thing to do)
// Note: since we are using a function that does sthg BEFORE we save sthg in the db, we don't have any other arg inside the 2nd function (which will only contain the next function arg) arg
userSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt()
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

const User = mongoose.model('user', userSchema)

// jwt
const maxAge = 3 * 24 * 60 * 60
const createToken = (id) => {
    return jwt.sign({ id }, process.env.ACCESS_TOKEN_1, { expiresIn: maxAge })
}

// function authenticateToken(req, res, next) {
//     const authHeader = req.headers.authorization
//     const token = authHeader && authHeader.split(' ')[1]
//     // console.log('req user:', req.user)
//     // console.log('authHeader', authHeader)
//     if (token == null) return res.sendStatus(401)
//     jwt.verify(token, process.env.ACCESS_TOKEN_1, (err, user) => {
//         if (err) return res.sendStatus(403)
//         req.user = user
//         next()
//     })
// }
// errH
function errorHandler(err) {
    // console.log(err.message, err.code)
    const errors = { email: '', password: '' }
    // validating unique user registration
    // this check comes first, as if the email is already in use, there is no need to validate it at first place!
    if (err.code === 11000) {
        errors.email = 'Email already registered.'
        return errors
    }
    // validating inputs errors 
    if (err.message.includes('user validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message
        })
    } else {
        errors.null = `User doesn't exist`
    }
    return errors
}

module.exports = async (req, res) => {
    const { email } = await req.body
    try {
        const user = await User.findOne({ email })
        const token = createToken(user._id)
        res.cookie('user', user, { httpOnly: true })
        res.status(200).send({ token })
    } catch (err) {
        const errors = errorHandler(err)
        res.status(400).send({ errors })
    }
    // res.status(200).json({ status: email })
}