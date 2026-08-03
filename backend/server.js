import app from './app.js'
import connectDB from './config/db.js'

await connectDB();
const PORT = process.env.PORT
app.listen(PORT, () => console.log(`Server running on Port : ${PORT}`))
