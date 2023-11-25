const express = require('express')
const app = express()
const http = require('http').createServer(app)
const mysql = require('mysql');
const sqlhelper = require('././public/sqlhelper');
var bodyParser = require("body-parser");
var currentdate = new Date(); 
const moment = require('moment');
var sockets = {'id' : 0};


const PORT = process.env.PORT || 2023

app.use(bodyParser.json({limit: '50mb'})); 

// Body Parser Middleware
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 1000000}));

http.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})

app.use(express.static(__dirname + '/public'))

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    next();
});

// app.use(cors({ origin: true }));
// app.UseCors(CorsOptions.AllowAll);



// app.get('/chat', (req, res) => {
//     res.sendFile(__dirname + '/index.html')
// })

// app.get('/old', (req, res) => {
//     res.sendFile(__dirname + '/index1.html')
// })

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index2.html')
})

// app.get('/new', (req, res) => {
//     res.sendFile(__dirname + '/index.html')
// })

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/Login.html')
})
app.get('/checkpass', (req, res) => {
})

// app.get('/chat/:id', (req, res) => {
//     console.log(req.params);
//     res.sendFile(__dirname + '/SingleChat.html')
// })

app.post('/Add', async (req, res) => {
    let SendID = 0;
    let request = req.body;
    let resp = {
        'Data' : {},
        'Message' : 'Something went wrong',
        'Status' : '0'
    };
    let name = request.name.trim();
    let password = request.password.trim();
    if(request.isReg && (name && password)){
        let query = `select * from userlist as ul  where ul.Name=?`
        // console.log(query);
        UserData = await sqlhelper.select(query, [name], (err, res) => {
            if (err) {
                console.log(err); 
                return -1;
            }else if(res.length > 0){
                resp.Message = 'username allready exits';
                resp.Status = '0';
                return 0;
            }else{
                return -1;
            }
        });
        if(UserData == -1){
            let MData = {};
            MData['Name'] = name;
            MData['password'] = password;
            MData['EntryDate'] = moment().format('YYYY-MM-DD HH:mm:ss')
        
            let ID = await sqlhelper.insert('userlist', MData, async (err, res) => {
                if (err) {
                    console.log(err); 
                    return '0';
                }else if(res.insertId){
                    resp.Message = 'Registration successfully';
                    resp.Status = '1';
                    let query = `select * from userlist as ul  where ul.UserID=?`
                    UserData = await sqlhelper.select(query, [res.insertId], (err, res) => {
                        if (err) {
                            console.log(err); 
                            return -1;
                        }else{
                            resp.Data = res[0];
                            resp.Message = 'Login successfully';
                            resp.Status = '1';
                            return -1;
                        }
                    });
                    return res.insertId;
                }else{
                    return '0';
                }
            });
            SendID = ID;
            resp.Data.UserID = ID;
        }
        // console.log("ID--" + ID);
    }
    res.send({resp:resp})
})

app.post('/checkUsername', async (req, res) => {
    let SendID = 0;
    let request = req.body;
    let UserData = -1;
    let resp = {
        'Data' : {},
        'Message' : 'Something went wrong',
        'Status' : '0'
    };
    if(!request.isReg){
        let query = `select * from userlist as ul  where ul.Name=? AND ul.password=?`
        // console.log(query);
        UserData = await sqlhelper.select(query, [request.name,request.password], async (err, res) => {
            if (err) {
                console.log(err); 
                return -1;
            }else if(res.length > 0){
                SendID = res[0].UserID
                resp.Data = res[0];
                resp.Message = 'Login successfully';
                resp.Status = '1';
                if(SendID){
                    let Data = await sqlhelper.update('userlist',{'Status':'1'},{'UserID':SendID}, (err, res) => {
                    });
                }
                return res[0];
            }else{
                resp.Message = 'Invalid username password';
                return -1;
            }
        });
    }
    res.send({resp:resp})
})

app.post('/GetData', async (req, res) => {
    // console.log(req.body);
    let where = ""
    let SingleUserID = req.body.SingleUserID;
    let UserID = req.body.UserID;
    if(SingleUserID && SingleUserID!=0){
        where += ` AND (ch.RecID = ${SingleUserID} AND ch.UserID = ${UserID}) OR (ch.RecID = ${UserID}  AND ch.UserID = ${SingleUserID})`
    }else{
        where += ` AND ch.RecID = 0`  
    }
    let query = `select ch.IsRead,ch.ChatID,ch.UserID,ch.RecID,ch.Message,DATE_FORMAT(ch.Date,"%k:%i") as Date,ul.UserID,ul.Name,ul.EntryDate,ul.Status from chating as ch left join userlist as ul on ul.UserID=ch.UserID where 1 ${where}`
    // console.log(query);
    let Data = await sqlhelper.select(query, [], (err, res) => {
        if (err) {
            console.log(err); return '0';
        }
        return res;
    });

    // if(SingleUserID && SingleUserID!=0){
    //     let Data = await sqlhelper.update('chating',{'IsRead':'1'},{'RecID':UserID,'UserID':SingleUserID}, (err, res) => {
            
    //     });
    // }
    // console.log("ID--" + ID);
    res.send({Chat:Data})
})

app.post('/check', async (req, res) => {
    let query = `select * from userlist where 1 AND UserID = ?`
    let Data = await sqlhelper.select(query, [req.body.name], (err, resp) => {
        if (err) {
            return -1;
        }else if(resp.length > 0){
            // sockets['id'] = resp[0].UserID;
            return 1;
        }else{
            return -1;
        }
    });
    if(req.body.name){
        let Data = await sqlhelper.update('chating',{'IsRead':'2'},{'RecID':req.body.name,'IsRead':'0'}, (err, res) => {
        });
    }
    // console.log("ID--" + ID);
    res.send({Status:Data})
})

