const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const db = require('./db')
const accountsRouter = require('./routes/accounts')
const questionsRouter = require('./routes/questions')
const answersRouter = require('./routes/answers')
const xmlparser = require('express-xml-bodyparser');
const easyxml = require('easyxml');
const serializer = new easyxml({
    singularize: true,
    rootElement: 'response',
    dateFormat: 'ISO',
    manifest: true
});
const ACCESS_TOKEN_SECRET = "eieiza"
const ID_TOKEN_SECRET = "hahaplus"

app.use(xmlparser({ explicitArray: false, explicitRoot: false }));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))

app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE")
    if (req.header("Access-Control-Request-Headers"))
        res.setHeader("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"))
    res.setHeader("Access-Control-Expose-Headers", "Location")
    next()
})

app.use(function (req, res, next) {
    try {
        const authorizationHeader = req.get("Authorization")
        const accessToken = authorizationHeader.substr("Bearer ".length)
        jwt.verify(accessToken, ACCESS_TOKEN_SECRET, function (error, payload) {
            if (error)
                console.log(error)
            else
                req.accountId = payload.accountId
            next()
        })
    } catch (error) {
        next()
    }
})

app.use(function (req, res, next) {
    res.sendData = function (obj) {
        if (req.accepts('application/json')) {
            res.header('Content-Type', 'application/json');
            res.send(obj);
        } else if (req.accepts('application/xml')) {
            res.header('Content-Type', 'application/xml');
            const xml = serializer.render(obj);
            res.send(xml);
        } else {
            // Send back the resource in JSON default format.
            res.header('Content-Type', 'application/json');
            res.send(obj);
        }
    };
    next();
});

app.use("/accounts", accountsRouter)
app.use("/questions", questionsRouter)
app.use("/answers", answersRouter)

app.post("/tokens", function (req, res) {
    const grant_type = req.body.grant_type
    const username = req.body.username
    const password = req.body.password

    if (!grant_type || !username || !password) {
        res.status(400).sendData({ error: "invalid_request" })
        return
    }

    if (grant_type != "password") {
        res.status(400).sendData({ error: "unsupported_grant_type" })
        return
    }

    db.getAccountByUsername(username, function (error, account) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else if (!account || !bcrypt.compareSync(password, account.password))
            res.status(400).sendData({ error: "invalid_client" })
        else {
            const accessToken = jwt.sign({
                accountId: account.id
            }, ACCESS_TOKEN_SECRET)

            const idToken = jwt.sign({
                sub: account.id,
                name: account.name,
                preferred_username: account.username
            }, ID_TOKEN_SECRET)

            res.status(200).sendData({
                token_type: "Bearer",
                access_token: accessToken,
                id_token: idToken
            })
        }
    })
})

app.listen(3000)