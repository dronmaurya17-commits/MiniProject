const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.set("view engine",'ejs')

app.get('/',(req,res)=>{
    res.render("index");
})

app.get("/login",isLoggedIn,(req,res)=>{
    res.render('login');
})

app.post('/register',async(req,res)=>{
    let {email,password,username,name,age} = req.body;
    let user = await userModel.findOne({email});

    //if user is already present 
    if(user){
        return res.status(500).send("User already registered")
    }

    //if user is not there then create that user using password
    bcrypt.genSalt(10,(err,salt)=>{
        console.log("Salt is:- "+ salt);

        bcrypt.hash(password,salt,async (err,hash)=>{
            console.log("Hash is:- "+ hash);

            let user = await userModel.create({
                username,
                email,
                age,
                name,
                password:hash
            });


    //after creating user we need to keep it login using token
             let token = jwt.sign({email:email,userid: user._id},"shhh")    
             res.cookie("token",token) 
             res.send("Registered")



        })
    });
})

app.post('/login',async(req,res)=>{
    let {email,password} = req.body;
    let user = await userModel.findOne({email});

    //if user is already present 
    if(!user){
        return res.status(500).send("Something went Wrong!")
    }

    //if user exist then check its details like email and passcode are right or not
    bcrypt.compare(password,user.password,function(err,result){
        if(result){
            let token = jwt.sign({email:email,userid: user._id},"shhh")    
            res.cookie("token",token) 
            return res.status(200).send("Logged In");
        }else{
            res.redirect("/login");
        }
    })
    
    });



app.get("/logout",(req,res)=>{
    //logout means resetting cookie back to nothing or null
    res.cookie("token","");

    res.redirect("/login");
})
   
//creating a protected route 
app.get("/profile",isLoggedIn,(req,res)=>{
    console.log(req.user);
    res.render("login");
})


//Creating isLoggedIn middle ware 
function isLoggedIn(req,res,next){
    console.log(req.cookies);

    if(req.cookies.token === ""){
        res.send("Login First");
    }else{
        //email and userID mil jaega data mei 
        let data = jwt.verify(req.cookies.token, "shhh");
        req.user = data;
        next();
    }

}    


app.listen(3000);