app.post('/AllContact', async (req, res) => {
    // let where = `ORDER BY CASE WHEN UserID = '${req.body.UserID}' THEN 1 ELSE 2 END, UserID`;
    // let query = `select * from userlist where 1 ${where}`
    let Unread = `(select count(*) from chating as c where c.RecID = '${req.body.UserID}' AND c.UserID = ul.UserID AND c.IsRead = '0')`;
    let Allread = `(select count(*) from chating as c where ((c.RecID = '${req.body.UserID}' AND c.UserID = ul.UserID) OR (c.RecID = ul.UserID AND c.UserID = '${req.body.UserID}')))`;
    let where = `AND ul.UserID != '${req.body.UserID}'`;
    let having = ``;
    if(req.body.Search!=""){
        where += ` AND ul.Name like '%${req.body.Search}%'`;
    }else{
        having = `Having Allmessage > 0`
    }
    // where += `ORDER BY CASE WHEN UserID = '${req.body.UserID}' THEN 1 ELSE 2 END, ChatID DESC`;
    let query = `SELECT ul.*,${Unread} as TotalM,${Allread} as Allmessage,
    IFNULL((select Message from chating as c where ((c.RecID = '${req.body.UserID}' AND c.UserID = ul.UserID) OR (c.RecID = ul.UserID AND c.UserID = '${req.body.UserID}')) ORDER by ChatID DESC LIMIT 1),'') as LastChat, 
    (select ChatID from chating as c where ((c.RecID = '${req.body.UserID}' AND c.UserID = ul.UserID) OR (c.RecID = ul.UserID AND c.UserID = '${req.body.UserID}')) ORDER by ChatID DESC LIMIT 1) as ChatID
    FROM userlist as ul  where 1 ${where} ${having} ORDER BY ChatID DESC`
    
    let Data = await sqlhelper.select(query, [], (err, res) => {
        if (err) {
            console.log(err); return '0';
        }
        return res;
    });
    // console.log("ID--" + ID);
    res.send({Contact:Data})
})

app.post('/updateread', async (req, res) => {
    // console.log(req.body);
    let SingleUserID = req.body.SingleUserID;
    let UserID = req.body.UserID;
    let IsRead = '1';
    if(req.body.IsRead){
        IsRead = req.body.IsRead;
    }
    console.log("IsRead -->", IsRead);
    if(SingleUserID && SingleUserID!=0){
        let Data = await sqlhelper.update('chating',{'IsRead':IsRead},{'RecID':UserID,'UserID':SingleUserID}, (err, res) => {
            
        });
    }
    res.send({update:1})
})

app.post('/OnlineStatusChange', async (req, res) => {
    let UserID = req.body.UserID;
    if(UserID){
        let Data = await sqlhelper.update('userlist',req.body,{'UserID':UserID}, (err, res) => {
            
        });
    }
    res.send({update:1})
})

// Socket 
const io = require('socket.io')(http)

io.on('connection', async (socket) => {

    socket.on('join', function(room) {
        socket.join(room);
        let joindata = {
            UserID : room,
            SocketID : socket.id,
            Status : '1'
        }
        socket.broadcast.emit('join', joindata)
    });
    
    console.log('Connected...' ,socket.id); // x8WIv7-mJelg7on_ALbx
    // if(sockets['id']){
    //     let Data = await sqlhelper.update('userlist',{'Status':'1',SocketID:socket.id},{'UserID':sockets['id']}, (err, res) => {
    //     });
    // }
    
    
    socket.on('message', async (msg) => {
        // sockets['id'] = msg.id;
        let MData = {};
        MData['UserID'] = msg.id;
        MData['RecID'] = msg.RecID;
        MData['Message'] = msg.message;
        MData['Date'] = moment().format('YYYY-MM-DD HH:mm:ss')
        // console.log(MData);
        await sqlhelper.insert('chating', MData, (err, res) => {
            if (err) {
                console.log(err); return '0';
            }
            return res.insertId;
        });
        socket.broadcast.emit('message', msg)
    })

    socket.on('Notification', async (msg) => {
        socket.broadcast.emit('Notification', msg)
    })

    socket.on('WritingEvent', async (name) => {
        socket.broadcast.emit('WritingEvent', name)
    })

    socket.on('receve', async (id) => {
        socket.broadcast.emit('receve', id)
    })

    socket.on('disconnect', async function() {
        // console.log(socket.id);
        let Data = await sqlhelper.update('userlist',{'Status':'0'},{'SocketID':socket.id}, (err, res) => {
            console.log(res);
        });
        console.log('dis-Connected...' ,socket.id);
        socket.broadcast.emit('disc','1')
    });
})

const DB = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: '',
    database: 'test',
    // connectionLimit: 10, // unlimited queueing
    // multipleStatements: true,
});

DB.getConnection(function(err, connection) {
	if (err) {
		console.log('sql not connected...');
		return false;
	}
	console.log('sql connected... ');
});

DB.on('error', function(err) {
  console.log("DB ERROR : " + err);
})

// SELECT (select Message from chating as c where c.RecID = ul.UserID AND c.UserID = 2 ORDER by ChatID DESC LIMIT 1) as LastChat, (select ChatID from chating as c where c.RecID = ul.UserID AND c.UserID = 1 ORDER by ChatID DESC LIMIT 1) as ChatID, Name FROM `userlist` as ul ORDER by ChatID desc;


