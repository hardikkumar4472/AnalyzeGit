const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { createWorker } = require('./worker');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
createWorker(io);
app.set('io', io);

const analyzeRoute = require('./routes/analyzeRoute');
const authRoute = require('./routes/authRoute');

app.use('/api', analyzeRoute);
app.use('/api/auth', authRoute);

app.get('/', (req, res) => {
    res.json({ message: "AnalyzeGit Scaler API is running..." });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
