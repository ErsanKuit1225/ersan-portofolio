const mysql = {}

const client = {
  connect: jest.fn(),
  query: jest.fn((sql, cb) => cb),
}

mysql.createConnection = jest.fn(() => client)

module.exports = mysql
