const path=require('path');
const http=require('http');
const express=require('express');
const socketIO=require('socket.io');
const publicpath=path.join(__dirname,"../static");
const {Users}=require('./users');
let users=new Users();
const app=express();
app.set("view engine","ejs");
app.set('views',(path.join(__dirname,'views')));
app.use(express.static(publicpath));
let server=http.createServer(app);
const mongoose=require('mongoose')
const MONGODB_URI='mongodb+srv://adminuser:useradmin@charitydb.fivwx.mongodb.net/ChatApp?retryWrites=true&w=majority'
mongoose.connect(process.env.MONGODB_URI||MONGODB_URI,{
    useNewUrlParser:true,
    useUnifiedTopology:true
}).then(()=>console.log("Connection successful")).catch((err)=>{
    console.log(err);
})
const ChatSchema=new mongoose.Schema({
    room:String,
    name:String,
    email:String,
    message:String,
    createdAt:String,
    isLocation:{
        type:Boolean,
        default:false
    },
    isImage:{
        type:Boolean,
        default:false
    }
});
const Chat=new mongoose.model("Chat",ChatSchema);
function isValid(str){
    return str.trim().length > 0
}
app.get("/",(req,res)=>{
    res.render('index');
})
app.get("/room",(req,res)=>{
    const name=req.query.name;
    const room=req.query.room;
    res.render("room",{
        room:room
    })
})
let io=socketIO(server);
    io.on('connection',(socket)=>{
        socket.on('join',async (params,callback)=>{
            if(!isValid(params.name) || !isValid(params.room) || !isValid(params.email)){
                callback('Name,Email and Room should be valid');
            }
            socket.join(params.room);
            users.removeUser(socket.id);
            users.addUser(socket.id,params.name,params.room,params.email);
            io.to(params.room).emit('updateUsersList',users.getUserList(params.room));
            try{
                const chats=await Chat.find({});
                chats.map((chat)=>{
                    if(chat.room==params.room){
                        if(chat.isLocation){
                            socket.emit('newLocationMessage',{
                                from: chat.name,
                                email: chat.email,
                                url: chat.message,
                                createdAt: chat.createdAt
                            })
                        }
                        else if(chat.isImage){
                            socket.emit('newImageMessage',{
                                from: chat.name,
                                email: chat.email,
                                url: chat.message,
                                createdAt: chat.createdAt
                            })
                        }
                        else{
                            socket.emit('newMessage',{
                                from: chat.name,
                                email: chat.email,
                                text: chat.message,
                                createdAt: chat.createdAt
                            })
                        }
                    }
                })
                socket.emit('newMessage',{
                    from: "Admin",
                    text: "Welcome to chat room",
                    createdAt: new Date().toLocaleTimeString()+" "+new Date().toLocaleDateString()
                })
                socket.broadcast.to(params.room).emit('newMessage',{
                    from: "Admin",
                    text: "A new user has joined",
                    createdAt: new Date().toLocaleTimeString()+" "+new Date().toLocaleDateString()
                })
                callback();
            }catch(err){
                console.log(err);
            }
        })
        socket.on('createMessage',async (message)=>{
            let user=users.getUser(socket.id);
            const time=new Date().toLocaleTimeString()+" "+new Date().toLocaleDateString()
            if(user && isValid(message.text)){
                io.to(user.room).emit('newMessage',{
                    from: user.name,
                    text: message.text,
                    email: user.email,
                    createdAt: time
                })
                try{
                    const chat=new Chat({
                        email: user.email,
                        name: user.name,
                        message: message.text,
                        createdAt: time,
                        room: user.room
                    })
                    const reg=await chat.save();
                    res.status(200).send(reg);
                }
                catch(err){
                    console.log(err);
                }
            }        
        })
        socket.on('createLocationMessage',async (message)=>{
            let user=users.getUser(socket.id);
            const time=new Date().toLocaleTimeString()+" "+new Date().toLocaleDateString()
            if(user){
                io.to(user.room).emit('newLocationMessage',{
                    from: user.name,
                    email: user.email,
                    url: `https://www.google.com/maps?q=${message.lat},${message.lon}`,
                    createdAt: time
                })
                try{
                    const chat=new Chat({
                        room: user.room,
                        name: user.name,
                        email: user.email,
                        message: `https://www.google.com/maps?q=${message.lat},${message.lon}`,
                        createdAt: time,
                        isLocation: true
                    })
                    const reg=await chat.save();
                    res.status(200).send(reg);
                }
                catch(err){
                    console.log(err);
                }
            }        
        })
        socket.on('createImageMessage',async (message)=>{
            let user=users.getUser(socket.id);
            const time=new Date().toLocaleTimeString()+" "+new Date().toLocaleDateString()
            if(user){
                io.to(user.room).emit('newImageMessage',{
                    from: user.name,
                    email: user.email,
                    url: message.url,
                    createdAt: time
                })
                try{
                    const chat=new Chat({
                        room: user.room,
                        name: user.name,
                        email: user.email,
                        message: message.url,
                        createdAt: time,
                        isImage: true
                    })
                    const reg=await chat.save();
                    res.status(200).send(reg);
                }
                catch(err){
                    console.log(err);
                }
            }        
        })
        socket.on('disconnect',()=>{
            let user=users.removeUser(socket.id);
            if(user){
                io.to(user.room).emit('updateUsersList',users.getUserList(user.room));
                io.to(user.room).emit('newMessage',{
                    from: "Admin",
                    text: `${user.name} has left the chat room ${user.room}`,
                    createdAt: new Date().toLocaleTimeString()+" "+new Date().toLocaleDateString()
                })
            }
        })       
    })
const port=process.env.PORT||8000;
server.listen(port,()=>{
    console.log(`listening to port ${port}`);
})