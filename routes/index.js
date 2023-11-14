var express = require('express');
var router = express.Router();
var userModel = require('../models/usermodel')
var postModel = require('../models/postmodel')
var commentModel = require('../models/commentModel')
const passport = require('passport');
const multer = require('multer')
const crypto = require('crypto')
var id3 = require('node-id3')
const path = require('path')
const fs = require('fs')
const { Readable } = require('stream')
const localStrategy = require('passport-local').Strategy;
passport.use(new localStrategy(userModel.authenticate()));

const mongoose = require('mongoose');
const usermodel = require('../models/usermodel');
mongoose.connect('mongodb://0.0.0.0/instagram').then(() => {
  console.log("connected to database")
}).catch((err) => {
  console.log(err);
})

var conn = mongoose.connection
var gfsbucket
conn.once('open', () => {
  gfsbucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'post'
  })
})

const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9 + path.extname(file.originalname))
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const upload1 = multer({ storage: storage1 })


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/accounts/emailsignup', function (req, res, next) {
  res.render('signup');
});

/*authentication code  */

router.get('/feed', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
  const post = await postModel.find().populate('user')
  console.log(post);
  res.render('feed', { user, post })


})



router.post('/register', function (req, res) {
  var newUser = new userModel({
    username: req.body.username,
    email: req.body.email,
    fullname: req.body.fullname,

  })
  userModel.register(newUser, req.body.password)
    .then(function (u) {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/feed');
      })
    })
});
router.post('/login', passport.authenticate('local', {
  successRedirect: 'feed',
  failureRedirect: '/',
}),
  function (req, res, next) { }
);
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect('/');
  }
}
router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
/*authentication code  */


const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

router.get('/profile/:username', isLoggedIn, async (req, res, next) => {
  const user = await userModel.findOne({
    username: req.params.username
  }).populate('posts')
  const loggedInUser = await userModel.findOne({
    username: req.session.passport.user
  }).populate('posts')

  // console.log(user.posts);
  res.render('profile', { user, posts: user.posts, loggedInUser })

})


router.get('/post/:postname', (req, res, next) => {
  gfsbucket.openDownloadStreamByName(req.params.postname).pipe(res)
})

router.post('/postcreator', isLoggedIn, upload.single('file'), async (req, res, next) => {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
  // console.log(req.file.buffer);
  const randomname = crypto.randomBytes(20).toString('hex')
  const postData = id3.read(req.file.buffer)
  await Readable.from(req.file.buffer).pipe(gfsbucket.openUploadStream(randomname + "post"))


  const post = await postModel.create({
    post: randomname + 'post',
    user: req.user._id,
    caption: req.body.caption
  })
  user.posts.push(post._id)
  await user.save();
  setTimeout(() => {
    res.redirect('/feed')
  }, 500);

})

// dp change code 
router.post('/changedp', isLoggedIn, upload1.single('profile-photo'), (req, res, next) => {
  userModel.findOne({
    username: req.session.passport.user
  }).then((founduser) => {
    if (founduser.dp !== 'def.png') {
      fs.unlinkSync(`./public/images/uploads/${founduser.dp}`)
    }
    console.log(req.file);
    founduser.dp = req.file.filename
    founduser.save()
  }).then(() => {
    res.redirect('/profile')
  })
})
// likes 
router.get('/like/:postId/:userId', (req, res, next) => {
  console.log("haha");
  postModel.findOne({
    _id: req.params.postId
  }).then((foundpost) => {
    var success = false;
    if (foundpost.likes.includes(req.params.userId)) {
      var index = foundpost.likes.indexOf(req.params.userId);
      foundpost.likes.splice(index, 1)
      
    } else {
      foundpost.likes.push(req.params.userId)
      success = true;
    }
    foundpost.save().then(() => {
      res.json(success)
    })
  })
})
// commment
router.get('/comment/:id', isLoggedIn, (req, res, next) => {
  userModel.findOne({
    username: req.session.passport.user
  }).then((founduser) => {
    postModel.findOne({
      _id: req.params.id
    }).populate([
      {
        path: "user",
        model: "user",
      },
      {
        path: "comments",
        model: "comment",
        populate: {
          path: "user",
          model: "user",
        }
      }
    ]).then((userpost) => {
      res.render('comment', { founduser, userpost })
    })
  })
})


// commmment
router.post('/comment/:id', (req, res, next) => {
  userModel.findOne({
    username: req.session.passport.user
  }).then((user) => {
    postModel.findOne({
      _id: req.params.id
    }).then((foundpost) => {
      commentModel.create({
        comment: req.body.comment,
        user: user._id
      }).then((cmntcreated) => {
        foundpost.comments.push(cmntcreated._id)
        foundpost.save().then(() => {
          res.redirect(`/comment/${req.params.id}`)
        })
      })
    })
  })

})

router.get('/cmtLike/:cmtId/:userId',async (req,res,next)=>{
  var user = await userModel.findOne({
     _id : req.params.userId
  })
  commentModel.findOne({
    _id: req.params.cmtId
  }).then((foundcmnt) => {
    if (foundcmnt.likes.includes(user._id)) {
      var index = foundcmnt.likes.indexOf(user._id);
      foundcmnt.likes.splice(index, 1)
    } else {
      foundcmnt.likes.push(user)
    }
    foundcmnt.save().then(() => {
      res.redirect('back')
    })
  })
})

// ---------------explore-----
router.get('/explore',isLoggedIn, async (req,res,next)=>{
  const user = await usermodel.findOne({
    username : req.session.passport.user
  })
  res.render('explore',{user})
})
module.exports = router;
