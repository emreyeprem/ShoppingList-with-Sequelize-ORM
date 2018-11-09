const express = require('express')
const mustacheExpress = require('mustache-express')
const bodyParser = require('body-parser')
const app = express()
var session = require('express-session')
// import the pg-promise library which is used to connect and execute SQL on a postgres database
const pgp = require('pg-promise')()
// connection string which is used to specify the location of the database
const connectionString = "postgres://localhost:5432/grocerydb"
// creating a new database object which will allow us to interact with the database
const db = pgp(connectionString)
const models = require('./models')  //sequelize config
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('css'))
// ==================================
app.use(express.static('images'))
app.use(express.static('scss'))
app.use(express.static('js'))
app.use(express.static('fonts'))
app.use(express.static('vendor/jquery'))
// ======================================
app.engine('mustache',mustacheExpress())
app.set('views','./views')
app.set('view engine','mustache')
app.use(session({
  secret: 'cat',
  resave: false,
  saveUninitialized: false
}))
app.listen(3015,function(req,res){
  console.log("Server has started...")
})
// =========================== Middleware =================================

let authenticateLogin = function(req,res,next) {

  // check if the user is authenticated
  if(req.session.username) {
    next()
  } else {
    res.redirect("/login")
  }

}
app.all("/",authenticateLogin,function(req,res,next){
    next()
})

// -----------------------------------------------------------------------
app.get('/',function(req,res){
   models.store.findAll({
     where: {
       userid: req.session.userId
     },
     include: [
       {
         model : models.item,
         as : 'items'
       }
     ]
   }).then(function(stores){
  if(req.session.username){
    res.render('index',{storeList : stores, username : req.session.username})
  } else{
           res.render('index',{storeList : stores})
      }
   })

})
app.post('/add_store',function(req,res){
  let name = req.body.name
  let street = req.body.street
  let city = req.body.city
  let state = req.body.state
  let userid = req.session.userId
  let store = models.store.build({
    name:name, street:street, city:city, state:state, userid:userid})
   store.save()
   res.redirect('/')
})

app.get('/delete/:id',function(req,res){
  let storeId = req.params.id
  models.store.findById(storeId).then(function(store){
    return store.destroy()

  }).then(function(){
    res.redirect('/')
  })
})

app.post('/add_item',function(req,res){
  let item = req.body.item
  let storeId = req.body.storeId
  let itemToSave = models.item.build({
    name : item,
    storeid : storeId
  })
  itemToSave.save().then(function(){
    res.redirect('/')
  })
})

app.get('/deleteItem/:id',function(req,res){
  let itemId = req.params.id
  console.log(itemId)
  models.item.findById(itemId).then(function(item){
    return item.destroy()
  }).then(function(){
    res.redirect('/')
  })
})
app.get('/login',function(req,res){
  res.render('login')
})
// ================= user part ===================

app.get('/login',function(req,res){
   res.render('login')
})
app.post('/signup',function(req,res){
  let username = req.body.username
  let password = req.body.password
  let email = req.body.email
  models.user.build({
    username:username,
    password:password,
    email:email
  }).save().then(function(){
    res.redirect('/login')
  }).catch(function(error){
    console.log(error)
    alert(error)
  })
})

app.post('/login',function(req,res){
  let userName = req.body.your_username
  let passWord = req.body.your_password
  models.user.findOne({
    where:{
      username:userName,
      password:passWord
    }
  }).then(function(user){
    if(user != null){
      req.session.username = user.username
      req.session.userId = user.id
      console.log(req.session.userId)
      res.redirect('/')
    } else{
      res.redirect('/login')
    }
  }).catch(function(error){
    res.redirect('/login')
  })
})
// ----------------- logout -----------------

app.get('/logout',function(req,res){
  if(req.session.username){
    req.session.destroy()
    res.redirect('/login')
  }
})
