// index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
// app.use(cors());
//Para prod
app.use(cors({
  origin: ["http://localhost:5173", "https://uniquemals.vercel.app/"],
  credentials: true
}));
app.use(express.json()); 

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);


app.get("/animales/:pais", async (req, res) => {
  const  pais  = req.params.pais;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const { data, error } = await supabase
      .from("animals")
      .select("*", { count: "exact" }) // 👈 count para saber cuántos hay en total
      .eq("country", pais)
      .order("id", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      animals: data,
      total: data?.length > 0 ? data[0].count : 0, // ⚠️ algunos drivers de supabase requieren otra query para el total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al traer animales" });
  }
});

app.post("/add-animal", async (req, res) => {
  const { name, description, image_url, country } = req.body;
  

  const { data, error } = await supabase
    .from("animals")
    .insert([{ name, description, image_url, country, wikipedia_title: name }]);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// Obtener un animal por id
app.get("/animal/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("animals")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Eliminar un animal
app.delete("/animal/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("animals")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Actualizar un animal por id
app.put("/animal/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, image_url } = req.body;

  const { data, error } = await supabase
    .from("animals")
    .update({ name, description, image_url })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});