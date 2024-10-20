const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const profileSchema = new mongoose.Schema({
    profileimg: {
        type: String,
        default: 'https://cdn.landesa.org/wp-content/uploads/default-user-image.png',
    },
    timeCreated: {
        type: Date,
        default: () => Date.now(),
    }
});

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
        
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        
        }, 
        phone: {
            type: String,
        },
        gender: {
            type: String,
        },
        bio: {
            type: String,
        },
        website: {
            type: String,
        },
        password: {
            type: String,
        
        },
        profilePicture: {
            type: String,
            default: ""
        },
    
        followers:  [
            { 
                type: mongoose.Schema.Types.ObjectId,
                ref: 'UserModel' 
            },
        ],

        followings: [
            { 
                type: mongoose.Schema.Types.ObjectId,
                ref: 'UserModel' 
            },
        ],

        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ImageModel' 
            },
        ],

        created: {
            type: Date,
            required: true,
            default: Date.now
        },
        
        profile: profileSchema,
    },

);
        

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('users', userSchema);