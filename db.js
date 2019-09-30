const sqlite3 = require('sqlite3')
const db = new sqlite3.Database("database.db")

db.run("PRAGMA foreign_keys = ON")

db.run(`
	CREATE TABLE IF NOT EXISTS posts (
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

exports.getAllAccounts = function (callback) {
    const query = `SELECT * FROM accounts ORDER BY id`
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

exports.getAllPosts = function (callback) {
    const query = `SELECT * FROM posts ORDER BY createdAt`
    const values = []
    db.all(query, values, function (error, posts) {
        callback(error, posts)
    })
}

exports.getPostById = function (id, callback) {
    const query = `SELECT * FROM posts WHERE id = ?`
    const values = [id]
    db.get(query, values, function (error, post) {
        callback(error, post)
    })
}

exports.createPost = function (post, callback) {
    const query = `
        INSERT INTO posts 
            (accountId, title, description, createdAt) 
        VALUES 
            (?, ?, ?, ?)
    `
    const values = [
        post.accountId,
        post.title,
        post.description,
        post.createdAt
    ]
    db.run(query, values, function (error) {
        const id = this.lastID
        callback(error, id)
    })
}

exports.updatePostById = function (id, updatedPost, callback) {
    const query = `
		UPDATE posts SET
            title = ?,
            description = ?
		WHERE
			id = ?
	`
    const values = [
        updatedPost.title,
        updatedPost.description,
        id
    ]

    db.run(query, values, function (error) {
        const postExisted = (this.changes == 1)
        callback(error, postExisted)
    })
}

exports.deletePostById = function (id, callback) {
    const query = `DELETE FROM posts WHERE id = ?`
    const values = [id]
    db.run(query, values, function (error) {
        const postExisted = (this.changes == 1)
        callback(error, postExisted)
    })
}