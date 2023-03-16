var db = require('../config/connection')
var collection = require('../config/userCollection')
var bcrypt = require('bcrypt')
const { promiseImpl } = require('ejs')
const { ObjectId } = require('mongodb')
const { product } = require('../controller/userController')
const { response } = require('../app')
const { user } = require('../controller/authentication')


module.exports = {
    doSignup: (userData)=>{
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USERCOLLECTION).findOne({ email: userData.email })
            let regUser = {}
            if (user) {
                regUser.status = true;
                regUser.user = 'User Already Exists';
                resolve(regUser)
            }
            else {
                userData.isActive= true;
                userData.password = await bcrypt.hash(userData.password, 10)
               await db.get().collection(collection.USERCOLLECTION).insertOne(userData)

                regUser.user = 'Registered Succesfully';
                regUser.status = false;
                resolve(regUser);

            }



        })

},
doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {

        let response = {}
        let user = await db.get().collection(collection.USERCOLLECTION).findOne({ email: userData.email })
       
        if (user) {
            bcrypt.compare(userData.password, user.password).then((status) => {
                if (status) {
                    
                    if(user.isActive){
                        response.user = user;
                        response.status = true;
                        console.log(response);
                        resolve(response);

                    }else{
                        response.status =false;
                        response.blocked = 'Blocked User';
                        resolve(response);
                    }
                    

                }
                else {
                     response.errMsg = 'Please Enter a valid email ID/password';
                     response.status = false;
                    resolve(response);

                }
            })
        }
        else {
            response.errMsg = 'Please Enter valid email ID/password';
            response.status = false
            resolve(response)
        }
    })
},
verifyNum:(data)=>{
    return new Promise(async (resolve,reject)=>{
       
        let user = await db.get().collection(collection.USERCOLLECTION).findOne({mobile:data.mobile })
       
        let response={}
        if(user){
            if(user.isActive){
                response.user= user;
                response.userNum =true;
                resolve(response)

            }else{
                response.status='Blocked User';
                response.userNum = false;
                resolve(response)
            }
        }else{
            response.userNum= false;
            response.status='Please Enter a valid Number'
            resolve(response)

        }
    })
},
resetPassword:(userId,data)=>{
    return new Promise(async(resolve,reject)=>{

        let password = await bcrypt.hash(data.password, 10)
        await db.get().collection(collection.USERCOLLECTION).updateOne({_id:ObjectId(userId)},
        {
            $set:{
                password:password
            }
        }).then((response)=>{
    
             let status = 'Password Reset Successfully'
    
            resolve(status)
    
        })

    })
   
    

}

,
editProfile:(data,userId)=>{
    console.log(data);
    return new Promise(async(resolve,reject)=>{
        let user =await db.get().collection(collection.USERCOLLECTION).findOne({_id:ObjectId(userId)})
        console.log('user=',user);
        if(data['old-password']){
         let   newPassword = data['new-password'];
         let   oldPassword = data['old-password'];


            
                bcrypt.compare(oldPassword, user.password).then(async(status) => {
                        if (status) {
                                if(newPassword){
                                    data.password = await bcrypt.hash(newPassword, 10)
                                    

                                db.get().collection(collection.USERCOLLECTION).updateOne({_id:ObjectId(userId)},{
                                    $set:{
                                        name:data.name,
                                        email:data.email,
                                        mobile:data.mobile,
                                        password:data.password
                                    }
                                }).then((response)=>{
                                    response.status =true;
                                    resolve(response);

                                })

                                }else{
                                    let response ={}
                                    response.status =false;
                                    response.errorMsg ='Please enter new password'
                                    resolve(response)



                                }
                    
                        
                        
    
                    }else{
                        let response ={}

                            response.status =false;
                            response.errorMsg = 'Incorrect password';
                            resolve(response);
                        }

                    
                })



        }else{
            db.get().collection(collection.USERCOLLECTION).updateOne({_id:ObjectId(userId)},
            {
                $set:{
                    name:data.name,
                    email:data.email,
                    mobile:data.mobile,

                }
            }).then((response)=>{
                response.status =true
                resolve(response)
            })
        }
    })
},


