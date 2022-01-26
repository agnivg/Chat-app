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
        socket.on('join',(params,callback)=>{
            if(!isValid(params.name) || !isValid(params.room) || !isValid(params.email)){
                callback('Name,Email and Room should be valid');
            }
            socket.join(params.room);
            users.removeUser(socket.id);
            users.addUser(socket.id,params.name,params.room,params.email);
            io.to(params.room).emit('updateUsersList',users.getUserList(params.room));
            socket.emit('newMessage',{
                from: "Admin",
                text: "Welcome to chat room",
                createdAt: new Date().toLocaleTimeString()
            })
            socket.broadcast.to(params.room).emit('newMessage',{
                from: "Admin",
                text: "A new user has joined",
                createdAt: new Date().toLocaleTimeString()
            })
            callback();
        })
        socket.on('createMessage',(message)=>{
            let user=users.getUser(socket.id);
            if(user && isValid(message.text)){
                io.to(user.room).emit('newMessage',{
                    from: user.name,
                    text: message.text,
                    email: user.email,
                    createdAt: new Date().toLocaleTimeString()
                })
            }        
        })
        socket.on('createLocationMessage',(message)=>{
            let user=users.getUser(socket.id);
            if(user){
                io.to(user.room).emit('newLocationMessage',{
                    from: user.name,
                    email: user.email,
                    url: `https://www.google.com/maps?q=${message.lat},${message.lon}`,
                    createdAt: new Date().toLocaleTimeString()
                })
            }        
        })
        socket.on('createImageMessage',(message)=>{
            let user=users.getUser(socket.id);
            if(user){
                io.to(user.room).emit('newImageMessage',{
                    from: user.name,
                    email: user.email,
                    url: message.url,
                    createdAt: new Date().toLocaleTimeString()
                })
            }        
        })
        socket.on('disconnect',()=>{
            let user=users.removeUser(socket.id);
            if(user){
                io.to(user.room).emit('updateUsersList',users.getUserList(user.room));
                io.to(user.room).emit('newMessage',{
                    from: "Admin",
                    text: `${user.name} has left the chat room ${user.room}`,
                    createdAt: new Date().toLocaleTimeString()
                })
            }
        })       
    })
const port=process.env.PORT||8000;
server.listen(port,()=>{
    console.log(`listening to port ${port}`);
})