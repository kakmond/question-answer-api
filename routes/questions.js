const express = require('express')
const db = require('../db')
const app = express.Router()

const TITLE_MIN_LENGTH = 5
const TITLE_MAX_LENGTH = 50
const DESCRIPTION_MIN_LENGTH = 10
const DESCRIPTION_MAX_LENGTH = 100

app.get("/", function (req, res) {
    db.getAllQuestions(function (error, questions) {
        if (error) {
            console.log(error)
            res.status(500).end()
        } else
            res.status(200).sendData(questions)
    })
})

app.post("/", function (req, res) {
    const validationErrors = []
    const accountId = req.accountId
    const title = req.body.title
    const description = req.body.description

    if (accountId == null) {
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
        res.status(400).sendData(validationErrors)
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
                res.status(400).sendData(["account doesn't exist"])
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

app.get("/:id", function (req, res) {
    const id = req.params.id
    db.getQuestionById(id, function (error, question) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            if (question)
                res.status(200).sendData(question)
            else
                res.status(404).end()
    })
})

app.put("/:id", function (req, res) {
    const validationErrors = []
    const id = req.params.id
    const title = req.body.title
    const description = req.body.description
    const accountId = req.accountId


    db.getQuestionById(id, function (error, oldQuestion) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else {
            if (!oldQuestion)
                res.status(404).end()
            else {
                if (accountId == null || accountId != oldQuestion.accountId) {
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
                    res.status(400).sendData(validationErrors)
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

app.delete("/:id", function (req, res) {
    const id = req.params.id
    const accountId = req.accountId

    db.getQuestionById(id, function (error, oldQuestion) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else {
            if (!oldQuestion)
                res.status(404).end()
            else {
                if (accountId == null || accountId != oldQuestion.accountId) {
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

app.get("/:id/answers", function (req, res) {
    const id = req.params.id
    db.getAnswersByQuestionId(id, function (error, answer) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            res.status(200).sendData(answer)
    })
})

module.exports = app