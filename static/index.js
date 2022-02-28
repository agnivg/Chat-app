let socket=io();
function scrollToBottom(){
    let mess=document.querySelector('.message').lastElementChild;
    mess.scrollIntoView();
}
socket.on('connect',function(){
    let searchQuery = window.location.search.substring(1);
    let params = JSON.parse('{"' + decodeURI(searchQuery).replace(/&/g, '","').replace(/\+/g, ' ').replace(/=/g,'":"') + '"}');
    socket.emit('join',params,function(err){
        if(err){
            alert(err);
            window.location.href="/";
        }
    })
})
socket.on('newMessage',function(message){
    let searchQuery = window.location.search.substring(1);
    let params = JSON.parse('{"' + decodeURI(searchQuery).replace(/&/g, '","').replace(/\+/g, ' ').replace(/=/g,'":"') + '"}');
    const div=document.createElement('div');
    const template = document.querySelector('#message-template').innerHTML;
    if(params.email===message.email){
        const html = Mustache.render(template, {
            from: "",
            text: message.text,
            createdAt: message.createdAt
        });
        div.innerHTML=html;
        div.style.cssText="background-color:green;margin:5px 20px 5px 40%;padding:10px;";
    }
    else{
        const html = Mustache.render(template, {
            from: message.from,
            text: message.text,
            createdAt: message.createdAt
        });
        div.innerHTML=html;
        div.style.cssText="background-color:rgba(0,0,0,0.8);margin:5px 40% 5px 20px;padding:10px;";
    }
    const mess=document.querySelector('.message');
    mess.appendChild(div);
    scrollToBottom();
})
socket.on('newLocationMessage',function(message){
    let searchQuery = window.location.search.substring(1);
    let params = JSON.parse('{"' + decodeURI(searchQuery).replace(/&/g, '","').replace(/\+/g, ' ').replace(/=/g,'":"') + '"}');
    const div=document.createElement('div');
    const template = document.querySelector('#location-message-template').innerHTML;
    if(params.email===message.email){
        const html = Mustache.render(template, {
            from: "",
            url: message.url,
            createdAt: message.createdAt
        });
        div.innerHTML=html;
        div.style.cssText="background-color:green;margin:5px 20px 5px 40%;padding:10px;";
    }
    else{
        const html = Mustache.render(template, {
            from: message.from,
            url: message.url,
            createdAt: message.createdAt
        });
        div.innerHTML=html;
        div.style.cssText="background-color:rgba(0,0,0,0.8);margin:5px 40% 5px 20px;padding:10px;";
    }
    const mess=document.querySelector('.message');
    mess.appendChild(div);
    scrollToBottom();
})
socket.on('newImageMessage',function(message){
    let searchQuery = window.location.search.substring(1);
    let params = JSON.parse('{"' + decodeURI(searchQuery).replace(/&/g, '","').replace(/\+/g, ' ').replace(/=/g,'":"') + '"}');
    const div=document.createElement('div');
    const template = document.querySelector('#image-message-template').innerHTML;
    if(params.email===message.email){
        const html = Mustache.render(template, {
            from: "",
            url: message.url,
            createdAt: message.createdAt
        });
        div.innerHTML=html;
        div.style.cssText="background-color:green;margin:5px 20px 5px 40%;padding:10px;";
    }
    else{
        const html = Mustache.render(template, {
            from: message.from,
            url: message.url,
            createdAt: message.createdAt
        });
        div.innerHTML=html;
        div.style.cssText="background-color:rgba(0,0,0,0.8);margin:5px 40% 5px 20px;padding:10px;";
    }
    const mess=document.querySelector('.message');
    mess.appendChild(div);
    scrollToBottom();
})
socket.on('disconnect',function(){
    console.log("Disconnected from server");
})
socket.on('updateUsersList',function(users){
    let ol=document.createElement('ol');
    users.forEach(function(user){
        let li=document.createElement('li');
        li.innerHTML=user;
        li.style.cssText="font-weight:bold;font-size:1.2rem;color:brown;margin-top:2px"
        ol.appendChild(li);
    })
    let List=document.querySelector('.users');
    List.innerHTML="";
    List.appendChild(ol);
})
document.querySelector('.btn1').addEventListener('click',function(e){
    e.preventDefault();
    socket.emit('createMessage',{
        text: document.querySelector('.text').value
    })
    document.querySelector('.text').value="";
})
document.querySelector('.btn2').addEventListener('click',function(e){
    e.preventDefault();
    if(!navigator.geolocation){
        return alert('Geolocation not supported by your browser');
    }
    navigator.geolocation.getCurrentPosition(function(pos){
        socket.emit('createLocationMessage',{
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
        })
    }),function(){
        alert('Unable to fetch location');
    }   
})
document.querySelector('.btn3').addEventListener('click',function(e){
    e.preventDefault();
    const x=document.querySelector('.imagediv')
    const y=document.querySelector('.textdiv')
    if(x.style.display==="none"){
        x.style.display="inline"
        y.style.display="none"
    }
    else{
        x.style.display="none"
        y.style.display="inline"
    }
})
document.querySelector('.btn4').addEventListener('click',function(e){
    e.preventDefault();
    const x=document.querySelector('.imagefile').files
    let url=""
    const files = Array.from(x)
    files.map(async file => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const form = new FormData();
            form.append("image", file)
            const response = await fetch("https://api.imgbb.com/1/upload?key=b25be8be2dd8588068d161a073d36cdd", {
                body: form,
                method: "POST"
            })
            const data = await response.json()
            url=data.data.display_url;
            socket.emit('createImageMessage',{
                url: url
            })
        };
        reader.onerror = error => alert(error);
    })  
    document.querySelector('.imagefile').value = "";
})
