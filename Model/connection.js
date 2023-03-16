const MongoClient = require('mongodb').MongoClient
const state = {
    db:null
}

module.exports.connect = function(done){
    const url = 'mongodb+srv://amalta1997:cristiano7@tacloth.x8eq5ou.mongodb.net/?retryWrites=true&w=majority';
    const dbname = 'project' ;

    MongoClient.connect(url,{useNewUrlParser:true,useUnifiedTopology: true },(err,data)=>{

        if(err) return done(err)
        state.db=data.db(dbname)
        done()

    })
    
}

module.exports.get = function(){
    return state.db;
}