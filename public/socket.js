// Recieve messages 
socket.on('message', (msg) => {
    let type = '0';
    if(!SingleUserID){
        if(msg.RecID == 0){
            appendMessage(msg, `incoming`)
        }
    }else{
        msg['user'] = "";
        if(msg.id == SingleUserID && msg.RecID == localStorage.getItem("ID")){
            type = '1';
            socket.emit('receve', {id : msg.RecID,type:type});
            appendMessage(msg, `incoming`)
        }
    }
    AllContact();
    getAttention('message', 50, 10, 1.2);
    setTimeout(() => {
        $(`#friend_${SingleUserID}`).addClass('active');
        $(`#unreadCount_${SingleUserID}`).html('');
        $(`#UserNameClass_${SingleUserID}`).removeClass();
    }, 500);
    scrollToBottom()
    msg.UserID = msg.id;
    msg.IsRead = '2';
    ReadMessge(msg)
    if(msg.id != SingleUserID && msg.RecID == localStorage.getItem("ID")){
        type = '2';
        socket.emit('receve', {id : msg.RecID,type:type});
    }
    getAttention('message', 50, 10, 1.2);
})

socket.on('Notification', (Name) => {
    
    let mainDiv = document.createElement('div')
    // let className = type
    mainDiv.classList.add('Newuser', 'Newuser')
    let markup = "";
    if(!SingleUserID){
        markup = `<p class='NewUserTag'> <img src="https://img.icons8.com/office/30/000000/checked-user-male--v1.png"/> ${Name} has joined </p>`;
    }
    mainDiv.innerHTML = markup
    messageArea.appendChild(mainDiv)
    scrollToBottom()
    setTimeout(() => {
        AllContact();
    }, 500);
})

socket.on('WritingEvent', function(Obj) {
    console.log("Obj --- > ", Obj);
    let classId = parseInt(Obj.MyId);
    let Name = Obj.Name;
    let tmping =  `${Name} is typing
    <img class="typing-gif" src="/Images/typing-dots.gif">`;
    typingArea.innerHTML = "";
    $(`.typing_class`).html('');
    console.log(`#typing_${classId}`);
    if(Name){
        let tmphtml = `${tmping}`;
        if(!SingleUserID && Obj.RecId == 0){
            typingArea.innerHTML = tmphtml;
            $(`#typing_${classId}`).html('');
        }else{
            if(Obj.RecId == localStorage.getItem("ID")) $(`#typing_${classId}`).html(`<img class="typing-gif" src="/Images/typing-dots.gif">`);
            if(Obj.RecId == localStorage.getItem("ID")  && classId == SingleUserID){
                $(`#typing_${classId}`).html('');
                typingArea.innerHTML = tmphtml;
            }
        }
    }
    scrollToBottom()
})

socket.on('join', (Data) => {
    console.log("ata ==",Data);
    OnlineStatusChange(Data);
})

socket.on('receve', (element) => {
    let id = element.id;
    let type = element.type ? element.type : '0';
    if(type == '1'){
        $(`.IsReadID_${id}`).html('<span><i class="fa fa-check-double icon-theme text-success"></i></span>');
    }else if(type == '2'){
        $(`.IsReadID_${id}`).html('<span><i class="fa fa-check-double icon-theme text-secondary"></i></span>');
    }
})


/* 
********************************************************************
*   __      __ ___ __      __  ____  __  __
    \ \    / /|_ _|\ \    / / |  __| | |/ /
     \ \  / /  | |  \ \  / /  | |_   |   /            
      \ \/ /   | |   \ \/ /   |  _|  |    
       \__/   |___|   \__/    |  |_  | | \ \
                              |____| | |  | |                 
********************************************************************
*/
