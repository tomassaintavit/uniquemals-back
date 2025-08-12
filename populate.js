import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Leer translations.json
const translations = JSON.parse(fs.readFileSync('./translations.json', 'utf8'));

// Conexión Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Función para obtener todos los animales de Wikipedia (con paginación)
async function obtenerAnimalesDeWikipedia(pais) {
  const categoria = `Categoría:Fauna_endémica_de_${pais.replace(/ /g, '_')}`;
  let cmcontinue = null;
  let animales = [];

  do {
    const url = new URL('https://es.wikipedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('list', 'categorymembers');
    url.searchParams.set('cmtitle', categoria);
    url.searchParams.set('cmlimit', '100');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');
    if (cmcontinue) url.searchParams.set('cmcontinue', cmcontinue);

    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(`❌ Error HTTP en país ${pais}:`, resp.status);
      break;
    }

    const data = await resp.json();
    const miembros = data.query?.categorymembers || [];

    for (const miembro of miembros) {
      const detalles = await obtenerDetallesAnimal(miembro.title);
      if (detalles) {
        animales.push({
          country: pais,
          name: miembro.title,
          description: detalles.descripcion,
          image_url: detalles.foto,
          wikipedia_title: miembro.title
        });
      }
    }

    cmcontinue = data.continue?.cmcontinue || null;
  } while (cmcontinue);

  return animales;
}

// Obtener descripción e imagen de un animal
async function obtenerDetallesAnimal(titulo) {
  const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo)}`;
  const resp = await fetch(url);

  if (!resp.ok) {
    console.warn(`⚠️ No se pudo obtener resumen de: ${titulo}`);
    return null;
  }

  const data = await resp.json();
  return {
    descripcion: data.extract || '',
    foto: data.thumbnail?.source || null
  };
}

// Insertar en Supabase (deja que la UNIQUE constraint maneje duplicados)
async function guardarAnimales(animales) {
  if (!animales.length) return;

  const { error } = await supabase
    .from('animals')
    .insert(animales);

  if (error) {
    if (error.code === '23505') {
      console.log('⚠️ Algunos registros ya existían.');
    } else {
      console.error('❌ Error insertando:', error);
    }
  } else {
    console.log(`✅ Insertados ${animales.length} animales`);
  }
}

// Script principal
(async () => {
  const paises = Object.values(translations); // Nombres en español
  for (const pais of paises) {
    console.log(`\n=== Procesando ${pais} ===`);
    const animales = await obtenerAnimalesDeWikipedia(pais);
    console.log(`Encontrados ${animales.length} animales en ${pais}`);
    await guardarAnimales(animales);
  }
  console.log('\n🎯 Proceso terminado');
})();