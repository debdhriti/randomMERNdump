const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");


const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    cart: Object,
});

UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });


const User = mongoose.model("User", UserSchema);
module.exports = User;