getAllProducts:()=>{
    return new Promise(async(resolve,reject)=>{
        let products = await db.get().collection(collection.PRODUCTCOLLECTION).find().toArray()
        resolve(products)
    })
},
menProducts:()=>{
    return new Promise(async(resolve,reject)=>{
        let products = await db.get().collection(collection.PRODUCTCOLLECTION).find({category:'Men'}).toArray()
        resolve(products)
    })
},
womenProducts:()=>{
    return new Promise(async(resolve,reject)=>{
        let products = await db.get().collection(collection.PRODUCTCOLLECTION).find({category:'Women'}).toArray()
        resolve(products)
    })
},
getProduct:(id)=>{
    
    return new Promise(async(resolve,reject)=>{
        let product = await db.get().collection(collection.PRODUCTCOLLECTION).findOne({_id:ObjectId(id)})
        resolve(product)
    })
},


    addToCart: (prodId, userId) => {
        let prodObj = {
            item: ObjectId(prodId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CARTCOLLECTION).findOne({ user: ObjectId(userId) })
          
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == prodId)
                console.log('product=',proExist);
                if (proExist!=-1) {
                    db.get().collection(collection.CARTCOLLECTION).updateOne({user:ObjectId(userId), 'products.item': ObjectId(prodId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve({status:false})
                        })
                } else {
                    db.get().collection(collection.CARTCOLLECTION).updateOne({ user: ObjectId(userId) },
                        {
                            $push: { products: prodObj }

                        }).then((response) => {
                            resolve({status:true})
                        })
                }
            } else {
                await db.get().collection(collection.CARTCOLLECTION).insertOne({
                    user: ObjectId(userId),
                    products: [prodObj]
                }).then((response) => {
                    resolve({status:true})
                })
            }
        })
    },
cartData:(userId)=>{
    
    return new Promise(async(resolve,reject)=>{
      let cartDetails = await db.get().collection(collection.CARTCOLLECTION).aggregate([
        {
            $match:{user:ObjectId(userId)}
        },

        {
            $unwind:'$products'
        },
        {
            $project:{
                item:'$products.item',
                quantity:'$products.quantity'
            }
        },
        {
            $lookup:{
                from:collection.PRODUCTCOLLECTION,
                localField:'item',
                foreignField:'_id',
                as:'product'
            }
        },

        {
            $project:{
                item:1,
                quantity:1,
                product:{$arrayElemAt:['$product',0]},
               
            }
        },

       

        
        {
            $project:{
                item:1,
                quantity:1, 
                product:1,
                total:{
                    $sum:{$multiply:['$quantity','$product.price']}
                },
               
            }
        }


        // {
        //     $lookup:{
        //         from:collection.PRODUCTCOLLECTION,
        //         let:{proList:'$products'},
        //         pipeline:[
        //             {
        //                 $match:{
        //                     $expr:{
        //                         $in:['$_id','$$proList']
        //                     }
        //                 }
        //             }
        //         ],
        //         as:'cartItems'
        //     }
        // }
      ]).toArray()
      
      if(cartDetails==''){
        cartDetails.status= false;
      resolve(cartDetails);
        
      }else{
        
        cartDetails.status= true;

        resolve(cartDetails)
      }

    })
},

dltFromCart:(userId,prodId)=>{
    return new Promise(async(resolve,reject)=>{
        db.get().collection(collection.CARTCOLLECTION).updateOne({user: ObjectId(userId) },
        {
            $pull: { products:{item:ObjectId(prodId)} }

        }).then((response) => {
            resolve(response)
        })
    })
}
,
cartProdCount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let count = 0;
        let cart = await db.get().collection(collection.CARTCOLLECTION).findOne({user:ObjectId(userId)})
        if(cart){
            count = cart.products.length;
        }
        resolve(count)
    })
},

