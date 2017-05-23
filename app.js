const express = require('express');
const http = require('http');
const DB = require('./connect.js');

const bodyParser = require('body-parser');
const crypto = require('crypto');
const session = require('express-session');

const app = express();

//基本设置
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(session({
    secret: 'yunhan',
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 300 * 600
    }
}));

app.set('view engine', 'hbs');
app.set('views', './static');

function md5(data) {
    return crypto.createHash('md5').update(data).digest('hex');
}


//注册
app.post('/user/sign', (request, response) => {
    console.log(request.body);
    let username = request.body.username;
    let password = request.body.password;

    password = md5(password);

    DB.query('INSERT INTO users set ?', {
        username: username,
        password: password
    }, (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            response.redirect('http://localhost:3000/login.html');
            request.session.username = username;
        }
    });
});


//登录
app.post('/user/login', (request, response) => {
    console.log(request.body);

    let username = request.body.username;
    let password = request.body.password;

    password = md5(password);

    DB.query('SELECT password FROM users WHERE username = ?', username, (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            if (rows[0].password === password) {
                request.session.username = username;
                response.redirect('http://localhost:3000/');
                response.render('index', {
                    name: username
                });
            } else {
                response.send('Incorrect password');
            }
        }
    });

});



//评论
app.post('/user/comment/creat', (request, response) => {

    console.log(request.body);
    let username = request.session.username;
    let content = request.body.content;

    DB.query('INSERT INTO msg set ?', {
        username: username,
        content: content
    }, (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            console.log('success');
            response.redirect('http://localhost:3000/');
        }
    });

});


//查看我的评论
app.get('/user/comment/show', (request, response) => {
    console.log(request.body);
    let username = request.session.username;

    DB.query('SELECT * FROM msg WHERE username = ?', username, (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            response.render('user/comment_show', {
                rows: rows,
                name: username
            });
        }
    });
});


//主页
app.all('/', (request, response) => {

    let username = request.session.username;

    if (checkStatus(request,response)) {
        DB.query('SELECT * FROM msg', (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                response.render('index', {
                    rows: rows,
                    name: username || 'deafault'
                });
                console.log('success');
            }
        });
    } else {
        response.redirect('http://localhost:3000/login.html');
    }

});

const checkStatus = (request, response) => {
    let username = request.session.username;
    if (username !== undefined) {
        return true;
    } else {
        response.redirect('http://localhost:3000/login.html');
        return false;
    }
}

http.createServer(app).listen(3000);