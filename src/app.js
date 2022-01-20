const jsonServer = require('json-server')

const port = 9000

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

server.use(middlewares)
server.use(router)
server.listen(port, () => {
  console.log('JSON Server is running')
})