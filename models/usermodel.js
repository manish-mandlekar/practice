const mongoose = require('mongoose')
const plm = require('passport-local-mongoose')
const userSchema = mongoose.Schema({
    email: String,
    fullname :String,
    username: String,
    password : String,
    dp:{
     type : String,
     default : 'def.png'
    },
    role : {
        type : String,
        default : 'user'
    },
    blocked : {
        type: Boolean,
        default : false
    },
    posts : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "post"
    }],
})
userSchema.plugin(plm)
module.exports = mongoose.model('user',userSchema)