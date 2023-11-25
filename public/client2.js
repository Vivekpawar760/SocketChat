const socket = io()
var name;
var textarea = document.querySelector('#textarea2')
var messageArea = document.querySelector('.message__area')
var typingArea = document.querySelector('.typing__area')
var contactSection2 = document.querySelector('.contact__section')
var MainIndex = -1;
var UserID = 0;
var LocalRecID = 0;
var MainUrl = 'http://192.168.1.45:2023/';
if(localStorage.getItem("ID")){
    UserID = localStorage.getItem("ID")
}
if(localStorage.getItem("LocalRecID")){
    LocalRecID = localStorage.getItem("LocalRecID")
}
var MainisLargeNumber;
const urlParams = new URLSearchParams(window.location.search);
var SingleUserID = urlParams.get('id');
$('#MyName').html(localStorage.getItem("username"))

// socket.emit('message', '')
ContactArray = [];
$(document).ready(function(){
    if(!name)   {   
        Logout()
    }else{
        $.ajax({
            type: 'POST',
            url: MainUrl+'check',
            data: {name : localStorage.getItem("ID")},
            dataType: "text",
            success: function(resultData) { 
                resultData = JSON.parse(resultData);
                if(resultData.Status == -1){
                    Logout()
                }else{
                    socket.emit('join', localStorage.getItem("ID"));
                }
            }
        });
    }
    $(window).click(function() {
        $('.action_menu').hide();
    });
    $('#action_menu_btn').click(function(){
        event.stopPropagation();
        $('.action_menu').toggle();
    });
});


GetAllData(MainIndex);
setTimeout(() => {
    AllContact();
}, 50);

socket.emit('WritingEvent', {Name: ''})


document.getElementById("MyName").addEventListener("keyup", function() {
    console.log("input event fired");
}, false);

name = localStorage.getItem('username');

textarea.addEventListener('keyup', (e) => {
    if(e.target.value == ""){
        socket.emit('WritingEvent', {Name: ''})
    }else{
        var currentdate = new Date(); 
        let obj = {
            Name : localStorage.getItem("username"),
            RecId : SingleUserID ? SingleUserID : 0,
            MyId : localStorage.getItem("ID"),
            Date : currentdate.toISOString()
        }
        socket.emit('WritingEvent', obj)
    }
    if(e.key === 'Enter' && e.target.value.trim()!="") {
        MessageSendClick(e.target.value)
    }
})



function MessageSendClick(value=null){
    var currentdate = new Date(); 
    let obj = {
        Name : localStorage.getItem("username"),
        RecId : SingleUserID ? SingleUserID : 0,
        MyId : localStorage.getItem("ID"),
        Date : currentdate.toISOString()
    }
    let InputMessage = value;
    let IsHtml = (InputMessage.search('<') > -1 && InputMessage.search('/>') > -1);
    console.log(IsHtml);
    if(!value){
        InputMessage = $('#textarea').val().replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }else{
        InputMessage = value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        socket.emit('WritingEvent', obj)
    }
    if(IsHtml) InputMessage = `<pre> ${InputMessage} </pre>`;
    console.log(InputMessage);
    socket.emit('WritingEvent', {Name: ''})
    sendMessage(InputMessage)
    getAttention('message', 50, 10, 1.2);
}

