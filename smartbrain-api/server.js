const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'test',
      database : 'SmartBrain'
    }
  });

//   db.select('*').from('users').then(data=>{
//       console.log(data);
//   })

const app = express();

app.use(bodyParser.json())
app.use(cors())

const database = {
    users:[
        {
            id:'123',
            name:'john',
            email:'john@gmail.com',
            password:'cookies',
            entries:0,
            joined:new Date()
        },
        {
            id:'124',
            name:'sally',
            email:'sally@gmail.com',
            password:'bananas',
            entries:0,
            joined:new Date()
        }
    ]
}

app.get('/',(req, res)=>{
    res.send(database.users);
})

app.post('/signin',(req,res)=>{
    db.select('email','hash').from('login')
    .where('email', '=', req.body.email)
    .then(data=>{
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        console.log(isValid);
        if(isValid){
            return db.select("*").from('users')
            .where('email', '=', req.body.email)
            .then(user=> {
                console.log(user);
                res.json(user[0])
            })
            .catch(err=>res.status(400).json('unable to get user'))
        }
        else{
            res.status(400).json('wrong credentials')
        }
    })
    .catch(err=> res.status(400).json('wrong credentials'));
})

app.post('/register', (req,res)=>{
    const {email, name, password} = req.body;
    const hash = bcrypt.hashSync(password);
        db.transaction(trx => {
            trx.insert({
                hash:hash,
                email:email
            })
            .into('login')
            .returning('email')
            .then(loginemail => {
                return trx('users')
                .insert({
                    email:loginemail[0],
                    name:name,
                    joined:new Date()
                })
                .then(user=>{
                    res.json(user[0]);
                })
            })
            .then(trx.commit)
            .catch(trx.rollback)
        })
    .catch(err=> res.status(400).json('unable to register'))
})

app.get('/profile/:id', (req,res)=> {
    const {id} = req.params;
    db.select('*').from('users').where({id})
    .then(user=>{
        if(user.length){
            res.json(user[0])
        }else{
            res.status(400).json('not found')
        }
    })
    .catch(err => res.status(400).json('error getting user'))
})

app.post('/image', (req,res)=> {
    const {id} = req.body;
    let found = false;
    database.users.forEach(user => {
        if (user.id === id){
            found = true;
            user.entries++
            return res.json(user.entries);
        }
    })
    if (!found){
        res.status(404).json('not found');
    }
})

app.listen(3000, ()=>{
    console.log("app is running on port 3000");
})

/*
--> res = this is working
/signin --> post success/fail
/register --> post user
/profile/:userId --> get = user
/image --> put --> user
*/ 