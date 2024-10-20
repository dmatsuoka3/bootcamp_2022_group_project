const mongoose = require('mongoose');
var mongoose_delete = require('mongoose-delete');

const imageSchema = new mongoose.Schema({
    
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserModel'
    }, 

    userString: {
        type: String
    },

    caption: {
        type: String,
    },


    timeCreated: {
        type: Date,
        default: () => Date.now(),
    },
    
    snippet: {
        type: String,
    },

    img: {
        type: String,
        default: 'placeholder.jpg',
    },


    postedBy: {
        type: String
    },

    profileImg: {
        type: String,
        default: 'placeholder.jpg'
    },

    likedByIds: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UserModel' 
        },
    ],
    
    likedByNames: [
        {
            type: String
        },
    ],
});


imageSchema.plugin(mongoose_delete);

module.exports = mongoose.model("imagesposts", imageSchema);