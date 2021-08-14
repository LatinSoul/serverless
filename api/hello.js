const User = require('./models/User')

const hello = async (req, res) => {
    // res.status('200').json({ message: 'back to export default' });
    const email = 'oc@gmail.com'
    try {
        const user = await User.findOne({ email })
        console.log('uid:', user._id)
        // const token = createToken(user._id)
        // res.cookie('user', user, { httpOnly: true })
        res.status(200).json({ user: user._id })
    } catch (err) {
        // const errors = errorHandler(err)
        res.status(400).json({ errors: err })
    }
}




export default hello