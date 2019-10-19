const express = require('express')
const db = require('../db')
const app = express.Router()

const ANSWER_MIN_LENGTH = 5
const ANSWER_MAX_LENGTH = 100

app.get("/", function (req, res) {
    db.getAllAnswers(function (error, answers) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            res.status(200).sendData(answers)
    })
})

app.post("/", function (req, res) {
    const validationErrors = []
    const questionId = req.body.questionId
    const description = req.body.description
    const accountId = req.accountId

    if (accountId == null) {
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
        res.status(400).sendData(validationErrors)
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
                res.status(400).sendData(["account doesn't exist, or question doesn't exist"])
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

app.delete("/:id", function (req, res) {
    const id = req.params.id
    const accountId = req.accountId

    db.getAnswerById(id, function (error, oldAnswer) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else {
            if (!oldAnswer)
                res.status(404).end()
            else {
                if (accountId == null || accountId != oldAnswer.accountId) {
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

app.get("/:id", function (req, res) {
    const id = req.params.id
    db.getAnswerById(id, function (error, answer) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else
            if (answer)
                res.status(200).sendData(answer)
            else
                res.status(404).end()
    })
})

app.put("/:id", function (req, res) {
    const validationErrors = []
    const id = req.params.id
    const description = req.body.description
    const accountId = req.accountId

    db.getAnswerById(id, function (error, oldAnswer) {
        if (error) {
            console.log(error)
            res.status(500).end()
        }
        else {
            if (!oldAnswer)
                res.status(404).end()
            else {
                if (accountId == null || accountId != oldAnswer.accountId) {
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
                    res.status(400).sendData(validationErrors)
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

module.exports = app