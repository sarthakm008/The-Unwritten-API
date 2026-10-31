require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin(origin, callback) {
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error('Origin is not allowed by CORS'));
}, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'the-unwritten-api', timestamp: new Date().toISOString() }));
app.get('/api/ready', async (_req, res) => {
  try { if (process.env.IN_MEMORY_MODE !== 'true') await connectDB(); res.json({ status: 'ready', database: process.env.IN_MEMORY_MODE === 'true' ? 'in-memory-demo' : 'connected' }); }
  catch (_error) { res.status(503).json({ status: 'not-ready', database: 'disconnected' }); }
});
app.use('/api/game', gameRoutes);
app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  const port = Number(process.env.PORT || 5000);
  app.listen(port, async () => {
    console.log(`THE UNWRITTEN API listening on port ${port}`);
    if (process.env.IN_MEMORY_MODE !== 'true') {
      try { await connectDB(); console.log('MongoDB connected'); }
      catch (error) { console.error('Initial MongoDB connection failed:', error.message); }
    } else console.warn('IN_MEMORY_MODE enabled: session data will be lost on restart.');
  });
}
module.exports = app;
