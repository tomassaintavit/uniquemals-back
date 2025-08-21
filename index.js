// index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json()); 

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

app.post("/add-animal", async (req, res) => {
  const { name, description, image_url, country } = req.body;
  

  const { data, error } = await supabase
    .from("animals")
    .insert([{ name, description, image_url, country, wikipedia_title: name }]);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});