function GetAllData(index){
    messageArea.innerHTML = "";
    textarea.value = '';
    $(`.friend`).removeClass('active');
    typingArea.innerHTML = "";
    MainIndex = index;
    if(index > -1){
        let element = ContactArray[index];
        SingleUserID = element.UserID;
        $(`#friend_${SingleUserID}`).addClass('active');
        $('.online_icon2').removeClass('activeClass')
        if(element.Status == 0) $('#online_icon2').addClass('activeClass')
        GetSingleData(element.Name)
        setTimeout(() => {
            $(`#unreadCount_${SingleUserID}`).html('');
            $(`#UserNameClass_${SingleUserID}`).removeClass();
        }, 1000);
        socket.emit('receve', {id : localStorage.getItem("ID"),type:'1'});
        element.IsRead = '1';
        ReadMessge(element)
    }else{
        SingleUserID = 0;
        $('.online_icon2').removeClass('activeClass')
        GetSingleData();
    }
    
    $.ajax({
        type: 'POST',
        url: MainUrl+'GetData',
        data: {UserID : UserID,
        SingleUserID : SingleUserID},
        dataType: "text",
        success: function(resultData) { 
            resultData = JSON.parse(resultData);
            $('#count').html(`${resultData.Chat.length} Messages`);
           for (let index = 0; index < resultData.Chat.length; index++) {
               const element = resultData.Chat[index];
            
               let msg = {
                id:UserID,
                user: element.Name,
                message: element.Message,
                Date: element.Date,
                IsRead: element.IsRead,
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
    // GetData.error(function() { alert("Something went wrong"); });
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

function sendMessage(message) {
    var currentdate = new Date(); 
    let msg = {
        id:localStorage.getItem("ID"),
        RecID:0,
        user: name,
        message: message,
        Date : currentdate.toLocaleString('en-US', { hour: 'numeric',minute: 'numeric', hour12: false })
    }
    if(SingleUserID){
        msg['RecID']  = SingleUserID;
    }
    
    appendMessage(msg, 'outgoing');
    textarea.value = ''
    scrollToBottom();
    // Send to server 
    socket.emit('message', msg)
    setTimeout(() => {
        AllContact();
    }, 50);
    setTimeout(() => {
        $(`#friend_${SingleUserID}`).addClass('active');
    }, 100);
}

async function appendMessage(msg, type) {
    // console.log(msg);
    let mainDiv = document.createElement('div')
    let UnReadclassName = "";
    // if(msg.IsRead == '0'){
    //     UnReadclassName =  "UnRead"
    // }
    let className = type
    let uname = msg.user
    let markup = "";
    let usernamehtml = '<span class="username"></span>';
    if(uname){
        usernamehtml = `<span class="username"><b>${uname}</b></span>`
    }
    // <img src="/double-tick.png" width="20px"></img>
    let IsReadClass = `<span><i class="fa fa-check icon-theme2 text-secondary"></i></span>`;
    if(msg.IsRead == 1){
        IsReadClass = `<span><i class="fa fa-check-double icon-theme text-success"></i></span>`;
    }else if(msg.IsRead == 2){
        console.log(msg.IsRead);
        IsReadClass = `<span><i class="fa fa-check-double icon-theme text-secondary"></i></span>`;
    }
    if(className == 'outgoing'){
        uname = "";
        markup = `<div class="d-flex justify-content-end mb-2">
                        <div>
                            <span class="username"><small class="float-right mr-4">${msg.Date}</small></span>
                            <div class="msg_cotainer_send message">
                                ${msg.message} 
                            </div>
                            <div class="d-flex justify-content-end IsReadID_${msg.RecID}">
                                ${IsReadClass}
                            </div>
                        </div>
                    </div>
                    `
    }else{
        markup = `<div class="d-flex justify-content-start mb-4">
                        <div class="img_cont_msg">
                            <img src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg" class="rounded-circle user_img_msg">
                        </div>
                        <div>
                        ${usernamehtml}
                        <span class="text-white"><small class="">${msg.Date}</small></span>
                            <div class="msg_cotainer ${UnReadclassName} message">
                                ${msg.message}
                            </div>
                        </div>
                    </div>`;
    }
    // <span class="msg_time">8:40 AM, Today</span>
    mainDiv.classList.add(className, 'message')
    mainDiv.innerHTML = markup
    messageArea.appendChild(mainDiv)
}

function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight
}

function NewEntryNotification(Name) {
    if(!SingleUserID) socket.emit('Notification', Name)
}

function AllContact(Search=""){
    var GetData = $.ajax({
        type: 'POST',
        url: MainUrl+'AllContact',
        data: {
            UserID:localStorage.getItem("ID"),
            Search:Search
        },
        dataType: "text",
        success: function(resultData) { 
            let TotalunReadMessage = 0;
            contactSection2.innerHTML  = "";
            resultData = JSON.parse(resultData);
            if(SingleUserID){
                $('.friend').removeClass('active');
                $(`#friend_${SingleUserID}`).addClass('active');
            }else{
                $('#friend').addClass('active');
            }
            ContactArray = resultData.Contact;
            $('#count').html(`${ContactArray.length} Members`);
            let mainUl = document.createElement('ul')
            mainUl.classList.add('contacts','contacts')
            
            let LiTag = `<a style="cursor:pointer" onclick="GetAllData(-1)"  id="Anch">
            <li class="">
                <div class="d-flex bd-highlight align-items-center justtify-content-center w-100 p-2">
                    <div class="img_cont">
                        <img src='/man.png' class="rounded-circle user_img contact_img">
                        <span class="online_icon"></span>
                    </div>
                    <div class="user_info">
                        <span>Dnk Group</span>
                    </div>
                </div>
            </li></a>`
            
           for (let index = 0; index < ContactArray.length; index++) {
               const element = ContactArray[index];
            
            let Name =  element.Name;
            let TotalMHtml = '';
            let boldclass = '';
            if(localStorage.getItem("ID") == element.UserID){
                Name = 'You';
            }
            if(element.TotalM > 0){
                TotalMHtml = `<div class="unreadCount" id="unreadCount_${element.UserID}"><span class="countmessage">${element.TotalM}</span>`;
                boldclass = 'UnReadusername';
            }
            TotalunReadMessage += element.TotalM;
            let LastMessage = element.LastChat.replace('<pre>','').replace('</pre>','');
            // href='?id=${element.UserID}'
            let ActiveClass = "";
            if(element.Status == 0){
                ActiveClass = "activeClass";
            }
            if(element.Profile){

            }
            LiTag += `<a style="cursor:pointer" onclick="GetAllData(${index})"  id="Anch">
                        <li class="friend" id="friend_${element.UserID}">
                            <div class="d-flex bd-highlight align-items-center justtify-content-center w-100 p-2">
                                <div class="img_cont">
                                    <img src='/man2.png' class="rounded-circle user_img contact_img">
                                    <span class="online_icon ${ActiveClass}"></span>
                                </div>
                                <div class="user_info">
                                    <span class="${boldclass}" id="UserNameClass_${element.UserID}">${Name}</span>
                                    <div id="typing_${element.UserID}" class="typing_class text-white"></div>
                                    <div id="last_message_${element.UserID}" class="last_message overme"><small>${LastMessage}</small></div>
                                </div>
                                ${TotalMHtml}
                                </div>
                            </div>
                        </li></a>`
            }
            mainUl.innerHTML = LiTag;
            if(TotalunReadMessage > 0) $('#Title').html(`(${TotalunReadMessage}) Chat`);
            else $('#Title').html(`Chat`);
            contactSection2.appendChild(mainUl)
        }
    });
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

function Logout() {
    OnlineStatusChange();
    setTimeout(() => {
        localStorage.clear();
    }, 100);
    window.location = "/Login";
}

function contactSearch(value) {
    AllContact(value);
}

function ReadMessge(element) {
    let SingleUserID = element.UserID
    if(!element.ID){
        element.ID = localStorage.getItem("ID")
    }
    $.ajax({
        type: 'POST',
        url: MainUrl+'updateread',
        data: { SingleUserID : SingleUserID,
                UserID : element.ID,
                IsRead : element.IsRead
                },
        dataType: "text",
        success: function(resultData) { 
        }
    });
}

function OnlineStatusChange(Data) {
    $.ajax({
        type: 'POST',
        url: MainUrl+'OnlineStatusChange',
        data: Data,
        dataType: "text",
        success: function(resultData) { 
            console.log(resultData);
        }
    });
}

// cd existing_folder
// git init
// git remote add origin https://gitlab.com/d7977/rtaweb.git
// git add .
// git commit -m "Initial commit"
// git push -u origin master