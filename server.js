var express = require('express');
var mongoose = require('mongoose');
var app = express();
const session = require('express-session');
const flash = require('express-flash');
const bcrypt = require('bcrypt');
mongoose.connect('mongodb://localhost/27017');

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true
}));

var path = require('path');

app.use(flash());
app.use(express.static(path.join(__dirname, './static')));

app.set('views', path.join(__dirname, './views'));

app.set('view engine', 'ejs');
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}))
var User = new mongoose.Schema({
    firstname: {
        type: String,
        required: true, minlength: 6, maxlength: 100,
    },
    lastname: {
        type: String,
        required: true, minlength: 6, maxlength: 100,
    },
    email: {
        type: String, required: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true, minlength: 8, maxlength: 100,

    },
    confirm: {
        type: String,
        required: true,
        matches: password
    }

}, {
        timestamps: true
    })
var UserLogin = new mongoose.Schema({
    email: {
        type: String, required: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true, minlength: 8, maxlength: 100,
    }
}, {
        timestamps: true
    })
// Store the Schema under the name 'User'
mongoose.model('User', User);
// Retrieve the Schema called 'User' and store it to the variable User
var User = mongoose.model('User');
app.get('/', function (req, res) {
    User.find({}, function (err, Users) {
        res.render("index", { users: Users });
    })
})
app.post('/register', function (req, res) {
    var user = new User(req.body);
    user.save(function (err) {
        if (err) {
            console.log("We have an error!", err);
            for (var key in err.errors) {
                req.flash('registration', err.errors[key].message);
            }
            res.redirect('/');
        }
        else {
            bcrypt.hash(req.body.password, 10)
                .then(hashed_password => {
                    user.password = req.body.password;
                })
                .catch(error => {
                    console.log("error")
                });
            User.create(user, function (err) {
                res.redirect('/users');
            })
        }
    });
});
app.post('/login', function (req, res) {
    var user = new UserLogin(req.body);
});
app.listen(8000, function () {
    console.log("listening on port 8000");
})