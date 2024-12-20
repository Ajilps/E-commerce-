import dotenv from "dotenv"
import {connectDB} from './db/index.js'
import {app} from "./app.js"

dotenv.config({
    path: "./.env"
})

connectDB().then(() => {
    console.log("Database connected")
    app.listen(process.env.PORT || 3000, (err) => {console.log(err ? err : `Server is running on port ${process.env.PORT || 3000}`)})
}).catch((err) => {
    console.log(err)
})
