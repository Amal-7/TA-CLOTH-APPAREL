var express = require('express');
var router = express.Router();
const {adminLogin,adminCheck,adminLogout,viewUser,userStatus,viewCategory,createCategory,editCategory,deleteCategory,
  categoryEdit,viewProducts,newProduct,addProduct,deleteProduct,
  getProduct,editProduct,getOrders,orderDetails,changeStatus,reports,addCoupon,addNewCoupon,
  getCoupons,deleteCoupon,editCoupon,editCouponDetails} = require('../controller/adminController');
const multer = require('multer');
const {admin}= require('../controller/authentication');

const storage = multer.diskStorage({
  destination:(req,file,cb)=>{
    
    cb(null,'./public/product-images')
  },
  filename:(req,file,cb)=>{
    console.log(file);
    cb(null,Date.now()+ '-'+Math.round(Math.random()*1E9)+'.jpg')
  }

})

//multer set up
const upload = multer({storage:storage})

/* admin login */
router.route('/')
  .get( adminLogin)
  .post(adminCheck);

/* admin logout*/ 
router.get('/logout',adminLogout);

/*view users*/ 
router.get('/view-users',viewUser);
router.get('/user-status/:id',userStatus);

/* category details*/ 
router.route('/category')
  .get(viewCategory)
  .post(createCategory)
  .put(categoryEdit)
  .delete(deleteCategory)

/*Category edit*/ 
router.get('/edit-category/:id',editCategory)
 
/* products*/ 
router.get('/products',viewProducts);

/* add product*/ 
router.route('/product')
  .get(newProduct)
  .post(upload.array('images',4),addProduct)
  .delete(deleteProduct)

/* edit product*/ 
router.route('/edit-product/:id')
    .get(getProduct)
    .post(upload.fields([
      {name:'image0',maxCount:1},
      {name:'image1',maxCount:1},
      {name:'image2',maxCount:1},
      {name:'image3',maxCount:1},

    ]),admin,editProduct);

 /* orders*/ 
router.get('/orders',admin,getOrders);

/*single order details*/ 
router.get('/order-details/:id',admin,orderDetails);

/* order status change*/ 
router.post('/change-status',admin,changeStatus);

// Admin Reports
router.get('/reports',admin,reports)

/* Coupon Management */

router.route('/coupons')
    .get(admin,getCoupons)
    .delete(deleteCoupon)
    .put(editCouponDetails)


router.route('/addCoupon')
    .get(admin,addCoupon)
    .post(addNewCoupon)

/* Coupon Edit */

router.get('/coupons/:id',admin,editCoupon)








module.exports = router;
