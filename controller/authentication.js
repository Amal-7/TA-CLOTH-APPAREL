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
    user:(req,res,next)=>{
        try{
        if(req.session.userLoggedIn){
            next()
        }else{
            res.redirect('/')
        }
    } catch (error) {
        res.render('error', { message: error.message, code: 500, layout: 'error-layout' });  
        }
    }
}