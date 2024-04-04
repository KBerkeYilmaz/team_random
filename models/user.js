import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // Define your user schema fields here
    userMail: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    img: {
        type: String,
        required: false
    },
    userPassword: {
        type: String,
        required: true
    },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
