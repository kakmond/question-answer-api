const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const db = require('./db')

const ACCESS_TOKEN_SECRET = "sdfsdsd4flkjdsflkdsj"
const ID_TOKEN_SECRET = "fdkjjlpadfglfd6kyeu"
const NAME_MIN_LENGTH = 4
const NAME_MAX_LENGTH = 20
const USERNAME_MIN_LENGTH = 4
const USERNAME_MAX_LENGTH = 10
const PASSWORD_MIN_LENGTH = 6
const PASSWORD_MAX_LENGTH = 10
const TITLE_MIN_LENGTH = 5
const TITLE_MAX_LENGTH = 50
const DESCRIPTION_MIN_LENGTH = 10
const DESCRIPTION_MAX_LENGTH = 100

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

app.get("/accounts", function (req, res) {
    db.getAllAccounts(function (error, accounts) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else {
            accounts.forEach(account => delete account.password)
            res.status(200).json(accounts)
        }
    })
})

app.get("/accounts/:id", function (req, res) {
    const id = req.params.id
    db.getAccountById(id, function (error, account) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            if (account) {
                delete account.password
                res.status(200).json(account)
            } else
                res.status(404).end()
    })
})

app.post("/accounts", function (req, res) {
    const validationErrors = []
    const username = req.body.username
    const password = req.body.password
    const name = req.body.name

    if (!username)
        validationErrors.push("usernameRequired")
    else if (username.length < USERNAME_MIN_LENGTH)
        validationErrors.push("usernameTooShort")
    else if (username.length > USERNAME_MAX_LENGTH)
        validationErrors.push("usernameTooLong")

    if (!password)
        validationErrors.push("passwordRequired")
    else if (password.length < PASSWORD_MIN_LENGTH)
        validationErrors.push("passwordTooShort")
    else if (password.length > PASSWORD_MAX_LENGTH)
        validationErrors.push("passwordTooLong")

    if (!name)
        validationErrors.push("nameRequired")
    else if (name.length < NAME_MIN_LENGTH)
        validationErrors.push("nameTooShort")
    else if (name.length > NAME_MAX_LENGTH)
        validationErrors.push("nameTooLong")

    if (validationErrors.length > 0) {
        res.status(400).json(validationErrors)
        return
    }

    const account = {
        username,
        password,
        name
    }

    db.createAccount(account, function (error, id) {
        if (error)
            if (error.message == "SQLITE_CONSTRAINT: UNIQUE constraint failed: accounts.username")
                res.status(400).json(["usernameTaken"])
            else {
                console.log(error)
                res.status(500).end()
            }
        else {
            res.setHeader("Location", "/accounts/" + id)
            res.status(201).end()
        }
    })
})

app.put("/accounts/:id", function (req, res) {
    const validationErrors = []
    const id = req.params.id
    const name = req.body.name

    if (!name)
        validationErrors.push("nameRequired")
    else if (name.length < NAME_MIN_LENGTH)
        validationErrors.push("nameTooShort")
    else if (name.length > NAME_MAX_LENGTH)
        validationErrors.push("nameTooLong")

    if (validationErrors.length > 0) {
        res.status(400).json(validationErrors)
        return
    }

    const updatedAccount = {
        name,
    }
    db.updateAccountById(id, updatedAccount, function (error, accountExisted) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            if (!accountExisted)
                res.status(404).end()
            else
                res.status(204).end()
    })
})

app.delete("/accounts/:id", function (req, res) {
    const id = req.params.id
    db.deleteAccountById(id, function (error, accountExisted) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            if (!accountExisted)
                res.status(404).end()
            else
                res.status(204).end()
    })
})

app.get("/posts", function (req, res) {
    db.getAllPosts(function (error, posts) {
        if (error) {
            console.log(error)
            res.status(500).end()
        } else
            res.status(200).json(posts)
    })
})

app.get("/posts/:id", function (req, res) {
    const id = req.params.id
    db.getPostById(id, function (error, post) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            if (post)
                res.status(200).json(post)
            else
                res.status(404).end()
    })
})

