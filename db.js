if (process.env.NODE_ENV === 'development') {
    require('dotenv').config()
}

const mongoose = require('mongoose');
const database = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log("Database is up...")
    } catch (err) {
        console.log("Database is NOT up : ", err)
    }
}

module.exports = database
