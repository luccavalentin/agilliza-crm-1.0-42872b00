/**
 * Consultor IA — assistente de financiamento imobiliário com RAG sobre a base
 * de conhecimento mantida pela equipe (`consultor_ia_base`).
 *
 * A IA NUNCA escreve na base: ela apenas lê os trechos recuperados e responde
 * fundamentada neles. A atualização do conhecimento é curadoria manual feita
 * na tela de administração.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface FonteCitada {
  id: string;
  titulo: string;
  categoria: string;
}

export interface MensagemConsultor {
  id: string;
  papel: "usuario" | "assistente";
  conteudo: string;
  fontes_usadas: FonteCitada[];
  sem_resposta: boolean;
  avaliacao: "util" | "nao_util" | null;
  created_at: string;
}

export interface ConversaConsultor {
  id: string;
  titulo: string;
  updated_at: string;
}

export interface ItemBase {
  id: string;
  categoria: string;
  titulo: string;
  conteudo: string;
  tags: string[];
  ativo: boolean;
  correspondente_id: string | null;
  updated_at: string;
}

export const CATEGORIAS_BASE = [
  "FGTS",
  "SFH_SFI",
  "Bradesco",
  "Santander",
  "Itau",
  "Documentacao",
  "Regulatorio",
  "Duvidas_Frequentes",
] as const;

const STOPWORDS = new Set([
  "a","o","as","os","de","da","do","das","dos","e","em","um","uma","para","por","com","que",
  "qual","quais","como","quando","onde","é","sao","são","no","na","nos","nas","ao","aos","se",
  "sobre","meu","minha","the","of",
]);

function tokens(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

async function correspondenteDoUsuario(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("correspondente_id")
    .eq("id", userId)
    .maybeSingle();
  return data?.correspondente_id ?? null;
}

/** Ranqueia os trechos da base por sobreposição de termos com a pergunta. */
function selecionarTrechos(itens: ItemBase[], pergunta: string, limite = 5): ItemBase[] {
  const termos = tokens(pergunta);
  if (termos.length === 0) return itens.slice(0, limite);
  const pontuados = itens.map((it) => {
    const alvoTitulo = tokens(`${it.titulo} ${it.tags.join(" ")}`);
    const alvoConteudo = tokens(it.conteudo);
    let score = 0;
    for (const t of termos) {
      if (alvoTitulo.some((x) => x.startsWith(t) || t.startsWith(x))) score += 3;
      score += Math.min(alvoConteudo.filter((x) => x === t).length, 4);
    }
    return { it, score };
  });
  return pontuados
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limite)
    .map((p) => p.it);
}

/** Lista as conversas do usuário logado. */
export const listarConversasConsultor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConversaConsultor[]> => {
    const { supabase, userId } = context as any;
    const { data } = await supabase
      .from("consultor_ia_conversas")
      .select("id, titulo, updated_at")
      .eq("usuario_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    return (data ?? []) as ConversaConsultor[];
  });

/** Mensagens de uma conversa (RLS garante que é do próprio usuário). */
export const listarMensagensConsultor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversa_id: string }) =>
    z.object({ conversa_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }): Promise<MensagemConsultor[]> => {
    const { supabase } = context as any;
    const { data: msgs } = await supabase
      .from("consultor_ia_mensagens")
      .select("id, papel, conteudo, fontes_usadas, sem_resposta, avaliacao, created_at")
      .eq("conversa_id", data.conversa_id)
      .order("created_at", { ascending: true });
    return (msgs ?? []).map((m: any) => ({
      ...m,
      fontes_usadas: Array.isArray(m.fontes_usadas) ? m.fontes_usadas : [],
    })) as MensagemConsultor[];
  });

