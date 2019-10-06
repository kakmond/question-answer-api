const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const db = require('./db')

const ACCESS_TOKEN_SECRET = "eieiza"
const ID_TOKEN_SECRET = "hahaplus"
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
const ANSWER_MIN_LENGTH = 5
const ANSWER_MAX_LENGTH = 100

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
        validationErrors.push("username is required")
    else if (username.length < USERNAME_MIN_LENGTH)
        validationErrors.push("username is too short")
    else if (username.length > USERNAME_MAX_LENGTH)
        validationErrors.push("username is too long")

    if (!password)
        validationErrors.push("password is required")
    else if (password.length < PASSWORD_MIN_LENGTH)
        validationErrors.push("password is too short")
    else if (password.length > PASSWORD_MAX_LENGTH)
        validationErrors.push("password is too Long")

    if (!name)
        validationErrors.push("name is required")
    else if (name.length < NAME_MIN_LENGTH)
        validationErrors.push("name is too short")
    else if (name.length > NAME_MAX_LENGTH)
        validationErrors.push("name is too long")

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
                res.status(400).json(["username is taken"])
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

    db.getAccountById(id, function (error, oldAccount) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else {
            if (!oldAccount)
                res.status(404).end()
            else {
                if (payload == null || payload.accountId != oldAccount.id) {
                    res.status(401).end()
                    return
                }

                if (!name)
                    validationErrors.push("name is required")
                else if (name.length < NAME_MIN_LENGTH)
                    validationErrors.push("name is too short")
                else if (name.length > NAME_MAX_LENGTH)
                    validationErrors.push("name is too long")

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
            }
        }
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

app.get("/questions", function (req, res) {
    db.getAllQuestions(function (error, questions) {
        if (error) {
            console.log(error)
            res.status(500).end()
        } else
            res.status(200).json(questions)
    })
})

app.get("/questions/:id", function (req, res) {
    const id = req.params.id
    db.getQuestionById(id, function (error, question) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            if (question)
                res.status(200).json(question)
            else
                res.status(404).end()
    })
})

app.post("/questions", function (req, res) {
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
        validationErrors.push("title is required")
    else if (title.length < TITLE_MIN_LENGTH)
        validationErrors.push("title is too short")
    else if (title.length > TITLE_MAX_LENGTH)
        validationErrors.push("title is too long")

    if (!description)
        validationErrors.push("description is required")
    else if (description.length < DESCRIPTION_MIN_LENGTH)
        validationErrors.push("description is too Short")
    else if (description.length > DESCRIPTION_MAX_LENGTH)
        validationErrors.push("description is too long")

    if (validationErrors.length > 0) {
        res.status(400).json(validationErrors)
        return
    }

    const question = {
        accountId,
        title,
        description,
        createdAt: new Date().getTime()
    }

    db.createQuestion(question, function (error, id) {
        if (error)
            if (error.message == "SQLITE_CONSTRAINT: FOREIGN KEY constraint failed")
                res.status(400).json(["account doesn't exist"])
            else {
                console.log(error)
                res.status(500).end()
            }
        else {
            res.setHeader("Location", "/questions/" + id)
            res.status(201).end()
        }
    })
})

app.put("/questions/:id", function (req, res) {
    const validationErrors = []
    const id = req.params.id
    const title = req.body.title
    const description = req.body.description
    const accountId = req.body.accountId
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

    db.getQuestionById(id, function (error, oldQuestion) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else {
            if (!oldQuestion)
                res.status(404).end()
            else {
                if (payload == null || payload.accountId != oldQuestion.accountId || payload.accountId != accountId) {
                    res.status(401).end()
                    return
                }

                if (!title)
                    validationErrors.push("title is required")
                else if (title.length < TITLE_MIN_LENGTH)
                    validationErrors.push("title is too short")
                else if (title.length > TITLE_MAX_LENGTH)
                    validationErrors.push("title is too long")

                if (!description)
                    validationErrors.push("description is required")
                else if (description.length < DESCRIPTION_MIN_LENGTH)
                    validationErrors.push("description is too short")
                else if (description.length > DESCRIPTION_MAX_LENGTH)
                    validationErrors.push("description is too long")

                if (validationErrors.length > 0) {
                    res.status(400).json(validationErrors)
                    return
                }

                const updateQuestion = {
                    title,
                    description,
                }

                db.updateQuestionById(id, updateQuestion, function (error, questionExisted) {
                    if (error) {
                        console.log(error)
                        res.status(500).end()
                    }
                    else
                        if (!questionExisted)
                            res.status(404).end()
                        else
                            res.status(204).end()
                })
            }
        }
    })

})

