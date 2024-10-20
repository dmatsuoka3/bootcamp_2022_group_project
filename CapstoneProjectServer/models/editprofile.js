const mongoose = require('mongoose');
var mongoose_delete = require('mongoose-delete');

let imageSchema = new mongoose.Schema({
    img: {
        type: String,
        default: 'placeholder.jpg',
    },
    timeCreated: {
        type: Date,
        default: () => Date.now(),
    },
    userid: {
        type: String,
        default: ''
    },
    
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserModel'
    }, 
});

imageSchema.plugin(mongoose_delete);

module.exports = mongoose.model("profileimage", imageSchema);