app.post("/posts", function (req, res) {
    const validationErrors = []
    const accountId = req.body.accountId
    const title = req.body.title
    const description = req.body.description
    let payload = null

    try {
        const authorizationHeader = req.get("Authorization")
        const accessToken = authorizationHeader.substr("Bearer ".length)
        payload = jwt.verify(accessToken, ACCESS_TOKEN_SECRET)
    }
    catch (e) {
        res.status(401).end()
        return
    }

    if (payload == null || payload.accountId != accountId) {
        res.status(401).end()
        return
    }

    if (!title)
        validationErrors.push("titleRequired")
    else if (title.length < TITLE_MIN_LENGTH)
        validationErrors.push("titleTooShort")
    else if (title.length > TITLE_MAX_LENGTH)
        validationErrors.push("titleTooLong")

    if (!description)
        validationErrors.push("descriptionRequired")
    else if (description.length < DESCRIPTION_MIN_LENGTH)
        validationErrors.push("descriptionTooShort")
    else if (description.length > DESCRIPTION_MAX_LENGTH)
        validationErrors.push("descriptionTooLong")

    if (validationErrors.length > 0) {
        res.status(400).json(validationErrors)
        return
    }

    const post = {
        accountId,
        title,
        description,
        createdAt: new Date().getTime()
    }

    db.createPost(post, function (error, id) {
        if (error)
            if (error.message == "SQLITE_CONSTRAINT: FOREIGN KEY constraint failed")
                res.status(400).json(["accountDoesNotExist"])
            else {
                console.log(error)
                res.status(500).end()
            }
        else {
            res.setHeader("Location", "/posts/" + id)
            res.status(201).end()
        }
    })
})

app.put("/posts/:id", function (req, res) {
    const validationErrors = []
    const id = req.params.id
    const title = req.body.title
    const description = req.body.description
    let payload = null

    try {
        const authorizationHeader = req.get("Authorization")
        const accessToken = authorizationHeader.substr("Bearer ".length)
        payload = jwt.verify(accessToken, ACCESS_TOKEN_SECRET)
    }
    catch (e) {
        res.status(401).end()
        return
    }

    db.getPostById(id, function (error, oldPost) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else {
            if (!oldPost)
                res.status(404).end()
            else {
                if (payload == null || payload.accountId != oldPost.accountId) {
                    res.status(401).end()
                    return
                }

                if (!title)
                    validationErrors.push("titleRequired")
                else if (title.length < TITLE_MIN_LENGTH)
                    validationErrors.push("titleTooShort")
                else if (title.length > TITLE_MAX_LENGTH)
                    validationErrors.push("titleTooLong")

                if (!description)
                    validationErrors.push("descriptionRequired")
                if (description.length < DESCRIPTION_MIN_LENGTH)
                    validationErrors.push("descriptionTooShort")
                else if (description.length > DESCRIPTION_MAX_LENGTH)
                    validationErrors.push("descriptionTooLong")

                if (validationErrors.length > 0) {
                    res.status(400).json(validationErrors)
                    return
                }

                const updatePost = {
                    title,
                    description,
                }

                db.updatePostById(id, updatePost, function (error, postExisted) {
                    if (error) {
                        console.log(error)
                        res.status(500).end()
                    }
                    else
                        if (!postExisted)
                            res.status(404).end()
                        else
                            res.status(204).end()
                })
            }
        }
    })

})

app.delete("/posts/:id", function (req, res) {
    const id = req.params.id
    db.deletePostById(id, function (error, postExisted) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            if (!postExisted)
                res.status(404).end()
            else
                res.status(204).end()
    })
})

app.post("/tokens", function (req, res) {

    const grant_type = req.body.grant_type
    const username = req.body.username
    const password = req.body.password

    if (!grant_type || !username || !password) {
        res.status(400).json({ error: "invalid_request" })
        return
    }

    if (grant_type != "password") {
        res.status(400).json({ error: "unsupported_grant_type" })
        return
    }

    db.getAccountByUsername(username, function (error, account) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else if (!account || account.password != password)
            res.status(400).json({ error: "invalid_client" })
        else {
            const accessToken = jwt.sign({
                accountId: account.id
            }, ACCESS_TOKEN_SECRET)

            const idToken = jwt.sign({
                sub: account.id,
                name: account.name,
                preferred_username: account.username
            }, ID_TOKEN_SECRET)

            res.status(200).json({
                token_type: "Bearer",
                access_token: accessToken,
                id_token: idToken
            })

        }
    })

})


app.listen(3000)