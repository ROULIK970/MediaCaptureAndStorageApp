import connectDB from "./db/index.js";
import dotenv from 'dotenv'
import {app} from './app.js'


dotenv.config({
    path:"./env"
})


//executing database connection
connectDB()
.then(
    app.listen(process.env.PORT || 3000, () =>{
        console.log(`You are listening on port: ${process.env.PORT}`)
    })
)
.catch((err) => {
    console.log("MongoDB connection error", err)
})