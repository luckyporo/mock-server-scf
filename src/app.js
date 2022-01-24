import 'dotenv/config'
import JsonServer from 'json-server'
import Cos from 'cos-nodejs-sdk-v5'
import { access, writeFile, readFile } from 'fs/promises'
import chokidar from 'chokidar'

const cos = new Cos({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
})

;(async () => {
  try {
    await access(process.env.TMP_DB_PATH)
  } catch (error) {
    console.error(error)
    if (error.code === 'ENOENT') {
      const dbData = await cos.getObject({
        Bucket: process.env.COS_BUCKET,
        Region: process.env.COS_REGION,
        Key: process.env.COS_DB_KEY,
      })
      await writeFile(process.env.TMP_DB_PATH, dbData.Body, 'utf8')
    } else {
      throw new Error('读取db.json失败')
    }
  }

  try {
    await access(process.env.TMP_ROUTES_PATH)
  } catch (error) {
    console.error(error)
    if (error.code === 'ENOENT') {
      const routesData = await cos.getObject({
        Bucket: process.env.COS_BUCKET,
        Region: process.env.COS_REGION,
        Key: process.env.COS_ROUTES_KEY,
      })
      await writeFile(process.env.TMP_ROUTES_PATH, routesData.Body, 'utf8')
    } else {
      throw new Error('读取routes.json失败')
    }
  }

  const server = JsonServer.create()

  server.use(JsonServer.rewriter(JSON.parse(await readFile(process.env.TMP_ROUTES_PATH, 'utf8'))))
  server.use(JsonServer.router(process.env.TMP_DB_PATH))
  server.use(JsonServer.defaults())

  server.listen(process.env.SERVER_PORT, () => {
    console.log('JSON Server is running')
  })
})()

chokidar.watch(process.env.TMP_DB_PATH).on('change', async () => {
  try {
    await cos.putObject({
      Bucket: process.env.COS_BUCKET,
      Region: process.env.COS_REGION,
      Key: process.env.COS_DB_KEY,
      Body: await readFile(process.env.TMP_DB_PATH, 'utf8'),
    })
  } catch (error) {
    console.error(error)
  }
})
