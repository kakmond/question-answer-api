const sqlite3 = require('sqlite3')
const db = new sqlite3.Database("database.db")

db.run("PRAGMA foreign_keys = ON")

db.run(`
	CREATE TABLE IF NOT EXISTS questions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		accountId INTEGER,
        title TEXT,
        description TEXT,
		createdAt INTEGER,
		FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
	)
`)

db.run(`
	CREATE TABLE IF NOT EXISTS accounts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        password TEXT,
        name TEXT,
		CONSTRAINT unique_username UNIQUE(username)
	)
`)

db.run(`
	CREATE TABLE IF NOT EXISTS answers (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
        questionId INTEGER,
        accountId INTEGER,
        description TEXT,
        createdAt INTEGER,
        FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE
	)
`)

exports.getAllAccounts = function (callback) {
    const query = `SELECT * FROM accounts ORDER BY id desc`
    const values = []
    db.all(query, values, function (error, accounts) {
        callback(error, accounts)
    })
}

exports.getAccountById = function (id, callback) {
    const query = `SELECT * FROM accounts WHERE id = ?`
    const values = [id]
    db.get(query, values, function (error, account) {
        callback(error, account)
    })
}

exports.getAccountByUsername = function (username, callback) {
    const query = `SELECT * FROM accounts WHERE username = ?`
    const values = [username]
    db.get(query, values, function (error, account) {
        callback(error, account)
    })
}

exports.createAccount = function (account, callback) {
    const query = `
		INSERT INTO accounts
			(username, password, name)
		VALUES
			(?, ?, ?)
	`
    const values = [
        account.username,
        account.password,
        account.name,
    ]

    db.run(query, values, function (error) {
        const id = this.lastID
        callback(error, id)
    })
}

exports.updateAccountById = function (id, updatedAccount, callback) {
    const query = `
    UPDATE accounts SET
        name = ?
    WHERE
        id = ?
    `
    const values = [
        updatedAccount.name,
        id
    ]
    db.run(query, values, function (error) {
        const accountExisted = (this.changes == 1)
        callback(error, accountExisted)
    })
}

exports.deleteAccountById = function (id, callback) {
    const query = `DELETE FROM accounts WHERE id = ?`
    const values = [id]
    db.run(query, values, function (error) {
        const accountExisted = (this.changes == 1)
        callback(error, accountExisted)
    })
}

exports.getAllQuestions = function (callback) {
    const query = `
    SELECT
        x.*, u.name
    FROM (
        SELECT
            q.id , q.title, q.createdAt, q.description, q.accountId, COUNT(a.id) AS 'answerCount'
        FROM
            questions q
        LEFT JOIN 
            answers a ON q.id = a.questionId
        GROUP BY
            q.id
    ) x 
    LEFT JOIN
        accounts u ON u.id = x.accountId
    ORDER BY x.createdAt desc
    `
    const values = []
    db.all(query, values, function (error, questions) {
        callback(error, questions)
    })
}

exports.getQuestionById = function (id, callback) {
    const query = `
    SELECT
        x.*, u.name
    FROM (
        SELECT
            q.id , q.title, q.createdAt, q.description, q.accountId, COUNT(a.id) AS 'answerCount'
        FROM
            questions q
        LEFT JOIN 
            answers a ON q.id = a.questionId
        GROUP BY
            q.id
    ) x 
    LEFT JOIN
        accounts u ON u.id = x.accountId
    WHERE 
        x.id = ?
    ORDER BY x.createdAt desc
    `
    const values = [id]
    db.get(query, values, function (error, question) {
        callback(error, question)
    })
}

exports.getQuestionsByAccountId = function (id, callback) {
    const query = `
    SELECT
        x.*, u.name
    FROM (
        SELECT
            q.id , q.title, q.createdAt, q.description, q.accountId, COUNT(a.id) AS 'answerCount'
        FROM
            questions q
        LEFT JOIN 
            answers a ON q.id = a.questionId
        GROUP BY
            q.id
    ) x 
    LEFT JOIN
        accounts u ON u.id = x.accountId
    WHERE 
        x.accountId = ?
    ORDER BY x.createdAt desc
    `
    const values = [id]
    db.all(query, values, function (error, question) {
        callback(error, question)
    })
}

exports.createQuestion = function (question, callback) {
    const query = `
        INSERT INTO questions 
            (accountId, title, description, createdAt) 
        VALUES 
            (?, ?, ?, ?)
    `
    const values = [
        question.accountId,
        question.title,
        question.description,
        question.createdAt
    ]
    db.run(query, values, function (error) {
        const id = this.lastID
        callback(error, id)
    })
}

exports.updateQuestionById = function (id, updatedquestion, callback) {
    const query = `
		UPDATE questions SET
            title = ?,
            description = ?
		WHERE
			id = ?
	`
    const values = [
        updatedquestion.title,
        updatedquestion.description,
        id
    ]

    db.run(query, values, function (error) {
        const questionExisted = (this.changes == 1)
        callback(error, questionExisted)
    })
}

