const { ObjectId } = require('mongodb')
var db = require('../connection')
var {ADMINCOLLECTION,USERCOLLECTION,PRODUCTCOLLECTION,CARTCOLLECTION,ORDERCOLLECTION,PRODUCTCATEGORY,COUPONCOLLECTION}= require('../userCollection')
// var objectId = require('mongodb').ObjectId

module.exports = {
    adminLogin:(userDAta)=>{
        return new Promise(async (resolve,reject)=>{
            let admin =await db.get().collection(ADMINCOLLECTION).findOne({email:userDAta.email})
            let response = {}
            if(admin){
               if(admin.password == userDAta.password){
                    response.status = true;
                    response.admin = admin
                    resolve(response)
               }
               else{
                resolve({ status: false })
               }
            }
            else {
                resolve({ status: false })
            }
        })
        
    },

    dashboard:()=>{
        return new Promise(async(resolve,reject)=>{
            
         let order = await  db.get().collection(ORDERCOLLECTION).aggregate([
            {$match:{status:'Delivered'}},
           
            {
                $group:{
                    _id:null,
                    totalAmount:{
                        $sum:'$totalAmount'
                    },
                    count:{$sum:1}
                   
            }
        },
        
      

         ]).toArray()

            console.log('sum',order);
            resolve(order[0])
        })

    },

    getUsers:()=>{
        return new Promise(async (resolve,reject)=>{
            let users =await db.get().collection(USERCOLLECTION).find().toArray()
            resolve(users)

        })
    },
    userStatus:(userId)=>{
        return new Promise(async (resolve,reject)=>{
           let user = await  db.get().collection(USERCOLLECTION).findOne({_id:ObjectId(userId)})
           
           let isActive =user.isActive
           if(isActive){
                 db.get().collection(USERCOLLECTION).updateOne({_id:ObjectId(userId)},{$set:{isActive:false}})
                 resolve(user)
           }else{
                 db.get().collection(USERCOLLECTION).updateOne({_id:ObjectId(userId)},{$set:{isActive:true}})
                 resolve(user)
           }
        })
    },
    viewCateg: ()=>{
        return new Promise(async(resolve,reject)=>{
            let data = await db.get().collection(PRODUCTCATEGORY).find().toArray()
           
            resolve(data)
        })
    },
    addCategory:(category)=>{
        return new Promise(async (resolve,reject)=>{
            await db.get().collection(PRODUCTCATEGORY).insertOne(category);
            resolve(category);
        })
    },
    categoryEdit:(categId)=>{
        return new Promise(async (resolve,reject)=>{
            let categData = db.get().collection(PRODUCTCATEGORY).findOne({_id:ObjectId(categId)})
            resolve(categData);
        })
    },
    categoryDelete:(categId)=>{
        return new Promise(async (resolve,reject)=>{
            console.log(categId)
            await db.get().collection(PRODUCTCATEGORY).deleteOne({_id:ObjectId(categId)}).then((response)=>{
                console.log(response)
                resolve(response) 
            })
            
        })
    },
    editCategory:(categData)=>{
        console.log(categData);
        return new Promise((resolve,reject)=>{
            db.get().collection(PRODUCTCATEGORY).updateOne({_id:ObjectId(categData.id)},{$set:{
                name:categData.name,
                description:categData.description,
                
            }}).then((response)=>{
                resolve(response)
            })
        })
    },
    getProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products =await db.get().collection(PRODUCTCOLLECTION).find().toArray()
            resolve(products)
        })
    },
    addProduct:(productData)=>{
       
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(PRODUCTCOLLECTION).insertOne(productData).then((response)=>{
                
                resolve(response)
            })

        })
    },
    deleteProduct:(id)=>{
        console.log(id);
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(PRODUCTCOLLECTION).deleteOne({_id:ObjectId(id)}).then((response)=>{
                resolve(response)
            })
        })
    },
    productDetails:(id)=>{
        return new Promise(async(resolve,reject)=>{
            
            let product = await db.get().collection(PRODUCTCOLLECTION).findOne({_id:ObjectId(id)})
            resolve(product)
        })
    },
    updateProduct:(data,img)=>{
       
       return new Promise(async (resolve,reject)=>{
       let product =await db.get().collection(PRODUCTCOLLECTION).findOne({_id:ObjectId(data.id)});
        if(img.image0){
            product.productImages[0] = img.image0[0].filename;
        }
        if(img.image1){
            product.productImages[1] = img.image1[0].filename;
        }
        if(img.image2){
            product.productImages[2] = img.image2[0].filename;
        }
        if(img.image3){
            product.productImages[3] = img.image3[0].filename;
        }
        
       db.get().collection(PRODUCTCOLLECTION).updateOne({_id:ObjectId(data.id)},{$set:{
            title:data.title,
            // description:data.description,
            price:data.price,
            category:data.category,
            quantity:data.quantity,
            productImages:product.productImages
            
        }}).then((response)=>{
            resolve(response)
        })
       })
    },

    orderList:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(ORDERCOLLECTION).find().sort({'date':-1}).toArray().then((response)=>{
                
                resolve(response)
            })
        })
        
    },

    orderDetails:(orderID)=>{
        return new Promise(async(resolve,reject)=>{
            
           let orderData=await db.get().collection(ORDERCOLLECTION).aggregate([
            {
                $match:{_id:ObjectId(orderID)}
            },
    
            {
                $unwind:'$products'
            },
            {
                $project:{
                    orderID:'$orderID',
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
                    from:PRODUCTCOLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
    
            {
                $project:{
                    item:1,
                    orderID:1,
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
                    orderID:1,
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
            },
          
        
            
           ]).toArray()
           console.log(orderData);
        
            resolve(orderData)
        })
    },

    orderStatusChange:(orderID,status)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(ORDERCOLLECTION).updateOne({_id:ObjectId(orderID)},
            {
                $set:{
                    status:status
                }
            }).then((response)=>{
                if(status==='Delivered'){
                    db.get().collection(ORDERCOLLECTION).updateOne({_id:ObjectId(orderID)},
                            {
                                $set:{
                                    deliveredAt:new Date()
                                }
                            })
                }
                response.status  = true
                response.newStatus = status
                
                resolve(response)
            })

        })
    },

    monthlyEarning:()=>{
        return new Promise(async(resolve,reject)=>{
            let currentMonth = new Date().getMonth()+1;
            console.log('current month',currentMonth);
           let monthRevenue = await db.get().collection(ORDERCOLLECTION).aggregate([
                {
                    $match:{
                        status:'Delivered'
                    }
                },
                {
                    $project:{
                        month:{$month:'$date'},
                        totalAmount:1
                    
                    }

                },
                {
                    $match:{
                        month:currentMonth
                    }
                },
                {
                    $group:{
                        _id:null,
                        totalAmount:{$sum:'$totalAmount'}
                    }
                }
               
                
            ]).toArray()
            console.log(monthRevenue);
            if(monthRevenue.length<=0) 
                resolve(0)
            else
                resolve(monthRevenue[0].totalAmount)

           
        })
    },

    monthlyOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            
            
           let orders = await db.get().collection(ORDERCOLLECTION).aggregate([
                {
                    $match:{
                        status:'Delivered'
                    }
                },
                {
                    $project:{
                        month:{$month:'$date'},
                       
                    
                    }

                },
               
                {
                    $group:{
                        _id:'$month',                      
                        count:{$sum:1}
                    }
                },
               
               
                
            ]).toArray()
            console.log('orderss====',orders)
            resolve(orders)

           
        })
    },

    orderPaymentDetails:()=>{
        return new Promise(async(resolve,reject)=>{
        let orderData =await    db.get().collection(ORDERCOLLECTION).aggregate([
                {
                    $group:{
                        _id:'$paymentMethod',
                        count:{$sum:1}
                    }
                }
            ]).toArray()
            resolve(orderData)
        })
    },

    orderStatusDetails:()=>{
        return new Promise(async(resolve,reject)=>{
            let orderStatus = await db.get().collection(ORDERCOLLECTION).aggregate([
                {
                    $group:{
                        _id:'$status',
                        count:{$sum:1}
                    }
                }
            ]).toArray()
            console.log('orderstatus==',orderStatus);
            resolve(orderStatus)
        })
    },


    reportList:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(ORDERCOLLECTION).find({status:'Delivered'}).sort({'date':-1}).toArray().then((response)=>{
                
                resolve(response)
            })
        })
        
    },

    addCoupon:(data)=>{
        return new Promise((resolve,reject)=>{
            data.maxDiscount = parseInt(data.maxDiscount)
            data.percentage = parseInt(data.percentage)
            data.minCartPrice =parseInt(data.minCartPrice)
            db.get().collection(COUPONCOLLECTION).insertOne(data).then(()=>{
                resolve()
            })
        })
    },
   
    couponList:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(COUPONCOLLECTION).find().toArray().then((response)=>{
                  resolve(response)
                
            })
        })
    },

    dltCoupon:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(COUPONCOLLECTION).deleteOne({_id:ObjectId(id)}).then((response)=>{
                resolve()
            })
        })
    },

    getCouponDetails:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(COUPONCOLLECTION).findOne({_id:ObjectId(id)}).then((response)=>{
                console.log(response,'response');
                resolve(response)
            })
        })
    },

    editCoupon:(data)=>{
        return new Promise((resolve,reject)=>{
            
            db.get().collection(COUPONCOLLECTION).updateOne({_id:ObjectId(data.id)},{
                $set:{
                    code:data.code,
                    maxDiscount:parseInt(data.maxDiscount),
                    percentage:parseInt(data.percentage),
                    category:data.category,
                    minCartPrice:parseInt(data.minCartPrice),
                    expiry:data.expiry

                }
            }).then(()=>{
                resolve()
            })
        })
    }
    
}