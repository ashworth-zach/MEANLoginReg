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
    cookie: {
        maxAge: 60000
    }
}))
var User = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 100,
    },
    lastname: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 100,
    },
    email: {
        type: String,
        required: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 100,

    },
}, {
    timestamps: true
})
var UserLogin = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 100,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 100,
    }
}, )
// Store the Schema under the name 'User'
mongoose.model('User', User);
mongoose.model('UserLogin', UserLogin);

// Retrieve the Schema called 'User' and store it to the variable User

var User = mongoose.model('User');
var UserLogin = mongoose.model('UserLogin');
app.get('/', function (req, res) {
    User.find({}, function (err, Users) {
        res.render("index", {
            users: Users
        });
    })
})
app.post('/register', function (req, res) {
    if (req.body.confirm != req.body.password) {
        console.log("no match");
        res.redirect("/");
    }
    flag=false;
    User.find({email:req.body.email}, function(err,user){
        if(!user){
            var user = new User(req.body);
        
            user.save(function (err) {
                if (err) {
                    console.log("We have an error!", err);
                    for (var key in err.errors) {
                        req.flash('registration', err.errors[key].message);
                    }
                    res.redirect('/');
                } else {
                    bcrypt.hash(req.body.password, 10)
                        .then(hashed_password => {
                            user.password = hashed_password;
                            user.save();
                        })
                        .catch(error => {
        
                        });
                    User.create(user, function (err, user) {
                        req.session.UserId = user._id;
                        res.redirect('/users');
                    })
                }
            });
        }
        else{
            req.flash("registration","user is already in database");
            res.redirect('/');
        }
    })
});
app.post('/login', function (req, res) {
    var user = new UserLogin(req.body);

    user.save(function (err) {
        if (err) {
            console.log("We have an error!", err);
            for (var key in err.errors) {
                req.flash('login', err.errors[key].message);
            }
            res.redirect('/');
        } else {
            User.findOne({
                email: req.body.email
            }, function (err, user) {
                bcrypt.compare(req.body.password, user.password)
                    .then(result => {
                        if (result == true) {
                            req.session.UserId = user._id;
                            res.redirect('/users')
                        } else {
                            req.flash("login", "password does not match");
        
                            res.redirect('/')
                        }
                    })
                    .catch(error => {
                        req.flash("login", "password does not match");
                        res.redirect("/");
                    })
            })
        }
    });
});
app.listen(8000, function () {
    console.log("listening on port 8000");
})