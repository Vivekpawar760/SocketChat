const socket = io()
let name;
let textarea = document.querySelector('#textarea')
let messageArea = document.querySelector('.message__area')
let typingArea = document.querySelector('.typing__area')
let contactSection = document.querySelector('.contact__section')
console.log(contactSection);
// document.querySelector('emoji-picker')
//   .addEventListener('emoji-click', event => 
//   console.log(event.detail)
//   );
let UserID = 0;
let MainUrl = 'http://192.168.1.45:2023/';
if(localStorage.getItem("ID")){
    UserID = localStorage.getItem("ID")
}
let MainisLargeNumber;
const urlParams = new URLSearchParams(window.location.search);
let SingleUserID = urlParams.get('id');

// socket.emit('message', '')
ContactArray = [];
GetAllData(-1);
AllContact();

socket.emit('WritingEvent', '')


name = localStorage.getItem('username');
while(!name){
    name = prompt('Please enter your name: ')
    // socket.emit('AddStudent', name)
    if(name){
        var saveData = $.ajax({
            type: 'POST',
            url: MainUrl+'Add',
            data: {name : name},
            dataType: "text",
            success: function(resultData) { 
                resultData = JSON.parse(resultData);
                localStorage.setItem("username", name);
                localStorage.setItem("ID", resultData.ID);
                NewEntryNotification(name);
            }
        });
        saveData.error(function() { alert("Something went wrong"); });
    }
}

function GetAllData(index){
    messageArea.innerHTML = "";
    $(`.friend`).removeClass('selected');
    if(index > -1){
        let element = ContactArray[index];
        SingleUserID = element.UserID;
        $(`#friend_${element.UserID}`).addClass('selected');
        GetSingleData(element.Name)
    }else{
        SingleUserID = 0;
        GetSingleData();
    }
    
    var GetData = $.ajax({
        type: 'POST',
        url: MainUrl+'GetData',
        data: {UserID : UserID,
        SingleUserID : SingleUserID},
        dataType: "text",
        success: function(resultData) { 
            resultData = JSON.parse(resultData);
           for (let index = 0; index < resultData.Chat.length; index++) {
               const element = resultData.Chat[index];
            
               let msg = {
                id:UserID,
                user: element.Name,
                message: element.Message
                }
                if(SingleUserID){
                    msg['RecID']  = SingleUserID;
                }
                if(!SingleUserID){
                    if(UserID == element.UserID){
                        appendMessage(msg, 'outgoing')
                    }else{
                        appendMessage(msg, 'incoming')
                    }
                }else{
                    msg['user'] = "";
                    if(UserID == element.UserID && element.RecID == SingleUserID){
                        appendMessage(msg, 'outgoing')
                    }else{
                        appendMessage(msg, 'incoming')
                    }
                }
            }
            // getAttentionAll('message', 50, 10, 1.2, 0);
            scrollToBottom()
        }
    });
    GetData.error(function() { alert("Something went wrong"); });
}

function GetSingleData(Name = ""){
    $("#logoimg").attr("src","/man.png");
    if(SingleUserID){
        if(Name){
            $('#UserName').html(Name);
        }
        if(localStorage.getItem("ID") == SingleUserID){
            $('#UserName').html('You');   
        }
        $("#logoimg").attr("src","/man2.png");
    }else{
        $('#UserName').html("Dnk Group");
    }
}

textarea.addEventListener('keyup', (e) => {
    console.log(e);
    if(e.target.value == ""){
        socket.emit('WritingEvent', '')
    }else{
        socket.emit('WritingEvent', localStorage.getItem("username"))
    }
    
    console.log("object");
    if(e.key === 'Enter' && e.target.value.trim()!="") {
        socket.emit('WritingEvent', '')
        sendMessage(e.target.value)
        getAttention('message', 50, 10, 1.2);
    }
})

function sendMessage(message) {
    let msg = {
        id:localStorage.getItem("ID"),
        RecID:0,
        user: name,
        message: message
    }
    if(SingleUserID){
        msg['RecID']  = SingleUserID;
    }
    
    // Append 
    
    appendMessage(msg, 'outgoing')
    textarea.value = ''
    scrollToBottom()

    // Send to server 
    socket.emit('message', msg)
}

async function appendMessage(msg, type) {
    let mainDiv = document.createElement('div')
    let className = type
    mainDiv.classList.add(className, 'message')
    let uname = msg.user
    if(type == 'outgoing'){
        uname = "";
        // mainDiv.classList.add(type, 'w-25','float-right')
    }else{
        // mainDiv.classList.add(type, 'w-25')
    }

    let markup = `
        <h4>${uname}</h4>
        <p class="m-3">${msg.message}</p>
    `
    mainDiv.innerHTML = markup
    messageArea.appendChild(mainDiv)
}

