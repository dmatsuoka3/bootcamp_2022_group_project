const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const followSchema = new mongoose.Schema ({
    userId:  { 
        type: String,
        },
    following: { 
            type: String,
        },
})

followSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('following', followSchema);