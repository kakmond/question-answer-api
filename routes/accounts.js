const express = require('express')
const db = require('../db')
const app = express.Router()
const bcrypt = require('bcryptjs')
const HASHING_ROUNDS = 8
const NAME_MIN_LENGTH = 4
const NAME_MAX_LENGTH = 20
const USERNAME_MIN_LENGTH = 4
const USERNAME_MAX_LENGTH = 10
const PASSWORD_MIN_LENGTH = 6
const PASSWORD_MAX_LENGTH = 10

app.get("/", function (req, res) {
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

app.post("/", function (req, res) {
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
    const hashPassward = bcrypt.hashSync(password, HASHING_ROUNDS)
    const account = {
        username,
        password: hashPassward,
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

app.get("/:id", function (req, res) {
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

app.put("/:id", function (req, res) {
    const validationErrors = []
    const id = req.params.id
    const name = req.body.name
    const accountId = req.accountId

    db.getAccountById(id, function (error, oldAccount) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else {
            if (!oldAccount)
                res.status(404).end()
            else {
                if (accountId == null || accountId != oldAccount.id) {
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

app.get("/:id/answers", function (req, res) {
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

app.get("/:id/questions", function (req, res) {
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

module.exports = app