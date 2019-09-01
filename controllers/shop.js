const fs=require('fs');
const path=require('path');
const PDFdocument=require('pdfkit');
const stripe = require('stripe')('sk_test_lOjELsTvSXqNxlwEWPckp2YV');

const ITEMS_PER_PAGE=2;

const Product = require('../models/product');
const Order=require('../models/order');
exports.getProducts = (req, res, next) => {
  const page= + req.query.page || 1;
  let totalItems;
  Product.find()
  .count()
  .then(numProducts=>{
    totalItems=numProducts;
    return Product.find()
  .skip((page-1)*ITEMS_PER_PAGE)
  .limit(ITEMS_PER_PAGE)
  })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'products',
        path: '/products',
        currentPage:page,
        hasNextPage:ITEMS_PER_PAGE*page < totalItems,
        hasPreviousPage:page > 1,
        nextPage:page + 1,
        previousPage:page - 1,
        lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      console.log(product)
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
        isAuthenticated:req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  const page= + req.query.page || 1;
  let totalItems;
  Product.find()
  .count()
  .then(numProducts=>{
    totalItems=numProducts;
    return Product.find()
  .skip((page-1)*ITEMS_PER_PAGE)
  .limit(ITEMS_PER_PAGE)
  })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage:page,
        hasNextPage:ITEMS_PER_PAGE*page < totalItems,
        hasPreviousPage:page > 1,
        nextPage:page + 1,
        previousPage:page - 1,
        lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
 req.user.populate('cart.items.productId').execPopulate()
 .then(user=>{
   const products=user.cart.items;
   products.forEach(product => {
     console.log(product.quantity);
   });
   
   return res.render('shop/cart', {
    products: products,
    pageTitle: 'Cart',
    path: '/cart',
    isAuthenticated:req.session.isLoggedIn
  });
   
 })
 .catch(error=>console.log(error))
}

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {

// Token is created using Checkout or Elements!
// Get the payment token ID submitted by the form:
const token = req.body.stripeToken; // Using Express
let total=0;
  req.user.populate('cart.items.productId').execPopulate()
  .then(user=>{
    const products=user.cart.items.map(p=>{
      total +=p.quantity * p.productId.price;
      return {
        quantity:p.quantity,
        product:{ ...p.productId._doc }
      }
    });
    const order=new Order({

      user:{
        email:req.user.email,
        userId:req.user
      },
      products:products
    })
    return order.save()
  })
  .then(result=>{
    (async () => {
      const charge = await stripe.charges.create({
        amount: total*100,
        currency: 'usd',
        description: 'demo charge',
        source: token,
        metadata:{ order_id:result._id.toString() }
      });
    })();
    return req.user.clearCart();
  })
  .then(result=>{
    res.redirect('/orders');
  })
  .catch(error=>console.log(error));
};

exports.getCheckout=(req,res,next)=>{
  req.user.populate('cart.items.productId').execPopulate()
 .then(user=>{
   const products=user.cart.items;
   let total=0;
   console.log(products); 
   products.forEach(product => {
     total += product.quantity * product.productId.price;
   });
   
   res.render('shop/checkout', {
    products: products,
    pageTitle: 'Checkout',
    path: '/checkout',
    totalPrice:total
  });
   
 })
 .catch(error=>console.log(error))
}

exports.getOrders = (req, res, next) => {
  Order.find({'user.userId':req.user._id})
    .then(orders => {
      orders.forEach(order=>{
        console.log(order);
      })
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        isAuthenticated:req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};
exports.getInvoice=(req,res,next)=>{
  const orderId=req.params.orderId;
  Order.findById(orderId)
  .then(order=>{
    if(!order){
      return next(new Error('no order Found'));
    }
    if(order.user.userId.toString()!==req.user._id.toString()){
      return next(new Error('unauthorized'));
    }
    const fileName='invoice-'+ orderId + '.pdf';
    const invoice=path.join('data',fileName);

    const PDFdoc= new PDFdocument();
    res.setHeader('Content-Type','application/pdf');
      res.setHeader('Content-Disposition','inline')
    PDFdoc.pipe(fs.createWriteStream(invoice));
    PDFdoc.pipe(res);

    PDFdoc.fontSize(24).text('Invoice',{
      underline:true,
      align:'center'
    });
    PDFdoc.text('------------------------------------------------',{
      align:'center'
    })
    let price=0;
     order.products.forEach(prod=>{
       price+=prod.quantity*prod.product.price;
      PDFdoc.fontSize(14).text(prod.product.title + ' - ' + '$' + prod.product.price + 'x' + prod.quantity,{
        align:'center'
      });
     })
     PDFdoc.fontSize(24).text('------------------------------------------------',{
      align:'center'
    })
     PDFdoc.fontSize(20).text('Total Price : $' + price,{
      align:'center'
     });
    PDFdoc.end();
    // fs.readFile(invoice,(error,data)=>{
    //   if(error){
    //     return next(error);
    //   }
    //   res.setHeader('Content-Type','application/pdf');
    //   res.setHeader('Content-Disposition','inline')
    //   res.send(data);
    // })
    // const file=fs.createReadStream(invoice);
      // file.pipe(res);
  })
  .catch(error=>next(error))

}