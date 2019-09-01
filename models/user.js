const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const userSchema=new Schema({
    name:{
        type:String,
        required:true
    },
    email:
        {
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    resetToken:String,
    resetTokenExpiration:Date,
    cart:{
        items:[
            {productId:{type:mongoose.Types.ObjectId,ref:'Product',required:true},
            quantity:{type:Number,required:true}}
        ]
    }
   
})
userSchema.methods.addToCart=function(product){
    let quantity=1;
    let updatedProduct={}
    let existingProduct=this.cart.items.find(item=>{
        console.log(product._id,item.productId)
     return product._id.toString()===item.productId.toString()
    });
    if(!existingProduct){
     updatedProduct.productId=product;
     updatedProduct.quantity=quantity;
     this.cart.items.push(updatedProduct);
     return this.save()
    }
    else {
        const existingIndex=this.cart.items.findIndex(item=>{
            return product._id.toString()===item.productId.toString()
           });
        existingProduct.quantity +=quantity;
        updatedProduct=existingProduct;
        this.cart.items[existingIndex]=updatedProduct;
        return this.save();
    }
}
userSchema.methods.removeFromCart=function(productId){
    const updatedProducts=this.cart.items.filter(item=>{
        return productId.toString()!==item.productId.toString();
    })
    this.cart.items=updatedProducts;
    return this.save();
}
userSchema.methods.clearCart=function(){
    this.cart.items=[];
    return this.save();
}
module.exports=mongoose.model('User',userSchema);