export const excluirConversaConsultor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("consultor_ia_conversas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const avaliarRespostaConsultor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { mensagem_id: string; avaliacao: "util" | "nao_util" | null }) =>
    z
      .object({
        mensagem_id: z.string().uuid(),
        avaliacao: z.enum(["util", "nao_util"]).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase
      .from("consultor_ia_mensagens")
      .update({ avaliacao: data.avaliacao })
      .eq("id", data.mensagem_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Envia uma sugestão de conteúdo (lacuna de conhecimento) para curadoria. */
export const sugerirConteudoBase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pergunta: string; observacao?: string }) =>
    z
      .object({ pergunta: z.string().min(3), observacao: z.string().optional() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const corr = await correspondenteDoUsuario(supabase, userId);
    const { error } = await supabase.from("consultor_ia_sugestoes").insert({
      correspondente_id: corr,
      usuario_id: userId,
      pergunta: data.pergunta,
      observacao: data.observacao ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Conteúdo completo de um item da base (para a citação clicável). */
export const obterItemBase = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<ItemBase | null> => {
    const { supabase } = context as any;
    const { data: row } = await supabase
      .from("consultor_ia_base")
      .select("id, categoria, titulo, conteudo, tags, ativo, correspondente_id, updated_at")
      .eq("id", data.id)
      .maybeSingle();
    return (row as ItemBase) ?? null;
  });

/* ─────────────── Administração da base de conhecimento ─────────────── */

export const listarBaseConhecimento = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d?: { q?: string; categoria?: string; incluirInativos?: boolean }) =>
    z
      .object({
        q: z.string().optional(),
        categoria: z.string().optional(),
        incluirInativos: z.boolean().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<ItemBase[]> => {
    const { supabase } = context as any;
    let q = supabase
      .from("consultor_ia_base")
      .select("id, categoria, titulo, conteudo, tags, ativo, correspondente_id, updated_at")
      .order("categoria", { ascending: true })
      .order("titulo", { ascending: true });
    if (data.categoria && data.categoria !== "todas") q = q.eq("categoria", data.categoria);
    if (!data.incluirInativos) q = q.eq("ativo", true);
    if (data.q && data.q.trim()) {
      const termo = `%${data.q.trim()}%`;
      q = q.or(`titulo.ilike.${termo},conteudo.ilike.${termo}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as ItemBase[];
  });

export const salvarItemBase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      categoria: string;
      titulo: string;
      conteudo: string;
      tags: string[];
      ativo: boolean;
      global: boolean;
    }) =>
      z
        .object({
          id: z.string().uuid().optional(),
          categoria: z.string().min(1),
          titulo: z.string().min(3),
          conteudo: z.string().min(10),
          tags: z.array(z.string()).default([]),
          ativo: z.boolean().default(true),
          global: z.boolean().default(false),
        })
        .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { supabase, userId } = context as any;
    const corr = await correspondenteDoUsuario(supabase, userId);
    const payload = {
      categoria: data.categoria,
      titulo: data.titulo,
      conteudo: data.conteudo,
      tags: data.tags,
      ativo: data.ativo,
      correspondente_id: data.global ? null : corr,
      atualizado_por: userId,
    };
    if (data.id) {
      const { error } = await supabase
        .from("consultor_ia_base")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabase
      .from("consultor_ia_base")
      .insert({ ...payload, criado_por: userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const excluirItemBase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("consultor_ia_base").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listarSugestoesBase = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data } = await supabase
      .from("consultor_ia_sugestoes")
      .select("id, pergunta, observacao, status, created_at")
      .eq("status", "aberta")
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []) as Array<{
      id: string;
      pergunta: string;
      observacao: string | null;
      status: string;
      created_at: string;
    }>;
  });

export const resolverSugestaoBase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "resolvida" | "descartada" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["resolvida", "descartada"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase
      .from("consultor_ia_sugestoes")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ───────────────────────── Consulta (RAG) ───────────────────────── */

const MARCADOR_SEM_INFO = "SEM_INFORMACAO_NA_BASE";

export interface RespostaConsultor {
  conversa_id: string;
  mensagem_id: string;
  resposta: string;
  fontes: FonteCitada[];
  sem_resposta: boolean;
}

export const consultarAssistenteIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversa_id?: string | null; pergunta: string }) =>
    z
      .object({
        conversa_id: z.string().uuid().nullable().optional(),
        pergunta: z.string().min(2).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<RespostaConsultor> => {
    const { supabase, userId } = context as any;
    const corr = await correspondenteDoUsuario(supabase, userId);

    // 1) Conversa
    let conversaId = data.conversa_id ?? null;
    if (!conversaId) {
      const titulo =
        data.pergunta.trim().slice(0, 80) + (data.pergunta.trim().length > 80 ? "…" : "");
      const { data: nova, error } = await supabase
        .from("consultor_ia_conversas")
        .insert({ usuario_id: userId, correspondente_id: corr, titulo })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      conversaId = nova.id as string;
    }

    await supabase.from("consultor_ia_mensagens").insert({
      conversa_id: conversaId,
      papel: "usuario",
      conteudo: data.pergunta,
    });

    // 2) Recupera trechos da base (RLS já limita a global + correspondente)
    const { data: baseRows } = await supabase
      .from("consultor_ia_base")
      .select("id, categoria, titulo, conteudo, tags, ativo, correspondente_id, updated_at")
      .eq("ativo", true)
      .limit(500);
    const trechos = selecionarTrechos((baseRows ?? []) as ItemBase[], data.pergunta, 5);

    // 3) Histórico recente
    const { data: historico } = await supabase
      .from("consultor_ia_mensagens")
      .select("papel, conteudo")
      .eq("conversa_id", conversaId)
      .order("created_at", { ascending: false })
      .limit(7);
    const ultimas = ((historico ?? []) as any[]).slice(1).reverse();

    // 4) Configuração de IA (mesma usada pelo Scan IA)
    const { data: cfgRow } = await supabase
      .from("admin_api_integrations")
      .select("api_key, base_url, config, ativo")
      .eq("correspondente_id", corr)
      .eq("chave", "ia")
      .maybeSingle();
    const cfg = (cfgRow?.config ?? {}) as Record<string, unknown>;
    const provedor: "gemini" | "openai" = cfg.provedor === "openai" ? "openai" : "gemini";
    const modelo =
      typeof cfg.modelo === "string" && cfg.modelo.trim()
        ? cfg.modelo.trim()
        : provedor === "openai"
          ? "gpt-4o-mini"
          : "gemini-2.5-flash";
    const apiKeySalva = typeof cfgRow?.api_key === "string" ? cfgRow.api_key.trim() : "";
    const apiKey =
      apiKeySalva ||
      (provedor === "openai" ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY) ||
      "";
    if (cfgRow && cfgRow.ativo === false) {
      throw new Error("Integração de IA desativada. Ative-a em Admin › APIs de IA.");
    }
    if (!apiKey) {
      throw new Error("Chave da API não cadastrada. Configure-a em Admin › APIs de IA.");
    }

    const referencias = trechos.length
      ? trechos
          .map(
            (t, i) =>
              `--- TRECHO ${i + 1} | id=${t.id} | categoria=${t.categoria} | título="${t.titulo}"\n${t.conteudo}`,
          )
          .join("\n\n")
      : "(nenhum trecho cadastrado na base corresponde a esta pergunta)";

    const historicoTexto = ultimas.length
      ? ultimas
          .map((m: any) => `${m.papel === "usuario" ? "Usuário" : "Consultor"}: ${m.conteudo}`)
          .join("\n")
      : "(sem histórico)";

    const prompt =
      `Você é um consultor especialista em financiamento imobiliário no Brasil (SFH, SFI, FGTS, ` +
      `bancos Bradesco/Santander/Itaú), auxiliando a equipe interna de um correspondente bancário.\n\n` +
      `REGRAS OBRIGATÓRIAS:\n` +
      `1. Responda SEMPRE com base nos TRECHOS DE REFERÊNCIA abaixo.\n` +
      `2. Se a pergunta não for coberta pelos trechos, comece a resposta EXATAMENTE com o marcador ` +
      `${MARCADOR_SEM_INFO} e diga claramente que não há informação cadastrada sobre isso na base da ` +
      `empresa, sugerindo consultar o financeiro/jurídico.\n` +
      `3. NUNCA invente regra, taxa, prazo ou norma que não esteja nos trechos ou que você não tenha ` +
      `certeza absoluta de ser conhecimento estável e amplamente conhecido (ex.: a definição geral de ` +
      `SAC/PRICE pode ser respondida de conhecimento geral; a taxa de juros atual de um banco ` +
      `específico, NÃO).\n` +
      `4. Ao final, em uma última linha isolada, escreva "FONTES: id1, id2" com os ids dos trechos que ` +
      `você realmente usou (ou "FONTES:" vazio se não usou nenhum).\n` +
      `5. Responda em português do Brasil, em markdown, de forma objetiva.\n\n` +
      `TRECHOS DE REFERÊNCIA:\n${referencias}\n\n` +
      `HISTÓRICO RECENTE DA CONVERSA:\n${historicoTexto}\n\n` +
      `PERGUNTA ATUAL: ${data.pergunta}`;

    let texto = "";
    if (provedor === "openai") {
      const baseUrl = (
        (typeof cfgRow?.base_url === "string" && cfgRow.base_url) || "https://api.openai.com/v1"
      ).replace(/\/+$/, "");
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: modelo, messages: [{ role: "user", content: prompt }] }),
      });
      if (!resp.ok) throw new Error(await mensagemErroIa(resp));
      const json = await resp.json();
      texto = json?.choices?.[0]?.message?.content ?? "";
    } else {
      const baseUrl = (
        (typeof cfgRow?.base_url === "string" && cfgRow.base_url) ||
        "https://generativelanguage.googleapis.com"
      ).replace(/\/+$/, "");
      const resp = await fetch(
        `${baseUrl}/v1beta/models/${encodeURIComponent(modelo)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
          }),
        },
      );
      if (!resp.ok) throw new Error(await mensagemErroIa(resp));
      const json = await resp.json();
      texto = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
    }

    // 5) Extrai fontes citadas e limpa marcadores
    const idsCitados = new Set<string>();
    const linhaFontes = texto.match(/^FONTES:\s*(.*)$/im);
    if (linhaFontes) {
      for (const parte of linhaFontes[1].split(/[,\s]+/)) {
        const id = parte.trim();
        if (id && trechos.some((t) => t.id === id)) idsCitados.add(id);
      }
      texto = texto.replace(/^FONTES:.*$/gim, "").trim();
    }
    const semResposta = texto.includes(MARCADOR_SEM_INFO);
    texto = texto.replace(new RegExp(MARCADOR_SEM_INFO, "g"), "").trim();
    if (!texto) texto = "Não consegui gerar uma resposta agora. Tente reformular a pergunta.";

    const fontes: FonteCitada[] = trechos
      .filter((t) => idsCitados.has(t.id))
      .map((t) => ({ id: t.id, titulo: t.titulo, categoria: t.categoria }));

    const { data: msg, error: msgErr } = await supabase
      .from("consultor_ia_mensagens")
      .insert({
        conversa_id: conversaId,
        papel: "assistente",
        conteudo: texto,
        fontes_usadas: fontes,
        sem_resposta: semResposta,
      })
      .select("id")
      .single();
    if (msgErr) throw new Error(msgErr.message);

    await supabase
      .from("consultor_ia_conversas")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversaId);

    return {
      conversa_id: conversaId!,
      mensagem_id: msg.id as string,
      resposta: texto,
      fontes,
      sem_resposta: semResposta,
    };
  });

async function mensagemErroIa(resp: Response): Promise<string> {
  const body = await resp.text();
  if (resp.status === 429) {
    return "Cota da API de IA esgotada. Verifique o plano/billing da chave ou tente mais tarde.";
  }
  if (resp.status === 401 || resp.status === 403) {
    return "Chave da API inválida ou sem permissão. Revise em Admin › APIs de IA.";
  }
  return `Provedor de IA retornou ${resp.status}: ${body.slice(0, 200)}`;
}
