const router = require("express").Router();
const { request } = require("express");
const express = require("express");
const session = require('express-session')
const multer = require("multer");

const isLoggedIn = (req, res, next) => {
    // if the user is already logged in, then return 'next'
    if (req.isAuthenticated()) {
    return next();
    }
    res.redirect("/login");
};

// define storage for the images
const storage = multer.diskStorage({
    // destination for files
    destination: function (request, file, callback) {
    callback(null, './assets/userPostImages');
    },

    // add back the extension
    filename: function (request, file, callback) {
    callback(null, Date.now() + file.originalname);
    },
});

// upload parameters for multer
const upload = multer({
    storage: storage,
    limits: {
        fieldSize: 1024 * 1024 * 3
    }
});

// BLUEPRINTS
const ImageModel = require("../models/Post");
const UserModel = require("../models/User");
const followModel = require("../models/Following");

// Read
// get User data and tranfer into other '/feeds' route
router.get('/feeds', isLoggedIn, (req, res, next)=> {

    // get data from Login user
    UserModel.findById(req.user.id, (error, result)=> {
        if(error) {
            console.log(error);
        } else {
            req.singleUser = result;
            next();
        }
    });
});

// Made the route asyncrounous, so the results from the DB query can be used outside of its CB
router.get('/feeds', isLoggedIn, async (req, res) => {

    // find all users except login user
    var users = await UserModel.find({_id: {$ne: req.user.id}}).exec();

    // get an object from login user
    var mainUserObject = await UserModel.findById(req.user.id).exec();
 
    // create  a for loop for 'users' array
    for(var followusers in users) {
        var followingthem = 0;

        // make a query to count document for following
        var isfollowing = await followModel.countDocuments({
            userId: req.user.id, 
            following: users[followusers].id
        }).exec();
        
        users[followusers] = {following: isfollowing, user: users[followusers]}
    }

    req.allUsers = users;

    //query list of users following
    var followeduser = await followModel.find({userId: req.user.id}).exec();

    // make an array for followers
    var fusers = []

    // get each follower from user into 'fusers' array
    for(var fu in followeduser){
        fusers.push(followeduser[fu].following)
        // console.log("\n\nfolloweduser[fu].following: " + followeduser[fu].following + "\n");
    }

    // get also login user id into 'fusers' array
    fusers.push(mainUserObject._id);

    console.log('hola', fusers)

    // get posts data from following users and login user
    var postfeed = await ImageModel.find({deleted: false, user: {$in: fusers}}).sort({ timeCreated: 'desc' }).exec();
    
    //Loop through the posts variable(this is all the posts)
    for(var posts in postfeed) {
        //Query DB search for the user info based on the posts user ID
        var postuser = await UserModel.findById(postfeed[posts].user).exec();

        //Merge the postuser data into the postdata object (per post)
        postfeed[posts] = {post: postfeed[posts], user: postuser}
    }

    ImageModel.find()

    res.render('feeds.ejs', {
        data: postfeed, 
        user: req.singleUser,   // get 'req.singleUser' from one of '/feeds' routes
        allUsers: req.allUsers  // get 'req.allUsers' from one of '/feeds' routes
    })

    
});

// Create
router.post('/posts', isLoggedIn, upload.single('image'), async (req, res) => {

    // make a variable for login user's id
    const userId = req.user.id;

    // make a variable for login user's username
    const userName = req.user.username;

    console.log("\nHome page\nUsername: " + userName
              + "\nUser Id: " + userId
              + "\nEmail: " + req.user.email + "\n\n"
              + "object: " + req.user + "\n"
              // + "\n\nUserModel: " + user + "\n"
    );
    
    // if uploader can't find a file...
    if(!req.file) {
        console.log("File was not found.");
    
        // then redirect to '/new' route
        res.redirect('/new');
    }

    // get info from login user
    UserModel.findById(req.user.id, (error, result)=> {
        if(error) {
            console.log(error);
        } else {

            // make a variable for 'profilePicture' from login user info
            const profPic = result.profilePicture;

            // create a new info for post
            const theImage = new ImageModel({
                caption: req.body.caption,
                img: req.file.filename,
                user: userId,   
                userString: userId,
                postedBy: userName,
                profileImg: profPic,
                likedByIds: req.body.likedByIds,
                likedByNames: req.body.likedByNames
            });

            // then save it along with info
            theImage.save(function() {
                
                theImage.delete(function() {
                    // mongodb: {deleted: true,}
                    theImage.restore(function() {
                    // mongodb: {deleted: false,}
                    });
                });
            });
        }
    });

    // redirect to '/feeds' route
    res.redirect("/feeds");
});

// make a new post
router.get('/new', (req, res)=> {
    res.render("newPost");
});