app.delete("/questions/:id", function (req, res) {
    const id = req.params.id
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

    db.getQuestionById(id, function (error, oldQuestion) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else {
            if (!oldQuestion)
                res.status(404).end()
            else {
                if (payload == null || payload.accountId != oldQuestion.accountId) {
                    res.status(401).end()
                    return
                }

                db.deleteQuestionById(id, function (error, questionExisted) {
                    if (error) {
                        console.log(error)
                        res.status(500).end()
                    }
                    else
                        if (!questionExisted)
                            res.status(404).end()
                        else
                            res.status(204).end()
                })
            }
        }
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

app.get("/questions/:id/answers", function (req, res) {
    const id = req.params.id
    db.getAnswersByQuestionId(id, function (error, answer) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            res.status(200).json(answer)
    })
})

app.get("/accounts/:id/answers", function (req, res) {
    const id = req.params.id
    db.getAnswersByAccountId(id, function (error, account) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            res.status(200).json(account)
    })
})

app.get("/accounts/:id/questions", function (req, res) {
    const id = req.params.id
    db.getQuestionsByAccountId(id, function (error, account) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            res.status(200).json(account)
    })
})

app.get("/answers", function (req, res) {
    db.getAllAnswers(function (error, answers) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            res.status(200).json(answers)
    })
})

app.get("/answers/:id", function (req, res) {
    const id = req.params.id
    db.getAnswerById(id, function (error, answer) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            if (answer)
                res.status(200).json(answer)
            else
                res.status(404).end()
    })
})

app.post("/answers", function (req, res) {
    const validationErrors = []
    const questionId = req.body.questionId
    const accountId = req.body.accountId
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

    if (!description)
        validationErrors.push("description is required")
    else if (description.length < ANSWER_MIN_LENGTH)
        validationErrors.push("description is too short")
    else if (description.length > ANSWER_MAX_LENGTH)
        validationErrors.push("description is too long")

    if (validationErrors.length > 0) {
        res.status(400).json(validationErrors)
        return
    }

    const answer = {
        accountId,
        questionId,
        description,
        createdAt: new Date().getTime()
    }

    db.createAnswer(answer, function (error, id) {
        if (error)
            if (error.message == "SQLITE_CONSTRAINT: FOREIGN KEY constraint failed")
                res.status(400).json(["account doesn't exist, or question doesn't exist"])
            else {
                console.log(error)
                res.status(500).end()
            }
        else {
            res.setHeader("Location", "/answers/" + id)
            res.status(201).end()
        }
    })
})

app.delete("/answers/:id", function (req, res) {
    const id = req.params.id
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

    db.getAnswerById(id, function (error, oldAnswer) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else {
            if (!oldAnswer)
                res.status(404).end()
            else {
                if (payload == null || payload.accountId != oldAnswer.accountId) {
                    res.status(401).end()
                    return
                }

                db.deleteAnswerById(id, function (error, answerExisted) {
                    if (error) {
                        console.log(error)
                        res.status(500).end()
                    }
                    else
                        if (!answerExisted)
                            res.status(404).end()
                        else
                            res.status(204).end()
                })
            }
        }
    })
})

app.put("/answers/:id", function (req, res) {
    const validationErrors = []
    const id = req.params.id
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

    db.getAnswerById(id, function (error, oldAnswer) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else {
            if (!oldAnswer)
                res.status(404).end()
            else {
                if (payload == null || payload.accountId != oldAnswer.accountId) {
                    res.status(401).end()
                    return
                }

                if (!description)
                    validationErrors.push("description is required")
                else if (description.length < ANSWER_MIN_LENGTH)
                    validationErrors.push("description is too short")
                else if (description.length > ANSWER_MAX_LENGTH)
                    validationErrors.push("description is too long")

                if (validationErrors.length > 0) {
                    res.status(400).json(validationErrors)
                    return
                }

                const updateAnswer = {
                    description,
                }

                db.updateAnswerById(id, updateAnswer, function (error, answerExisted) {
                    if (error) {
                        console.log(error)
                        res.status(500).end()
                    }
                    else
                        if (!answerExisted)
                            res.status(404).end()
                        else
                            res.status(204).end()
                })
            }
        }
    })

})

app.listen(3000)