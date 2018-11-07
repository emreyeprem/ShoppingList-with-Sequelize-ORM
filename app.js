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

app.engine('mustache',mustacheExpress())
app.set('views','./views')
app.set('view engine','mustache')
app.use(session({
  secret: 'cat',
  resave: false,
  saveUninitialized: false
}))
app.listen(3012,function(req,res){
  console.log("Server has started...")
})
// =================================================================
app.get('/',function(req,res){
   models.store.findAll().then(function(stores){
   console.log(stores)
  res.render('index',{storeList : stores})
   })
})
app.post('/add_store',function(req,res){
  let name = req.body.name
  let street = req.body.street
  let city = req.body.city
  let state = req.body.state
  let store = models.store.build({
    name:name, street:street, city:city, state:state})
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
