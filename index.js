// index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Ruta para obtener animales de un país
app.get('/animales/:pais', async (req, res) => {
  const pais = req.params.pais;

  const { data, error } = await supabase
    .from('animals')
    .select('*')
    .eq('country', pais)
    .order('name', { ascending: true });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al consultar la base de datos' });
  }

  res.json(data);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});