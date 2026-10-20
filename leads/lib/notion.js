function texto(valor) {
  return valor ? [{ text: { content: valor } }] : [];
}

export function propiedadesNotion(lead) {
  return {
    Empresa: { title: texto(lead.empresa) },
    Nombre: { rich_text: texto(lead.nombre) },
    Correo: { email: lead.correo },
    WhatsApp: { phone_number: lead.whatsapp },
    Colaboradores: { select: { name: lead.colaboradores } },
    Mensaje: { rich_text: texto(lead.mensaje) },
    Página: { rich_text: texto(lead.pagina) },
    UTM: { rich_text: texto(lead.utm) },
    Estado: { status: { name: 'Nuevo' } },
  };
}

export function crearCreadorDeLeads({ token, databaseId, fetch: fetchNativo }) {
  return async (lead) => {
    const respuesta = await fetchNativo('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parent: { database_id: databaseId }, properties: propiedadesNotion(lead) }),
    });
    if (respuesta.ok) return;
    let codigo = '';
    try {
      const error = await respuesta.json();
      if (typeof error?.code === 'string') codigo = ` ${error.code}`;
    } catch {
      // La respuesta de error puede no incluir JSON.
    }
    throw new Error(`notion ${respuesta.status}${codigo}`);
  };
}
