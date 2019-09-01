const express=require('express');
const router=express.Router();
const { check,body } = require('express-validator');
const authController=require('../controllers/auth')
const User=require('../models/user');

router.get('/login',authController.getLogin)

router.post('/login',authController.postLogin)

router.get('/signup',authController.getSignup)

router.post('/signup',[
body('name').isString()
.withMessage('Please inter a valid name.')
.isLength({min:3})
.normalizeEmail()
.withMessage('name must be atleast 3 characters.')
,
check('email').isEmail()
.withMessage('Please inter a valid email.')
.normalizeEmail()
.custom((val,{req})=>{
   return  User.findOne({email:val})
    .then(users=>{
      if(users){
          return Promise.reject('E-mail alreay exist');
      }
    })

}),
body('password','please enter alphanimuric pass wit at least 5 characters')
.trim()
.isLength({ min: 5 })
.isAlphanumeric(),
body('confirmPassword').trim().custom((val,{req})=>{
    if(val!==req.body.password){
        throw new Error("Passwords have to matchs");
    }
    return true;
})
],authController.postSignup)

router.post('/logout',authController.postLogout)

router.get('/reset',authController.getReset)

router.post('/reset',authController.postReset)

router.get('/reset/:token',authController.getNewPassword)

router.post('/new-password',authController.postNewPassword)

module.exports=router;