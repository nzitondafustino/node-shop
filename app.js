const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session=require('express-session');
const mongoDBStore=require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash=require('connect-flash');
const multer=require('multer');

const shopController = require('./controllers/shop');
const isAuth =require('./middleware/is-auth');

const storage=multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,'images');
  },
  filename:(req,file,cb)=>{
   cb(null,new Date().toISOString() +'-' + file.originalname);
  }
})
const filer=(req,file,cb)=>{
  if(file.mimetype==='image/png' ||file.mimetype==='image/jpg' || file.mimetype==='image/jpeg' )
  cb(null,true);
  else
  cb(null,false);
}
const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();
const store=new mongoDBStore({
  uri:'mongodb+srv://node:node@cluster0-tkfjg.mongodb.net/test?retryWrites=true&w=majority',
  collection:'session'
})

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes=require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage:storage,fileFilter:filer}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use(session({secret:'hjhfjshfjsdhjskjfskjfsjfkd',resave:false,saveUninitialized:false,store:store}));
const csrfProtection = csrf()

app.use((req, res, next) => {
  if(!req.session.user){
    return next();
  }
 
  User.findById(req.session.user._id)
    .then(user => {
      if(!user){
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      throw new Error(err);
    }
      );
});
app.use(flash());
app.use((req,res,next)=>{
  res.locals.isAuthenticated=req.session.isLoggedIn;
  next();
})
app.post('/create-order',isAuth, shopController.postOrder);
app.use(csrfProtection);
app.use((req,res,next)=>{
  res.locals.csrfToken=req.csrfToken();
  next();
})
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use('/500',errorController.get500);

app.use(errorController.get404);
app.use((error,req,res,next)=>{

  res.status(500).render('500', { 
    pageTitle: 'error', path: '/50',isAuthenticated:req.session.isLoggedIn });
})
mongoose
  .connect(
    'mongodb+srv://node:node@cluster0-tkfjg.mongodb.net/test?retryWrites=true&w=majority'
  )
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  }); 
