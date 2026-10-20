import { manejarLead } from '../lib/manejar-lead.js';
import { crearCreadorDeLeads } from '../lib/notion.js';

async function atender(request) {
  let cuerpo = null;
  if (request.method === 'POST') {
    try {
      cuerpo = await request.json();
    } catch {
      cuerpo = null;
    }
  }
  const resultado = await manejarLead({
    metodo: request.method,
    origen: request.headers.get('origin'),
    cuerpo,
  }, {
    crearLead: crearCreadorDeLeads({
      token: process.env.NOTION_TOKEN,
      databaseId: process.env.NOTION_DATABASE_ID,
      fetch,
    }),
  });
  return new Response(resultado.body === null ? null : JSON.stringify(resultado.body), {
    status: resultado.status,
    headers: resultado.headers,
  });
}

export async function POST(request) { return atender(request); }
export async function OPTIONS(request) { return atender(request); }
export async function GET(request) { return atender(request); }
