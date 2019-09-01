const bcrypt=require('bcrypt');
const crypt=require('crypto');
const { validationResult } = require('express-validator')

const User=require('../models/user');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nzitondafustino@gmail.com',
    pass: 'Fau81153772'
  }
});
exports.getLogin=(req,res,next)=>{
    let message=req.flash('error');
    if(message.length > 0)
    {
        message=message[0];
    }
    else {
        message=null;
    }
    res.render('auth/login',{
        pageTitle:'login',
        path:'/login',
        message:message,
        oldfield:{
            email:'',password:''
        }
    })
}
exports.getSignup=(req,res,next)=>{
    let message=req.flash('error');
    if(message.length > 0)
    {
        message=message[0];
    }
    else {
        message=null;
    }
    res.render('auth/signup',{
        pageTitle:'signup',
        path:'/signup',
        message:message,
        oldfield:{
            email:'',
            password:'',
            name:'',
            confirmPassword:''
        },
        validationErrors:[]
    })
}
exports.postSignup=(req,res,next)=>{
  const name=req.body.name;
  const email=req.body.email;
  const password=req.body.password;
  const errors=validationResult(req);
  console.log(errors.array());
  if(!errors.isEmpty()){
      return res.status(422).render('auth/signup',{
        pageTitle:'signup',
        path:'/signup',
        message:errors.array()[0].msg,
        oldfield:{
            email:email,
            password:password,
            name:name,
            confirmPassword:req.body.confirmPassword
        },
        validationErrors:errors.array()
    })
  }
    bcrypt.hash(password, 10)
    .then(hash=>{
        const user=new User({
            email:email,
            name:name,
            password:hash,
            cart:{
                items:[]
            }
        });
        return user.save()
    })
    .then(result=>{
        const mailOptions = {
            from: 'nzitondafustino@gmail.com',
            to: email,
            subject: 'Sending Email using Node.js',
            text: 'you have successfull created you account'
          };
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } 
          });
          res.redirect('/login');
    })
}
exports.postLogin=(req,res,next)=>{
    const email=req.body.email;
    const password=req.body.password;
    const errors=validationResult(req);
    User.findOne({email:email})
    .then(user=>{
        if(!user){
            res.render('auth/login',{
                pageTitle:'login',
                path:'/login',
                message:'Invalid email or password',
                oldfield:{
                    email:email,password:password
                }
            })
        }
        bcrypt.compare(password,user.password)
        .then(match=>{
            if(match){
                req.session.isLoggedIn=true;
                req.session.user=user;
                req.session.save(error=>{
                    if(error){
                        console.log(error)
                    }
                    res.redirect('/');
                })     
            } else {
                res.render('auth/login',{
                    pageTitle:'login',
                    path:'/login',
                    message:'Invalid email or password',
                    oldfield:{
                        email:email,password:password
                    }
                })
            }
        })
        .catch(err=>{
            const error=new Error(err);
              error.httpStatusCode=500;
              next(error);
          });
    })
    .catch(err=>{
        const error=new Error(err);
          error.httpStatusCode=500;
          next(error);
      });
}
exports.postLogout=(req,res,next)=>{
    req.session.destroy((error)=>{
        res.redirect('/');
    })
}
exports.getReset=(req,res,next)=>{
    let message=req.flash('error');
    if(message.length > 0)
    {
        message=message[0];
    }
    else {
        message=null;
    }
    res.render('auth/reset',{
        pageTitle:'Reset',
        path:'/reset',
        message:message
    })  
}
exports.postReset=(req,res,next)=>{
    console.log("I am here")
crypt.randomBytes(32,(error,buffer)=>{
    if(error){
        return redirect('/reset');
    }
    const token=buffer.toString('hex');
    User.findOne({email:req.body.email})
    .then(user=>{
        if(!user)
        {
            req.flash('error','No user with that email found');
            return res.redirect('/reset');
        }
        user.resetToken=token;
        user.resetTokenExpiration=Date.now() + 3600000;
        return user.save()
        .then(result=>{
            const mailOptions = {
                from: 'app@test.com',
                to: req.body.email,
                subject: 'Reset Password',
                html: `
                <p>You request to reset password</p>
                <p>click on <a href="http://localhost:3000/reset/${token}"> link</a> to reset password</p>
                `
              };
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
              res.redirect('/');
        })
    })
    .catch(err=>{
        const error=new Error(err);
          error.httpStatusCode=500;
          next(error);
      });
})
}
exports.getNewPassword=(req,res,next)=>{
    const token=req.params.token;
    User.findOne({resetToken:token,resetTokenExpiration:{$gt:Date.now()}})
    .then(user=>{
        let message=req.flash('error');
        if(message.length > 0)
        {
            message=message[0];
        }
        else {
            message=null;
        }
        res.render('auth/new-password',{
            pageTitle:'new Password',
            path:'/new-password',
            message:message,
            userId:user._id.toString(),
            passwordToken:token
        })
    })
    .catch(err=>{
        const error=new Error(err);
          error.httpStatusCode=500;
          next(error);
      });
}
exports.postNewPassword=(req,res,next)=>{
    const token=req.body.passwordToken;
    const userId=req.body.userId;
    const password=req.body.password;
    console.log(token,userId,password);
    User.findOne({resetToken:token,resetTokenExpiration:{$gt:Date.now()},_id:userId})
    .then(user=>{
        bcrypt.hash(password,10)
        .then(hash=>{
            user.password=hash;
            user.resetToken=undefined;
            user.resetTokenExpiration=undefined;
            return user.save();
        })
        .then(result=>{
            res.redirect('/login')
        })
        .catch(err=>{
            const error=new Error(err);
              error.httpStatusCode=500;
              next(error);
          });
    })
    .catch(err=>{
        const error=new Error(err);
          error.httpStatusCode=500;
          next(error);
      });
}