// Recieve messages 
socket.on('message', (msg) => {
    AllContact();
    if(!SingleUserID){
        if(msg.id == localStorage.getItem("ID")){
            appendMessage(msg, 'outgoing')
        }else{
            appendMessage(msg, 'incoming')
        }
    }else{
        msg['user'] = "";
        if(msg.id == localStorage.getItem("ID") && msg.RecID == SingleUserID){
            appendMessage(msg, `outgoing`)
        }else{
            appendMessage(msg, `incoming`)
        }
    }
    getAttention('message', 50, 10, 1.2);
    scrollToBottom()
})

function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight
}

function NewEntryNotification(Name) {
    if(!SingleUserID) socket.emit('Notification', Name)
}

socket.on('Notification', (Name) => {
    
    let mainDiv = document.createElement('div')
    // let className = type
    mainDiv.classList.add('Newuser', 'Newuser')

    let markup = `<p class='NewUserTag'> <img src="https://img.icons8.com/office/30/000000/checked-user-male--v1.png"/> ${Name} has joined </p>`;
    mainDiv.innerHTML = markup
    messageArea.appendChild(mainDiv)
    scrollToBottom()
})

socket.on('WritingEvent', function(Name) {
    const rndInt = Math.floor(Math.random() * 4) + 1
    if(Name!=""){
        typingArea.innerHTML = `<div class="incoming">${Name} is typing <img class="typing-gif" src="/Images/typing-dots.gif"></div>`;
    }else{
        typingArea.innerHTML = '';
    }
    scrollToBottom()
})


function AllContact(){
    var GetData = $.ajax({
        type: 'POST',
        url: MainUrl+'AllContact',
        data: {UserID:localStorage.getItem("ID")},
        dataType: "text",
        success: function(resultData) { 
            resultData = JSON.parse(resultData);
            if(SingleUserID){
                $('.friend').removeClass('selected');
            }else{
                $('#friend').addClass('selected');
            }
            ContactArray = resultData.Contact;
            const isLargeNumber = (element) => element.UserID == localStorage.getItem("ID");
            
            let index = ContactArray.findIndex(isLargeNumber)
            if(index == -1){
                localStorage.removeItem('ID');
                localStorage.removeItem('username');
                window.location.reload(true);
            }
            
            
            let mainUl = document.createElement('ul')
            // let className = type
            mainUl.classList.add('friend-list', 'friend-list')
            let LiTag = `<a onclick="GetAllData(-1)"id="Anch">
            <li class='friend' id="friend">
            <img src='/man.png' />
            <div class='name' style="color:white !important">
                Dnk Group
            </div>
            </li></a>`;
            
           for (let index = 0; index < ContactArray.length; index++) {
               const element = ContactArray[index];
            
            let Name =  element.Name;
            if(localStorage.getItem("ID") == element.UserID){
                Name = 'You';
            }
            // href='?id=${element.UserID}'
            
            LiTag += `<a onclick="GetAllData(${index})"  id="Anch">
                            <li class='friend' id="friend_${element.UserID}">
                            <img src='/man2.png' />
                            <div class='name'> 
                            <h6>${Name}</h6>
                            <p>${element.LastChat}</p>
                            </div>
                            </li></a>`;
            }
            mainUl.innerHTML = LiTag;
            console.log(mainUl);
            contactSection.appendChild(mainUl)
        }
    });
    GetData.error(function() { alert("Something went wrong"); });
}

function getAttention(elementClass,initialDistance, times, damping) {
    ClassName = $('.'+elementClass).last()
    damping = 10;
    for(var i=1; i<=times; i++){
        var an = Math.pow(-1,i)*initialDistance/(i*damping);
        ClassName.animate({'top':an},100);
    }
    ClassName.animate({'top':0},100);
}

function getAttentionAll(elementClass,initialDistance, times, damping) {
    let ClassName = $('.'+elementClass);
    damping = 10;
    initialDistance = 500;

    // $(ClassName).animate({ marginTop: "50px" }, 500 )
    // .animate({ marginBottom: "24px" }, 100 );
    times = 3;
    for(var i=1; i<=times; i++){
        var an = Math.pow(-1,i)*initialDistance/(i*damping);
        ClassName.animate({'top':an},100);
    }
    ClassName.animate({'top':0},100);    
}
  
 





