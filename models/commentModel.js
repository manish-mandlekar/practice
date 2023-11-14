const mongoose = require('mongoose')

const commentSchema = mongoose.Schema({
    user : {
        type:mongoose.Schema.Types.ObjectId,
        ref : 'user'
    },
    comment : String,
    post : {
        type:mongoose.Schema.Types.ObjectId,
        ref : 'post'
    },
    time : {
        type :Date,
        default : Date.now()
    },
    likes :[{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user'
    }]
})

module.exports = mongoose.model('comment',commentSchema)