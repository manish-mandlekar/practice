const mongoose = require('mongoose')

const postSchema = mongoose.Schema({
    post : String,
    caption : String,
    comments : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'comment'
    }],
    likes:[{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user'
    }],
    user :{
        type:mongoose.Schema.Types.ObjectId,
        ref : 'user'
    },
    location : String,
    time : {
        type :Date,
        default : Date.now()
    }
})

module.exports = mongoose.model('post',postSchema)