exports.deleteQuestionById = function (id, callback) {
    const query = `DELETE FROM questions WHERE id = ?`
    const values = [id]
    db.run(query, values, function (error) {
        const questionExisted = (this.changes == 1)
        callback(error, questionExisted)
    })
}

exports.createAnswer = function (answer, callback) {
    const query = `
        INSERT INTO answers 
            (questionId, accountId, description, createdAt) 
        VALUES 
            (?, ?, ?, ?)
    `
    const values = [
        answer.questionId,
        answer.accountId,
        answer.description,
        answer.createdAt
    ]
    db.run(query, values, function (error) {
        const id = this.lastID
        callback(error, id)
    })
}

exports.getAnswersByQuestionId = function (id, callback) {
    const query = `
        SELECT 
            a.*, u.username, u.name, u.id AS 'accountId'
        FROM 
            answers a
        JOIN accounts u ON 
            a.accountId = u.id
        WHERE 
            a.questionId = ?
        ORDER BY createdAt desc
    `
    const values = [id]
    db.all(query, values, function (error, question) {
        callback(error, question)
    })
}

exports.getAnswersByAccountId = function (id, callback) {
    const query = `
        SELECT 
            a.*, u.username, u.name, u.id AS 'accountId'
        FROM 
            answers a
        JOIN accounts u ON 
            a.accountId = u.id
    WHERE 
        a.accountId = ?
        ORDER BY createdAt desc
    `
    // const query = `
    // SELECT y.*, a2.name
    // FROM (
    // SELECT
    //     x.*, 
    //     q.description AS 'questionDescription',
    //     q.title AS 'questionTitle',
    //     q.accountId AS 'questionAccountId'
    // FROM (
    //     SELECT 
    //         a.questionId,
    //         a.createdAt AS 'answerCreatedAt',
    //         a.id AS 'answerId', 
    //         a.description AS 'answerDescription',
    //         u.username AS 'answerUsername', 
    //         u.name AS 'answerName', 
    //         u.id AS 'answerAccountId'
    //     FROM 
    //         answers a
    //     JOIN accounts u ON 
    //         a.accountId = u.id
    // ) x
    // JOIN
    //     questions q ON q.id = x.questionId
    // WHERE 
    //     answerAccountId = ?
    // ) y
    // JOIN
    //     accounts a2 ON a2.id = y.questionAccountId
    // ORDER BY y.answerCreatedAt desc
    // `
    const values = [id]
    db.all(query, values, function (error, question) {
        callback(error, question)
    })
}

exports.deleteAnswerById = function (id, callback) {
    const query = `DELETE FROM answers WHERE id = ?`
    const values = [id]
    db.run(query, values, function (error) {
        const answerExisted = (this.changes == 1)
        callback(error, answerExisted)
    })
}

// exports.getAllAnswers = function (callback) {
//     const query = `
//     SELECT
//         x.*, 
//         q.description AS 'questionDescription',
//         q.title AS 'questionTitle',
//     FROM (
//         SELECT 
//             a.questionId,
//             a.createdAt AS 'answerCreatedAt',
//             a.id AS 'answerId', 
//             a.description AS 'answerDescription',
//             u.username AS 'answerUsername', 
//             u.name AS 'answerName', 
//             u.id AS 'answerAccountId'
//         FROM 
//             answers a
//         JOIN accounts u ON 
//             a.accountId = u.id
//     ) x
//     LEFT JOIN
//         questions q ON q.id = x.questionId
//     ORDER BY x.answerCreatedAt desc
// `
//     const values = []
// db.all(query, values, function (error, answers) {
//     callback(error, answers)
// })
// }

exports.getAllAnswers = function (callback) {
    const query = `
    SELECT 
        a.*, u.username, u.name, u.id AS 'accountId'
    FROM 
        answers a
    JOIN accounts u ON 
        a.accountId = u.id
    ORDER BY createdAt desc
`
    const values = []
    db.all(query, values, function (error, answers) {
        callback(error, answers)
    })
}

exports.getAnswerById = function (id, callback) {
    const query = `
    SELECT 
        a.*, u.username, u.name, u.id AS 'accountId'
    FROM 
        answers a
    JOIN accounts u ON 
        a.accountId = u.id
    WHERE 
        a.id = ?
    ORDER BY createdAt desc
`
    const values = [id]
    db.get(query, values, function (error, answer) {
        callback(error, answer)
    })
}

exports.updateAnswerById = function (id, updatedAnswer, callback) {
    const query = `
		UPDATE answers SET
            description = ?
		WHERE
			id = ?
	`
    const values = [
        updatedAnswer.description,
        id
    ]

    db.run(query, values, function (error) {
        const answerExisted = (this.changes == 1)
        callback(error, answerExisted)
    })
}
