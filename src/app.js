import 'dotenv/config'
import JsonServer from 'json-server'
import Cos from 'cos-nodejs-sdk-v5'
import { access, writeFile, readFile } from 'fs/promises'
import chokidar from 'chokidar'

;(async () => {
  const cos = new Cos({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
  })

  const data = await cos.getObject({
    Bucket: process.env.COS_BUCKET,
    Region: process.env.COS_REGION,
    Key: process.env.COS_DB_KEY,
  })

  try {
    await access(process.env.TMP_DB_PATH)
  } catch (error) {
    console.error(error)
    if (error.code === 'ENOENT') {
      await writeFile(process.env.TMP_DB_PATH, data.Body, 'utf8')
    }
  }

  const server = JsonServer.create()
  const router = JsonServer.router(process.env.TMP_DB_PATH)
  const middlewares = JsonServer.defaults()
  server.use(middlewares)
  server.use(router)
  server.listen(process.env.SERVER_PORT, () => {
    console.log('JSON Server is running')
  })
})()

chokidar.watch(process.env.TMP_DB_PATH).on('change', async () => {
  const cos = new Cos({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
  })

  const data = await cos.putObject({
    Bucket: process.env.COS_BUCKET,
    Region: process.env.COS_REGION,
    Key: process.env.COS_DB_KEY,
    Body: await readFile(process.env.TMP_DB_PATH, 'utf8'),
  })

  console.log(data)
})