changeProdQty:({cartId,prodId,count,quantity})=>{

   let qtyCount  = parseInt(count)
   
    
    return new Promise(async(resolve,reject)=>{
        if( quantity ==1 && qtyCount ==-1){
              db.get().collection(collection.CARTCOLLECTION).updateOne({ _id: ObjectId(cartId) },
                        {
                            $pull: { products:{item:ObjectId(prodId)} }

                        }).then((response) => {
                            resolve({removeProduct:true})
                        })
        }else{
          await db.get().collection(collection.CARTCOLLECTION).updateOne({_id:ObjectId(cartId), 'products.item': ObjectId(prodId) },
        {
            $inc: { 'products.$.quantity': qtyCount }
        }).then((response) => {
            resolve(true)
        })
    }

    })
},

cartTotal:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cartPrice = await db.get().collection(collection.CARTCOLLECTION).aggregate([
          {
              $match:{user:ObjectId(userId)}
          },
  
          {
              $unwind:'$products'
          },
          {
              $project:{
                  item:'$products.item',
                  quantity:'$products.quantity'
              }
          },
          {
              $lookup:{
                  from:collection.PRODUCTCOLLECTION,
                  localField:'item',
                  foreignField:'_id',
                  as:'product'
              }
          },
  
          {
              $project:{
                  item:1,
                  quantity:1,
                  product:{$arrayElemAt:['$product',0]},
                 
              }
          },
          {
            $group:{
                _id:null,
                total:{$sum:{$multiply:['$quantity','$product.price']}}
            }

        },       
        ]).toArray()
        if(cartPrice ==''){
            resolve(0)
        }else{
        resolve(cartPrice[0].total);

        }
        
        
          
     
  
      })

},

cartProductList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cart = await db.get().collection(collection.CARTCOLLECTION).findOne({user:ObjectId(userId)})
            resolve(cart)
        
    })
},

placeOrder:(order,userId,total,products)=>{
    return new Promise(async(resolve,reject)=>{
        
        let status = order['payment-method']==='COD'?'placed':'pending';
        let orderObj = {
            orderID : Math.round(Math.random()*1E9),
            user : ObjectId(userId),
            deliveryDetails:{
                fname:order.fname,
                lname:order.lname,
                mobile:order.mobile,
                address:order.address,
                town:order.town,
                district:order.district,
                state:order.state,
                country:order.country,
                email:order.email,
                pincode:order.pincode,
                company:order.company,
                orderNotes:order['order-notes']
            },
            totalAmount:total,
            paymentMethod :order['payment-method'],
            products:products,
            status:status,
            date:new Date()
        }
        db.get().collection(collection.ORDERCOLLECTION).insertOne(orderObj).then((response)=>{
             db.get().collection(collection.CARTCOLLECTION).deleteOne({user:ObjectId(userId)})
            db.get().collection(collection.ORDERCOLLECTION).findOne({_id:ObjectId(response.insertedId)}).then((orderID)=>{
           
                resolve(orderID)
             })
        })
       
        
    })
},

orders:(userId)=>{
    return new Promise(async(resolve,reject)=>{
       let data = await db.get().collection(collection.ORDERCOLLECTION).find({user:ObjectId(userId)}).toArray()
      
     
       
        resolve(data)

       
      
    })
   
},

