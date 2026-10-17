const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require("multer");

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.set("view engine",'ejs');


//Multer
const crypto = require('crypto')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads');
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
      if (err) return cb(err)
      cb(null, file.fieldname + '-' + raw.toString('hex'))
    })
  }
})

const upload = multer({ storage: storage })




app.get('/',(req,res)=>{
    res.render("index");
})

//Multer started
app.get('/test',(req,res)=>{
    res.render("test");
})


app.post('/upload',(req,res)=>{
    res.render("test");
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
            let token = jwt.sign({email:user.email,userid: user._id},"shhh")    
            res.cookie("token",token) 
            return res.status(200).redirect("/profile");
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
app.get("/profile",isLoggedIn,async (req,res)=>{

    //Covered in Video 1
   /* console.log(req.user);
    res.render("login");*/

    //Part of Video 2 starts from here
    let user = await userModel.findOne({email: req.user.email}).populate("posts");
    console.log("User is:-" + user);
    //Populate:-Showing the data of the user or the post on the front end 

    //sending user onto the profile page
    res.render("profile", {user});
})

app.get("/like/:id",isLoggedIn,async (req,res)=>{

    //Part of Video 2 starts from here
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    //Populate:-Showing the data of the user or the post on the front end 


    //Saving the number of likes 
    if(post.likes.indexOf(req.user.userid) === -1){ 
        post.likes.push(req.user.userid); //sending user onto the profile page
    }else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1); //post ke likes mei se ek banda hata
    }
    

    //Saving all the number of likes
    await post.save();
    res.redirect("/profile");
})


app.get("/edit/:id",isLoggedIn,async (req,res)=>{

    //Part of Video 2 starts from here
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    //Populate:-Showing the data of the user or the post on the front end 

    res.render("edit",{post});

})

//edit ke baad update hoga aur uska route banega
app.get("/update/:id",isLoggedIn,async (req,res)=>{

    //Part of Video 2 starts from here
    let post = await postModel.findOneAndUpdate({_id: req.params.id},{content: req.body.content})
    //Populate:-Showing the data of the user or the post on the front end 

    res.redirect("/porfile",{post});

})


//Post sirf tab dikhna chaiye jab user login ho
app.post("/post",isLoggedIn,async (req,res)=>{
    let user = await userModel.findOne({email: req.user.email});
    let {content} = req.body;

    let post = await postModel.create({
        user: user._id,
        content,
    })

    //post create hogyi ab user ko batana hai ki uske post mei kya kya hai
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
})

//Creating isLoggedIn middle ware 
function isLoggedIn(req,res,next){
    console.log(req.cookies);

    if(req.cookies.token === ""){
        res.redirect("/login");
    }else{
        //email and userID mil jaega data mei 
        let data = jwt.verify(req.cookies.token, "shhh");
        req.user = data;
        next();
    }

}    


app.listen(3000);