var userHelper = require('../Model/helpers/user-helpers');
require('dotenv').config();
const client = require('twilio')(process.env.ACCOUNT_ID, process.env.AUTH_TOKEN);
const Razorpay = require('razorpay')
const crypto = require('crypto')
const paypal = require('paypal-rest-sdk');


paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.PAYPAL_KEY_ID,
    'client_secret': process.env.PAYPAL_SECRET_ID
});



module.exports = {
    home: async (req, res, next) => {
        try {
            let user = req.session.user
            let menProducts = await userHelper.menProducts()
            let womenProducts = await userHelper.womenProducts()
            if (user) {
                let cartCount = await userHelper.cartProdCount(user._id);
                res.render('index', { user, menProducts, womenProducts, cartCount })

            }
            else {
                res.render('index', { menProducts, womenProducts })
            }
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }


    },
    loginPage: (req, res, next) => {
        try {
            if (req.session.userLoggedIn) {
                res.redirect('/');
            } else {
                res.render('user/login')
            }
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }

    },
    userSignup: (req, res, next) => {
        try {
            if (req.session.userLoggedIn) {
                res.redirect('/');
            } else {
                userHelper.doSignup(req.body).then((userdata) => {
                    let status = userdata.status

                    if (status) {
                        let regUser = userdata.user
                        res.render('user/login', { regUser, forSignin: true })
                    }
                    else {
                        let user = userdata.user;
                        res.render('user/login', { user, forSignin: true })

                    }

                })
            }
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },
    userLogin: (req, res, next) => {
        try {
            if (req.session.userLoggedIn) {
                res.redirect('/');
            } else {
                userHelper.doLogin(req.body).then((data) => {
                    let status = data.status;
                    if (status) {
                        req.session.userLoggedIn = true;
                        req.session.user = data.user

                        res.redirect('/')
                    }
                    else {
                        let blocked = data.blocked;
                        let errMsg = data.errMsg;
                        res.render('user/login', { errMsg, blocked })
                    }
                })
            }
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },
    userLogout: (req, res, next) => {
        try {
            req.session.userLoggedIn = false;
            req.session.user = null
            res.redirect('/')
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },

    userProfile: async (req, res) => {
        try {
            let user = req.session.user
            let address = await userHelper.defaultAddress(user._id)
            let cartCount = await userHelper.cartProdCount(user._id);
            res.render('user/myprofile', { user, address, cartCount })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },


    editProfile: (req, res) => {
        try {
            let user = req.session.user
            userHelper.editProfile(req.body, user._id).then(async (response) => {
                if (response.status) {
                    req.session.user = await userHelper.getUser(user._id)
                    res.redirect('/my-profile')
                } else {
                    let errorMsg = response.errorMsg
                    res.render('user/myprofile', { errorMsg, user })

                }

            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    }


    ,
    logOtp: (req, res, next) => {
        try {
            let status = req.session.userLoggedIn;
            if (status) {
                res.redirect('/')
            }
            else {
                let status = req.session.status
                res.render('user/otp-login', { status });

            }
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },
    numVerify: (req, res, next) => {
        try {
            if (req.session.userLoggedIn) {
                res.redirect('/');
            } else {
                userHelper.verifyNum(req.body).then((data) => {
                    if (data.userNum) {
                        req.session.mobile = req.body.mobile;
                        req.session.user = data.user
                        client.verify.services(process.env.serviceId)
                            .verifications.create({
                                to: `+91${req.body.mobile}`,
                                channel: 'sms',
                            }).then((data) => {
                                res.render('user/otp-verify')
                            })
                    } else {
                        req.session.status = data.status
                        res.redirect('/otp-login');
                    }
                })
            }
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }

    },
    otpVerify: (req, res, next) => {
        try {
            if (req.session.userLoggedIn) {
                res.redirect('/');
            } else {

                client.verify.services(process.env.serviceId)
                    .verificationChecks.create({
                        to: `+91${req.session.mobile}`,
                        code: req.body.otp
                    }).then((data) => {
                        if (data.valid) {
                            req.session.userLoggedIn = true;
                            res.redirect('/');
                        }
                        else {
                            let errMsg = 'Invalid OTP'
                            res.render('user/otp-verify', { errMsg })
                        }
                    })

            }
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }

    },
    forgotPassword: (req, res) => {
        try {
            let status = req.session.userLoggedIn;
            if (status) {
                res.redirect('/')
            }
            else {
                let status = req.session.status

                res.render('user/forgot-password', { status })

            }
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }

    },

    numVerifyReset: (req, res, next) => {
        try {
            if (req.session.userLoggedIn) {
                res.redirect('/');
            } else {
                userHelper.verifyNum(req.body).then((data) => {
                    if (data.userNum) {

                        req.session.mobile = req.body.mobile;
                        req.session.user = data.user
                        client.verify.services(process.env.serviceId)
                            .verifications.create({
                                to: `+91${req.body.mobile}`,
                                channel: 'sms',
                            }).then((data) => {
                                res.render('user/forgot-otp-verify')
                            })
                    } else {
                        req.session.status = data.status
                        res.redirect('/forgot-password');
                    }
                })
            }
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }

    }
    ,

    resetOtpVerify: (req, res, next) => {
        try {
            if (req.session.userLoggedIn) {
                res.redirect('/');
            } else {

                client.verify.services(process.env.serviceId)
                    .verificationChecks.create({
                        to: `+91${req.session.mobile}`,
                        code: req.body.otp
                    }).then((data) => {

                        if (data.valid) {

                            res.render('user/reset-password');
                        }
                        else {
                            let errMsg = 'Invalid OTP'
                            res.render('user/forgot-otp-verify', { errMsg })
                        }
                    })

            }
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }

    },

    resetPassword: (req, res) => {
        try {
            userHelper.resetPassword(req.session.user._id, req.body).then((status) => {
                let errorMsg = status
                res.render('user/login', { errorMsg })
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },


    products: async (req, res) => {
        try {

            let productsTotal = await userHelper.getAllProducts()
            let pageCount = req.query.page || 1
            let pageNum = parseInt(pageCount)
            let totalProducts = productsTotal.length
            let lmt = 10
            let pages = [];
            for (let i = 1; i <= Math.ceil(totalProducts / lmt); i++) {
                pages.push(i)
            }

            let products = await userHelper.totalProductsView(pageNum, lmt)
            if (req.session.userLoggedIn) {
                let user = await userHelper.getUser(req.session.user._id)
                if (user.isActive) {
                    let cartCount = await userHelper.cartProdCount(user._id)
                    res.render('user/allProducts', { user, products, pages, cartCount })

                } else
                    res.render('user/allProducts', { products, pages })
            } else {
                res.render('user/allProducts', { products, pages })
            }
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },
    product: async (req, res) => {
        try {
            let cartCount;
            let user = req.session.user
            if (user) {
                cartCount = await userHelper.cartProdCount(user._id)

            }

            userHelper.getProduct(req.params.id).then((product) => {
                res.render('user/product', { user, product, cartCount })
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },
    addToCart: (req, res) => {
        try {

            userHelper.addToCart(req.params.id, req.session.user._id).then((product) => {
                res.json(product)
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },
    addToCartFromPage: (req, res) => {
        try {
            userHelper.addProductToCart(req.body, req.session.user._id).then((status) => {
                res.json(status)
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }

    },

    cart: async (req, res) => {
        try {
            let user = req.session.user
            let cartCount = await userHelper.cartProdCount(user._id)
            let cartPrice = await userHelper.cartTotal(user._id)


            userHelper.cartData(user._id).then((cartItems) => {
                cartItems.cartPrice = cartPrice


                res.render('user/cart', { user, cartItems, cartCount })
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },

    changeProdQty: (req, res) => {
        try {
            userHelper.changeProdQty(req.body).then((response) => {


                res.json(response)
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    }

    ,
    cartItemDlt: (req, res) => {
        try {
            let user = req.session.user
            userHelper.dltFromCart(user._id, req.params.id).then((response) => {
                res.json(response)
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },
    checkOut: async (req, res) => {
        try {
            let user = req.session.user
            let cartCount = await userHelper.cartProdCount(user._id)
            let cartPrice = await userHelper.cartTotal(user._id)

            let address = await userHelper.defaultAddress(user._id)
            if (cartPrice == 0) {
                res.redirect('/cart')
            } else {
                userHelper.cartData(user._id).then((cartItems) => {
                    cartItems.cartPrice = cartPrice
                    res.render('user/checkout', { user, cartItems, cartCount, address })
                })
            }
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },
    placeOrder: async (req, res) => {
        try {
            let user = req.session.user
            let paymentMethod = req.body['payment-method']
            let cartPrice = await userHelper.cartTotal(user._id)
            let products = await userHelper.cartProductList(user._id)
            let discount = parseInt(req.body.discount) || 0
            if (req.body.discount) { cartPrice = cartPrice - discount }

            userHelper.placeOrder(req.body, user._id, cartPrice, products.products, user, discount).then(async (response) => {
                let orderID = response.orderID
                req.session.orderID = orderID
                req.session.total = response.totalAmount
                let total = response.totalAmount
                let cartCount = 0
                if (paymentMethod == 'COD') {
                    res.render('user/order-confirmation', { user, cartPrice, orderID, cartCount })

                } else if (paymentMethod == 'paypal') {

                    const create_payment_json = {
                        "intent": "sale",
                        "payer": {
                            "payment_method": "paypal"
                        },
                        "redirect_urls": {
                            "return_url": "http://taclothapparels.shop/success",
                            "cancel_url": "http://taclothapparels.shop/cancel"
                        },
                        "transactions": [{
                            "item_list": {
                                "items": [{
                                    "name": "Redhock Bar Soap",
                                    "sku": "001",
                                    "price": total,
                                    "currency": "USD",
                                    "quantity": 1
                                }]
                            },
                            "amount": {
                                "currency": "USD",
                                "total": total,
                            },
                            "description": "Molla Fashion Store"
                        }]
                    }


                    paypal.payment.create(create_payment_json, function (error, payment) {
                        if (error) {
                            throw error;
                        } else {
                            for (let i = 0; i < payment.links.length; i++) {
                                if (payment.links[i].rel === 'approval_url') {
                                    res.redirect(payment.links[i].href);
                                }
                            }
                        }
                    });



                } else if (paymentMethod == 'razorpay') {
                    const instance = new Razorpay({
                        key_id: process.env.RAZOR_KEY_ID,
                        key_secret: process.env.RAZOR_SECRET_ID
                    })

                    let options = {
                        amount: cartPrice,
                        currency: "INR",
                        receipt: orderID,
                    }

                    instance.orders.create(options, (error, order) => {
                        if (error) {
                            res.redirect('/checkout')
                        }
                        res.render('user/razorpay', { order })

                    })


                } else {
                    res.redirect('/checkout')

                }
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }

    }






    ,
    // razorpay payment verify
    verifyRazorpay: async (req, res) => {
        try {
            let orderid = req.body['order[orderid]']
            req.session.orderID = orderid
            let signature = req.body['payment[razorpay_signature]']
            signature.trim()
            let hmac = crypto.createHmac('sha256', process.env.RAZOR_SECRET_ID)
            hmac.update(req.body['payment[razorpay_order_id]'] + "|" + req.body['payment[razorpay_payment_id]'], process.env.RAZOR_SECRET_ID)
            hmac = hmac.digest('hex')
            hmac.trim()

            if (signature == hmac) {

                userHelper.verifyPaymentRazorpay(orderid).then((response) => {

                    res.json({ status: true })
                })
            } else {

                res.json({ status: false })

            }
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },


    // paypal order success
    paypalSucces: (req, res) => {
        try {
            const payerId = req.query.PayerID;
            const paymentId = req.query.paymentId;
            let orderID = req.session.orderID
            user = req.session.user

            const execute_payment_json = {

                "payer_id": payerId,
                "transactions": [{
                    "amount": {
                        "currency": "USD",
                        "total": req.session.total
                    }
                }]
            };

            // Obtains the transaction details from paypal
            paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
                //When error occurs when due to non-existent transaction, throw an error else log the transaction details in the console then send a Success string reposponse to the user.
                if (error) {
                    throw error;
                } else {

                    userHelper.paymentStatusChange(orderID, user._id).then((response) => {
                        res.render('user/order-confirmation', { user, orderID, cartCount: 0 })
                        req.session.orderID = null

                    })


                }
            });
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }

    }
    ,

    razorpaySuccess: (req, res) => {
        try {
            let user = req.session.user
            let orderID = req.session.orderID
            userHelper.paymentStatusChange(orderID, user._id).then((response) => {
                res.render('user/order-confirmation', { user, orderID, cartCount: 0 })
                req.session.orderID = null

            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },
    myOrders: async (req, res) => {
        try {

            let user = req.session.user
            let cartCount = await userHelper.cartProdCount(user._id)
            userHelper.orders(user._id).then(async (orderData) => {


                let pageCount = req.query.page || 1
                let pageNum = parseInt(pageCount)
                let totalOrders = orderData.length

                let lmt = 10
                let pages = [];
                for (let i = 1; i <= Math.ceil(totalOrders / lmt); i++) {
                    pages.push(i)
                }


                let orderList = await userHelper.totalOrderView(pageNum, lmt, user._id)

                res.render('user/myorders', { user, orderList, cartCount, pages })
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },
    orderDetails: async (req, res) => {
        try {
            let user = req.session.user
            let cartCount = await userHelper.cartProdCount(user._id)
            userHelper.orderDetails(req.params.id).then((orderData) => {
                let days;
                if (orderData[0].status === 'Delivered') {
                    const newDate = new Date();
                    const deliveryDate = orderData[0].deliveredAt
                    const diffTime = Math.abs(newDate - deliveryDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    days = diffDays
                }
                res.render('user/order-details', { user, orderData, days, cartCount })
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },
    orderCancel: (req, res) => {
        try {
            userHelper.cancelOrder(req.params.id).then(() => {
                res.redirect('/my-orders')
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },

    orderReturn: (req, res) => {
        try {
            userHelper.returnOrder(req.params.id).then(() => {
                res.redirect('/my-orders')
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }

    },

    addAddress: async (req, res) => {
        try {
            let user = req.session.user
            let cartCount = await userHelper.cartProdCount(user._id)
            res.render('user/new-address', { user, cartCount })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },

    newAddress: (req, res) => {
        try {
            userHelper.addNewAddress(req.body).then(() => {
                res.redirect('/checkout')
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    }
    ,

    changeAddress: async (req, res) => {
        try {

            let user = req.session.user
            let cartCount = await userHelper.cartProdCount(user._id)
            userHelper.userAddresses(user._id).then((addresses) => {
                res.render('user/change-address', { user, addresses, cartCount })

            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },

    changeAddressTo: (req, res) => {
        try {
            let user = req.session.user
            userHelper.toDefaultAddress(user._id, req.params.id).then((response) => {
                res.redirect('/checkout')
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },



    applyCoupon: (req, res) => {
        try {
            let user = req.session.user

            userHelper.couponCheck(req.body, user._id).then((discount) => {

                res.send({ status: true, discount })
            }).catch((errorMsg) => {
                res.send({ status: false, errorMsg })
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' });
        }
    },


    getMenProducts: async (req, res) => {
        try {
            let cartCount;
            let user;
            if (req.session.userLoggedIn) {
                user = req.session.user
                cartCount = await userHelper.cartProdCount(user._id)
            }
            userHelper.menProducts().then((products => {
                res.render('user/shopMen', { products, cartCount, user })
            }))
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' })
        }
    },

    getWomenProducts: async (req, res) => {
        try {
            let cartCount;;
            let user
            if (req.session.userLoggedIn) {
                user = req.session.user
                cartCount = await userHelper.cartProdCount(user._id)
            }
            userHelper.womenProducts().then((products => {
                res.render('user/shopWomen', { products, cartCount, user })
            }))
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' })
        }
    },

    searchProduct: async (req, res) => {
        try {
            let cartCount;
            let user
            if (req.session.userLoggedIn) {
                user = req.session.user
                cartCount = await userHelper.cartProdCount(user._id)
            }

            userHelper.search(req.query.word).then((products) => {
                res.render('user/search', { products, cartCount, user })

            }).catch((result) => {
                res.render('user/search', { result, cartCount, user })
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' })
        }
    },

    addtoWishlist: (req, res) => {
        try {
            userHelper.toWishlist(req.body.prodId, req.session.user._id).then(() => {
                res.json({ status: true })
            })
        }
        catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' })
        }

    },
    wishlist: async (req, res) => {
        try {
            let user = req.session.user
            cartCount = await userHelper.cartProdCount(user._id)
            userHelper.getWishList(req.session.user._id).then((productList) => {
                res.render('user/wishList', { user, cartCount, productList })
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' })
        }
    },

    removeFromWishlist: async (req, res) => {
        try {
            let user = req.session.user
            userHelper.deleteFromWishlist(req.body.prodId, user._id).then((response) => {
                res.json({ status: true })
            })
        } catch (error) {
            res.render('error', { message: error.message, code: 500, layout: 'error-layout' })
        }
    }



}