orderDetails:(orderID)=>{
    return new Promise(async(resolve,reject)=>{
       let orderData=await db.get().collection(collection.ORDERCOLLECTION).aggregate([
        {
            $match:{_id:ObjectId(orderID)}
        },

        {
            $unwind:'$products'
        },
        {
            $project:{
                totalAmount:'$totalAmount',
                paymentMethod:'$paymentMethod',
                item:'$products.item',
                quantity:'$products.quantity',
                deliveryDetails:'$deliveryDetails',
                status:'$status',
                date:'$date'

            }
        },
        {
            $lookup:{
                from:collection.PRODUCTCOLLECTION,
                localField:'item',
                foreignField:'_id',
                as:'product'
            }
        },

        {
            $project:{
                item:1,
                quantity:1,
                totalAmount:1,
                paymentMethod:1,
                deliveryDetails:1,
                status:1,
                date:1,
                product:{$arrayElemAt:['$product',0]},
               
            }
        },
        {
            $project:{
                
                quantity:1,
                totalAmount:1,
                paymentMethod:1,
                deliveryDetails:1,
                status:1,
                date:1,
                product:1,
                subtotal:{
                    $sum:{$multiply:['$quantity','$product.price']}
                }
               
            }
        }
    
        
       ]).toArray()
       console.log(orderData);
      
        resolve(orderData)
    })
},

cancelOrder:(orderID)=>{
    return new Promise(async (resolve,reject)=>{
      await  db.get().collection(collection.ORDERCOLLECTION).updateOne({_id:ObjectId(orderID)},{$set:{status:'Cancelled'}})
      resolve()
    })
},

addNewAddress:(order)=>{
    return new Promise(async(resolve,reject)=>{
        console.log(order);
        let address = {
            
            addressId: Math.round(Math.random()*1E9),
            status:"default",
            fname:order.fname,
            lname:order.lname,
            mobile:order.mobile,
            address:order.address,
            town:order.town,
            district:order.district,
            state:order.state,
            country:order.country,
            email:order.email,
            pincode:order.pincode,
            company:order.company,
            orderNotes:order['order-notes']
        }
       await   db.get().collection(collection.USERCOLLECTION).updateMany({ _id: ObjectId(order.userId),'address.status':'default'},
          {$set:
            {
                'address.$.status':'old'
            }})
        
      await  db.get().collection(collection.USERCOLLECTION).updateOne({ _id: ObjectId(order.userId) },
        {
            $push: { address:address }

        }).then((response) => {
          
            resolve()
        })

    })
},

userAddresses:(userId)=>{
    console.log('userid=',userId);
    return new Promise(async(resolve,reject)=>{
    let addresses =  await  db.get().collection(collection.USERCOLLECTION).aggregate([
        {$match:{
            _id:ObjectId(userId)
            }
       },
        {
            $project:{
                addresses:'$address'
            }
        },
        {
            $unwind:'$addresses'
        }
      ]).toArray()

      resolve(addresses)


    })
},

toDefaultAddress:(userId,addId)=>{
    let addressId = parseInt(addId)
    return new Promise(async(resolve,reject)=>{
        await   db.get().collection(collection.USERCOLLECTION).updateMany({ _id: ObjectId(userId),'address.status':'default'},
        {$set:
          {
              'address.$.status':'old'
          }})
      
    await  db.get().collection(collection.USERCOLLECTION).updateOne({ _id: ObjectId(userId),'address.addressId':addressId },
      {
          $set: { 'address.$.status':'default' }

      })

      resolve()

    })
},

defaultAddress:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let address =  await  db.get().collection(collection.USERCOLLECTION).aggregate([
            {
                $match:{
                  _id:ObjectId(userId)
                }
           },
            {
                $project:{
                    address:'$address'
                }
            },
            {
                $unwind:'$address'
            },
            {
                $match:{
                    'address.status':'default'
                  
                }
           }
          ]).toArray()
          if(address==""){
            let obj = {
                addressId:'',
                status:'',
                fname:'',
                lname:'',
                mobile:'',
                address:'',
                town:'',
                district:'',
                state:'',
                country:'',
                email:'',
                pincode:'',
                company:'',
                orderNotes:'',
            }
            resolve(obj)
          }else{
            resolve(address[0].address)
          }
         
          
    
    
        

    })
}





}