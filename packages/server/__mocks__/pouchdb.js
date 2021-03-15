function CouchDB() {
  this.post = jest.fn()
  this.allDocs = jest.fn(() => ({ rows: [] }))
  this.put = jest.fn()
  this.remove = jest.fn()
}

module.exports = CouchDB
