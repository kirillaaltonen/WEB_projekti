import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
console.log('HSL key loaded:', process.env.HSL_API_KEY);
console.log('Key length:', process.env.HSL_API_KEY?.length);
const app = express();

app.use(cors());       // ← ADD THIS
app.use(express.json());

const PORT = 3000;

app.post('/api/route', async (req, res) => {
  try {
    const response = await fetch('https://api.digitransit.fi/routing/v2/hsl/gtfs/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'digitransit-subscription-key': process.env.HSL_API_KEY
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
