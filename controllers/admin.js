const Product = require('../models/product');
const mongoose=require('mongoose');

const FileHelper=require('../util/file');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    isAuthenticated:req.session.isLoggedIn
  });
};

exports.postAddProduct = (req, res, next) => {
  console.log(req.user);
  const title = req.body.title;
  const price = req.body.price;
  const image = req.file;
  const description = req.body.description;
  const imageUrl=image.path;
  const product = new Product({
    title:title,
    price:price,
    description:description,
    imageUrl:imageUrl,
    userId:req.user
  });
  product
    .save()
    .then(result => {
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error=new Error(err);
      error.httpStatusCode=500;
      next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    // Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        isAuthenticated:req.session.isLoggedIn
      });
    })
    .catch(err=>{
      const error=new Error(err);
        error.httpStatusCode=500;
        next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImage = req.file;
  const updatedDesc = req.body.description;
  Product.findById(prodId)
  .then(product=>{
    product.title=updatedTitle;
    product.price=updatedPrice;
    if(updatedImage){
      FileHelper.deleteFile(product.imageUrl);
      product.imageUrl=updatedImage.path;
    }
    product.description=updatedDesc;
    return product.save();
  })
  .then(result=>{

      res.redirect('/admin/products');
  })
  .catch(err=>{
    const error=new Error(err);
      error.httpStatusCode=500;
      next(error);
  });
};

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        isAuthenticated:req.session.isLoggedIn
      });
    })
    .catch(err=>{
      const error=new Error(err);
        error.httpStatusCode=500;
        next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((prod) => {
      if(!prod){
        throw new Error('product not found')
      }
      FileHelper.deleteFile(prod.imageUrl);
      return Product.deleteOne({_id:prodId});
    })
    .then(result=>{
      res.status(200).json({massage:'success!'})
    })
    .catch(err=>{
      res.status(200).json({massage:'Deleting Product failed'})
    });
};
