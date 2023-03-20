const userHelper = require('../Model/helpers/user-helpers')

module.exports ={
    admin:(req,res,next)=>{
        try{
        if(req.session.adminLoggedIn){
            next()
        }else{
            res.redirect('/admin')
        }
    } catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' });  
        }
    },
    user:async(req,res,next)=>{
        try{
        if(req.session.userLoggedIn){
            let user = await userHelper.getUser(req.session.user._id)
            if(user.isActive){
                
                 next()
            }else{
                req.session.user=null
                req.session.userLoggedIn=null
                res.redirect('/')
            }

        }else{
            res.redirect('/')
        }
    } catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' });  
        }
    }
}