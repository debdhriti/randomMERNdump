if (process.env.NODE_ENV === 'development') {
    require('dotenv').config()
}

const express = require('express')
const db = require('./db')
const cors = require('cors');
const User = require('./models/User')
const passport = require('passport');
var session = require('express-session');
const MongoDBStore = require("connect-mongo");
const LocalStrategy = require('passport-local')
passport.use(new LocalStrategy({
    usernameField: 'email' // Specify the field to be used as the username (in this case, 'email')
}, User.authenticate()));
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middlewares')

const app = express()
const port = process.env.PORT || 3000

const store = MongoDBStore.create({
    mongoUrl: process.env.DB_URL,
    secret: process.env.SECRET,
    touchAfter: 24 * 60 * 60,
});

const sessionConfig = {
    store,
    name: "sessionCookie",
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //expire date
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};

app.use(session(sessionConfig));


app.use(express.urlencoded({ extended: true }));
app.use(express.json())

// Enable CORS for all routes
app.use(cors());

db()

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.post('/login', async (req, res) => {
    console.log(req.body)
    if (!req.body.email) {
        res.status(400).json({ success: false, message: "Email was not given" })
    }
    else if (!req.body.password) {
        res.status(400).json({ success: false, message: "Password was not given" })
    }
    else {
        passport.authenticate("local", function (err, user, info) {
            if (err) {
                res.json({ success: false, message: err });
            }
            else {
                console.log(user)
                if (!user) {
                    res.json({ success: false, message: "username or password incorrect" });
                }
                else {
                    const token = jwt.sign({ userId: user._id, username: user.name }, process.env.SECRET, { expiresIn: "24h" });
                    res.json({ success: true, message: "Authentication successful", token: token, redirect: "/" });
                }
            }
        })(req, res);
    }
})

app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    // return res.status(200).json({ success: true, redirect: "/login" });
    const newUser = new User({ username: email, email: email, name: name });
    console.log(newUser)
    await User.register(newUser, password, (err, user) => {
        if (err) {
            if (err.name === 'UserExistsError') {
                return res.status(200).json({ success: true, redirect: "/login" });
            }
            return res.status(400).json({ success: false, error: err.message });
        } else {
            console.log(user)
            return res.status(200).json({ success: true, redirect: "/login" });
        }
    });

})

app.post('/authenticate', authenticateToken, (req, res) => {
    res.status(200).json({ loggedIn: true, user: JSON.stringify(req.user) });
})

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout error' });
        }
        return res.status(200).json({ redirect: '/login' });
    });
})

app.post('/savecart', authenticateToken, async (req, res) => {
    console.log(req.user);
    console.log(req.body.newCart)
    try {
        const newdoc = await User.findOneAndUpdate({ _id: req.user.userId }, { cart: req.body.newCart }, {
            new: true
        })
        console.log(newdoc);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(400).json({ success: false, message: `Error while adding to cart: ${err}` })
    }

})

app.get('/cart', authenticateToken, async (req, res) => {
    try {
        console.log("user: ", req.user);
        const relatedUserCart = await User.findOne({ _id: req.user.userId });
        console.log("cart: ", relatedUserCart.cart)
        res.status(200).json({ success: true, cart: relatedUserCart.cart });
    }
    catch (err) {
        res.status(400).json({ success: false, message: `Error while fetching user's cart: ${err}` })
    }
})


app.get('/', (req, res) => {
    res.send('Hello World!')
})


app.listen(port, () => {
    console.log(`Listening on port ${port}...`)
})