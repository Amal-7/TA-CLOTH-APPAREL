const layout = 'admin-layout';
const { mountpath } = require('../app');
const adminHelper = require('../Model/helpers/admin-helpers');
let echarts = require('echarts')



module.exports = {

   
    adminLogin: async (req, res, next) => {

        try{
        let status = req.session.adminLoggedIn;
        if (status) {
            let dashboard = await adminHelper.dashboard()
            let products = await adminHelper.getProducts()
            let categories = await adminHelper.viewCateg()
            let earnings = await adminHelper.monthlyEarning()
            let monthWise = await adminHelper.monthlyOrders()
            let orderData = await adminHelper.orderPaymentDetails()
            let orderState = await adminHelper.orderStatusDetails()


            let orderStatus = {}

            orderState.forEach(data => {

                orderStatus[data._id] = data.count

            })
            

            let payMethod = {}
            orderData.forEach(data => {
              payMethod[data._id] = data.count
            })
         
            let month = []

            for(let i=0;i<12;i++){
                month[i] = 0
            }

            monthWise.forEach(element => {
                month[element._id-1] =element.count
            });


            let totalProducts = products.length
            let categCount = categories.length
            console.log('payMethod', payMethod);

            res.render('admin/index', { layout, status, dashboard, totalProducts, categCount, earnings, monthWise, month, payMethod, orderStatus });

        } else {
            let logErr = req.session.logErr;
            res.render('admin/login', { layout, logErr });
            req.session.logErr = false;
        }
    }catch(error){
        
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});
        
    }
    },
    
        adminCheck: (req, res, next) => {
            try {
            adminHelper.adminLogin(req.body).then((data) => {
                let status = data.status;
                let adminData = data.user;
                if (status) {
                    req.session.adminLoggedIn = true;
                    req.session.admin = adminData;
                    res.redirect('/admin');
                }
                else {
                    let logErr = 'Please enter a valid email id/password'
                    req.session.logErr = logErr
                    res.redirect('/admin')
                }
            })
        }catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});
    
            
        }
        
    } ,
    adminLogout: (req, res, next) => {
        try{
        req.session.adminLoggedIn = false
        req.session.admin = null
        res.redirect('/admin')
        }catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});
    
            
        }
    },
    viewUser: (req, res, next) => {
        try{
        let status = req.session.adminLoggedIn;
        if (status) {
            adminHelper.getUsers().then((users) => {

                res.render('admin/view-user', { layout, status, users });
            })

        } else {
            res.redirect('/admin')
        }
    }catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});

        
    }

    },
    userStatus: (req, res, next) => {
        try{
        let userId = req.params.id
        adminHelper.userStatus(userId).then((user) => {
            res.redirect('/admin/view-users')
        })
    }catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});

        
    }
    },
    viewCategory: (req, res, next) => {
        try{
        let status = req.session.adminLoggedIn;
        if (status) {
            adminHelper.viewCateg().then((categories) => {
                res.render('admin/product-category', { layout, status, categories })
            })
        }
        else {
            res.redirect('/admin')
        }
    }catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});

        
    }

    },
    createCategory: (req, res, next) => {
        try{
        adminHelper.addCategory(req.body).then((category) => {
            res.redirect('/admin/category')
        })
    }catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});

        
    }
    },
    editCategory: (req, res, next) => {
        try{
        let status = req.session.adminLoggedIn;
        if (status) {
            let categId = req.params.id;
            adminHelper.categoryEdit(categId).then((category) => {
                res.render('admin/edit-category', { layout, status, category })
            })
        } else {
            res.redirect('/admin')
        }
    }catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});

        
    }
    },
    deleteCategory: (req, res, next) => {
        try{
        let categId = req.body.id;
        console.log(categId)
        adminHelper.categoryDelete(categId).then((response) => {
            res.json({ status: true })
        })
    }catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});

        
    }
    },
    categoryEdit: (req, res, next) => {
        try{
        let data = req.body;
        adminHelper.editCategory(data).then((response) => {
            res.json({ status: true })
        })
    }catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
    }
    },
    viewProducts: (req, res, next) => {
        try{
        let status = req.session.adminLoggedIn;
        if (status) {
            adminHelper.getProducts().then((products) => {
                res.render('admin/products', { layout, status, products })

            })

        }
        else {
            res.redirect('/admin')
        }
    }catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
    }
    },
    newProduct: (req, res, next) => {
        try{
        let status = req.session.adminLoggedIn;
        if (status) {
            adminHelper.viewCateg().then((categories) => {
                res.render('admin/add-product', { layout, status, categories })
            })
        }
        else {
            res.redirect('/admin')
        }
    }catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
    }
    },
    addProduct: (req, res, next) => {
        try{
        let status = req.session.adminLoggedIn;
        if (status) {
            const files = req.files
            console.log(files);
            const fileName = files.map((file) => {
                return file.filename
            })
            let productData = req.body
            productData.price = parseInt(productData.price);
            productData.quantity = parseInt(productData.quantity);
            console.log(req.body);
            productData.productImages = fileName

            adminHelper.addProduct(productData).then((result) => {
                res.redirect('/admin/products');

            });
        }
        else {
            res.redirect('/admin')
        }
    }catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
    }
    },
    deleteProduct: (req, res, next) => {
        try{
        console.log(req.body)
        let status = req.session.adminLoggedIn;
        if (status) {
            adminHelper.deleteProduct(req.body.id).then((response) => {
                res.json({ status: true });
            })

        } else {
            res.redirect('/admin')
        }
    }catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
    }
    },
    getProduct: (req, res, next) => {
        try{
        let status = req.session.adminLoggedIn;
        if (status) {
            adminHelper.productDetails(req.params.id).then((product) => {
                adminHelper.viewCateg().then((categories) => {
                    res.render('admin/edit-product', { layout, status, product, categories });
                })

            })

        } else {
            res.redirect('/admin')
        }
    }catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
    }
    },
    editProduct: (req, res, next) => {

        try {
            let data = req.body
        data.price = parseInt(data.price)
        data.quantity = parseInt(data.quantity)
        let img = req.files

        adminHelper.updateProduct(data, img).then((response) => {
            res.redirect('/admin/products')
        })
            
        } catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
        }

    },
    getOrders: (req, res) => {
        try{
        let status = req.session.adminLoggedIn
        adminHelper.orderList().then((orderList) => {
            console.log(orderList);
            res.render('admin/orders', { layout, status, orderList })
        })
    } catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
        }
    },

    orderDetails: (req, res) => {
        try{
            let status = req.session.adminLoggedIn
            adminHelper.orderDetails(req.params.id).then((order) => {
                res.render('admin/order-details', { layout, order, status })
            })
    } catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
        }
    },

    changeStatus: (req, res) => {
        try{
      
            adminHelper.orderStatusChange(req.body.id, req.body.status).then((response) => {
                res.json(response)
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
            }
    },


    reports: async (req, res) => {
        try{
            let status = req.session.adminLoggedIn
            let revenue = await adminHelper.dashboard()
            console.log('revenue', revenue);
            adminHelper.reportList().then((orders) => {
                orders.revenue = revenue.totalAmount
                res.render('admin/report', { layout, orders, status })
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
            }
    },

    addCoupon: async (req, res) => {
        try{
        let status = req.session.adminLoggedIn
        let categories = await adminHelper.viewCateg()
        res.render('admin/add-coupon', { layout, status, categories })
    } catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
        }
    },

    addNewCoupon: (req, res) => {
        try{
        let status = req.session.adminLoggedIn
        adminHelper.addCoupon(req.body).then((response) => {
            res.redirect('/admin/addCoupon')
        })
    } catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
        }
    },

    getCoupons: (req, res) => {
        try{
        let status = req.session.adminLoggedIn
        adminHelper.couponList().then((coupons) => {
            res.render('admin/couponList', { status, layout, coupons })
        })
    } catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
        }
    },

    deleteCoupon: (req, res) => {
        try{
        adminHelper.dltCoupon(req.body.id).then((response) => {
            res.json({ status: true })
        })
    } catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
        }
    },

    editCoupon: async (req, res) => {
        try{
        let status = req.session.adminLoggedIn
        let categories = await adminHelper.viewCateg()
        adminHelper.getCouponDetails(req.params.id).then((coupon) => {
            res.render('admin/edit-coupon', { layout, status, coupon, categories })
        })
    } catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
        }
    }
    ,
    editCouponDetails: (req, res) => {
        try{
       
        adminHelper.editCoupon(req.body).then(() => {
            res.send({ status: true })
        })
    } catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' ,admin:true});  
        }
    }


}