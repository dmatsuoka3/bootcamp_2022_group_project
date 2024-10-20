const mongoose = require('mongoose')

const connectDB = async() => {

    const url = "mongodb+srv://daigompublic:daigompublic@clusterpublic.fbhv1at.mongodb.net/?retryWrites=true&w=majority";

    mongoose
        .connect(url)
        .then(() => {console.log(`Connected to the daigompublic database`);})
        .catch((error) => console.log(`Issues connecting to the daigompublic database: ${error}`));
}

module.exports = connectDB;