// Update
router.get('/update/:id', (req, res)=> {

    // make a variable for login user's id
    const userId = req.user.id;

    // make a variable for post's id
    const imageId = req.params.id;

    console.log("\n\nUser's id: " + userId);
    console.log("\n\nPost's id: " + imageId);

    // get an info from image post
    ImageModel.findById(imageId, (error, resultPost)=> {
        if(error) {
            console.log(error);
        } else {

            // get the user id from image post
            const theImageUser = resultPost.user;
            
            console.log("\n\ntheImageUser: " + theImageUser);

            // get info from login user
            UserModel.findById(userId, (error, userResult)=> {
                if(error) {
                    console.log(error);
                } else {
                    console.log("\n\nUserModel's result: " + userResult);
                    
                    // get user's id
                    const theUserId = userResult._id;

                    // if this image is posted by login user...
                    if(theUserId.equals(theImageUser)) {

                        // tranfer 'post' info data into 'updatePost.ejs'
                        res.render("updatePost", {data: resultPost});
                    
                    // or else
                    } else {
                        console.log("\n\nYou don't have permission to update this user's post.\n\n");
                        res.redirect("/feeds");
                    }
                }
            });
        
        }
    });

});

router.put('/update/:id', (req, res)=> {

    // update the post with caption
    ImageModel.findByIdAndUpdate({_id: req.params.id},
        {caption: req.body.caption},
        (error, result)=> {
            if(error) {
                res.send(error.message);
            } else {
                res.redirect("/feeds");
            }
        }
    );
});

// Delete
router.get('/home/:id', (req, res)=> {
    
    // make a variable for login user's id
    const userId = req.user.id;

    // make a variable for post's id
    const imageId = req.params.id;

    console.log("\n\nUser's id: " + userId);
    console.log("\n\nPost's id: " + imageId);

    // get an object from post
    ImageModel.findById(imageId, (error, resultPost)=> {
        if(error) {
            console.log(error);
        } else {
            console.log("\n\nDelete's ImageModel result: " + resultPost + "\n");

            // make a variable for 'user' from post object
            const theImageUser = resultPost.user;
            
            console.log("\n\ntheImageUser: " + theImageUser);

            // get an object from login user
            UserModel.findById(userId, (error, userResult)=> {
                if(error) {
                    console.log(error);
                } else {
                    console.log("\n\nUserModel's result: " + userResult);
                    
                    // make a variable for id from login user object
                    const theUserId = userResult._id;
                    
                    // if this image is posted by login user...
                    if(theUserId.equals(theImageUser)) {

                        // then login user can delete their own post
                        ImageModel.deleteById(req.params.id, (error, result)=> {
                            if(error) {
                                console.log("Something went wrong delete from database");
                            } else {
                                console.log("\n\nThis post has been deleted by " + req.user.name + ".\n" + 
                                                result);
                                
                                // redirect to '/feeds' route
                                res.redirect("/feeds");
                            }
                        });

                    // or else if this post is not owned by login user...
                    } else {
                        console.log("\n\nYou don't have permission to delete this user's post.\n\n");
                        // then you can delete this post
                        res.redirect("/feeds");
                    }
                }
            });
        }
    });
});

// like route
router.put('/like/:id', (req, res)=> {

    // get an object from post for User's id
    ImageModel.findById(req.params.id, (error, postObject)=> {
        if(error) {
            console.log(error);
        } else {
            // make a variable for 'likedByIds'from 'postObject'
            const postLikedBy = postObject.likedByIds;

            // get another object from post for User's name
            ImageModel.findById(req.params.id, (error, postObjectTwo)=> {
                if(error) {
                    console.log(error);
                } else {

                    // make a variable for 'likedByNames' from 'postObjectTwo'
                    const postLikedByName = postObjectTwo.likedByNames;

                    // Get an object from login user
                    UserModel.findById(req.user.id, (error, userObject)=> {
                        if(error) {
                            console.log(error);
                        } else {

                        // make a variable for 'likes' from 'userObject'
                        const userLikes = userObject.likes;
                            
                            // if login user haven't gave a like to a post...
                            if(!postLikedBy.includes(req.user.id)) {
                                
                                // then add login user's id into 'postLikedBy' array
                                postLikedBy.push(req.user.id);
                                postObject.save();  // and save it
        
                                // then add login user's name into 'postLikedByName' array
                                postLikedByName.push(req.user.name);
                                postObjectTwo.save();   // and save it
        
                                // then add post's id into 'userLikes' array
                                userLikes.push(req.params.id);
                                userObject.save();  // and save it
        
                                // redirect to 'feeds' route
                                res.redirect("/feeds");
                            
                            // or else if login user already gave a like to post...
                            } else {
        
                                // then remove login user's id from 'postLikedBy' array
                                postLikedBy.pull(req.user.id);
                                postObject.save();   // and save it
    
                                // then remove login user's name from 'postLikedByName' array
                                postLikedByName.pull(req.user.name);
                                postObjectTwo.save();   // and save it
        
                                // then remove post's id from 'userLikes' array
                                userLikes.pull(req.params.id);
                                userObject.save();  // and save it
        
                                // redirect to '/feeds' route
                                res.redirect("/feeds");
                            }
                        }
                    });
                }
            });            
        }
    });
});

module.exports = router;