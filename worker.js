var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
import html from "./marcato-pdv.html";
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var SUPABASE_URL = "https://epxvhuvfwpiwvwoygmfo.supabase.co";
var SUPABASE_ANON_KEY = "sb_publishable_12hl4FKRADnoxRkXLd3cIw_9LjKUI7k";
var MP_API = "https://api.mercadopago.com";
var TRIAL_DIAS = 3;
var TOLERANCIA_ATRASO_DIAS = 3;
var VALOR_MENSAL = 100;
var EMAIL_AVISO = "contato@marcatoapp.com.br";
var EMAIL_ADMIN = "contato@marcatoapp.com.br";
async function enviarEmail(env, destinatario, assunto, corpo) {
  if (!env.RESEND_API_KEY || !destinatario) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: "Marcato PDV <onboarding@resend.dev>",
        to: [destinatario],
        subject: assunto,
        text: corpo
      })
    });
  } catch (e) {
  }
}
__name(enviarEmail, "enviarEmail");
__name2(enviarEmail, "enviarEmail");
function enviarEmailAviso(env, assunto, corpo) {
  return enviarEmail(env, EMAIL_AVISO, assunto, corpo);
}
__name(enviarEmailAviso, "enviarEmailAviso");
__name2(enviarEmailAviso, "enviarEmailAviso");
function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}
__name(jsonResponse, "jsonResponse");
__name2(jsonResponse, "jsonResponse");
function bearerFromRequest(request) {
  const auth = request.headers.get("Authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}
__name(bearerFromRequest, "bearerFromRequest");
__name2(bearerFromRequest, "bearerFromRequest");
async function getUserFromToken(token) {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY }
  });
  if (!resp.ok) return null;
  return resp.json();
}
__name(getUserFromToken, "getUserFromToken");
__name2(getUserFromToken, "getUserFromToken");
function serviceHeaders(env) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "content-type": "application/json"
  };
}
__name(serviceHeaders, "serviceHeaders");
__name2(serviceHeaders, "serviceHeaders");
async function sbSelect(env, table, query) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: serviceHeaders(env) });
  if (!resp.ok) return [];
  return resp.json();
}
__name(sbSelect, "sbSelect");
__name2(sbSelect, "sbSelect");
async function sbInsert(env, table, body) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(body)
  });
  return resp.json();
}
__name(sbInsert, "sbInsert");
__name2(sbInsert, "sbInsert");
async function sbUpdate(env, table, query, body) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(body)
  });
  return resp.json();
}
__name(sbUpdate, "sbUpdate");
__name2(sbUpdate, "sbUpdate");
async function autenticarEBuscarEmpresa(request, env) {
  const token = bearerFromRequest(request);
  if (!token) return { erro: jsonResponse({ error: "N\xE3o autenticado" }, 401) };
  const user = await getUserFromToken(token);
  if (!user || !user.id) return { erro: jsonResponse({ error: "Token inv\xE1lido" }, 401) };
  const empresas = await sbSelect(env, "empresas", `user_id=eq.${user.id}&select=id,email,razao_social`);
  const empresa = Array.isArray(empresas) ? empresas[0] : null;
  if (!empresa) return { erro: jsonResponse({ error: "Empresa n\xE3o encontrada" }, 404) };
  return { user, empresa };
}
__name(autenticarEBuscarEmpresa, "autenticarEBuscarEmpresa");
__name2(autenticarEBuscarEmpresa, "autenticarEBuscarEmpresa");
async function autenticarAdmin(request) {
  const token = bearerFromRequest(request);
  if (!token) return { erro: jsonResponse({ error: "N\xE3o autenticado" }, 401) };
  const user = await getUserFromToken(token);
  if (!user || !user.id) return { erro: jsonResponse({ error: "Token inv\xE1lido" }, 401) };
  if ((user.email || "").toLowerCase() !== EMAIL_ADMIN.toLowerCase()) {
    return { erro: jsonResponse({ error: "Acesso restrito" }, 403) };
  }
  return { user };
}
__name(autenticarAdmin, "autenticarAdmin");
__name2(autenticarAdmin, "autenticarAdmin");
async function adminOverview(request, env) {
  const { erro } = await autenticarAdmin(request);
  if (erro) return erro;
  const [empresas, assinaturas] = await Promise.all([
    sbSelect(env, "empresas", "select=id,email,razao_social,segmento"),
    sbSelect(env, "assinaturas", "select=*")
  ]);
  const porEmpresa = /* @__PURE__ */ new Map((Array.isArray(assinaturas) ? assinaturas : []).map((a) => [a.empresa_id, a]));
  const linhas = (Array.isArray(empresas) ? empresas : []).map((emp) => {
    const a = porEmpresa.get(emp.id) || null;
    return {
      empresaId: emp.id,
      email: emp.email,
      razaoSocial: emp.razao_social,
      segmento: emp.segmento,
      status: a ? a.status : "sem_assinatura",
      trialFim: a ? a.trial_fim : null,
      pagamentoFalhouEm: a ? a.pagamento_falhou_em : null,
      atualizadoEm: a ? a.atualizado_em : null
    };
  });
  const ativas = linhas.filter((l) => l.status === "ativa").length;
  const atrasadas = linhas.filter((l) => l.status === "atrasada").length;
  const mesAtual = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  const canceladasEsteMes = linhas.filter((l) => l.status === "cancelada" && l.atualizadoEm && l.atualizadoEm.startsWith(mesAtual)).length;
  const resumo = {
    total: linhas.length,
    trial: linhas.filter((l) => l.status === "trial").length,
    ativas,
    atrasadas,
    canceladas: linhas.filter((l) => l.status === "cancelada").length,
    mrr: ativas * VALOR_MENSAL,
    mrrEmRisco: atrasadas * VALOR_MENSAL,
    canceladasEsteMes
  };
  return jsonResponse({ resumo, empresas: linhas });
}
__name(adminOverview, "adminOverview");
__name2(adminOverview, "adminOverview");
async function adminEnviarEmail(request, env, ctx) {
  const { erro } = await autenticarAdmin(request);
  if (erro) return erro;
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "JSON inv\xE1lido" }, 400);
  }
  const { grupo, assunto, corpo } = body;
  if (!assunto || !corpo) return jsonResponse({ error: "Falta assunto ou corpo" }, 400);
  const [empresas, assinaturas] = await Promise.all([
    sbSelect(env, "empresas", "select=id,email"),
    sbSelect(env, "assinaturas", "select=empresa_id,status")
  ]);
  const statusPorEmpresa = /* @__PURE__ */ new Map((Array.isArray(assinaturas) ? assinaturas : []).map((a) => [a.empresa_id, a.status]));
  const destinatarios = (Array.isArray(empresas) ? empresas : []).filter((emp) => {
    if (!emp.email) return false;
    if (!grupo || grupo === "todas") return true;
    const status = statusPorEmpresa.get(emp.id) || "sem_assinatura";
    return status === grupo;
  }).map((emp) => emp.email);
  const tarefas = destinatarios.map((email) => enviarEmail(env, email, assunto, corpo));
  const todas = Promise.all(tarefas);
  if (ctx) ctx.waitUntil(todas);
  else await todas;
  return jsonResponse({ enviados: destinatarios.length });
}
__name(adminEnviarEmail, "adminEnviarEmail");
__name2(adminEnviarEmail, "adminEnviarEmail");
var DIAS_POR_DURACAO = { "30dias": 30, "3meses": 90, "6meses": 180, "1ano": 365 };
async function adminLiberarAcesso(request, env) {
  const { erro } = await autenticarAdmin(request);
  if (erro) return erro;
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "JSON inv\xE1lido" }, 400);
  }
  const { empresaId, duracao } = body;
  if (!empresaId || !duracao) return jsonResponse({ error: "Falta empresaId ou dura\xE7\xE3o" }, 400);
  if (duracao !== "vitalicio" && !DIAS_POR_DURACAO[duracao]) {
    return jsonResponse({ error: "Dura\xE7\xE3o inv\xE1lida" }, 400);
  }
  const agora = /* @__PURE__ */ new Date();
  let patch;
  if (duracao === "vitalicio") {
    patch = { status: "ativa", pagamento_falhou_em: null, atualizado_em: agora.toISOString() };
  } else {
    const fim = new Date(agora.getTime() + DIAS_POR_DURACAO[duracao] * 24 * 60 * 60 * 1e3);
    patch = { status: "trial", trial_inicio: agora.toISOString(), trial_fim: fim.toISOString(), pagamento_falhou_em: null, atualizado_em: agora.toISOString() };
  }
  const existentes = await sbSelect(env, "assinaturas", `empresa_id=eq.${empresaId}`);
  if (Array.isArray(existentes) && existentes[0]) {
    await sbUpdate(env, "assinaturas", `empresa_id=eq.${empresaId}`, patch);
  } else {
    const [empresa] = await sbSelect(env, "empresas", `id=eq.${empresaId}&select=user_id`);
    if (!empresa) return jsonResponse({ error: "Empresa n\xE3o encontrada" }, 404);
    await sbInsert(env, "assinaturas", { user_id: empresa.user_id, empresa_id: empresaId, ...patch });
  }
  return jsonResponse({ ok: true });
}
__name(adminLiberarAcesso, "adminLiberarAcesso");
__name2(adminLiberarAcesso, "adminLiberarAcesso");
async function iniciarTrial(request, env, ctx) {
  const { erro, user, empresa } = await autenticarEBuscarEmpresa(request, env);
  if (erro) return erro;
  const existentes = await sbSelect(env, "assinaturas", `empresa_id=eq.${empresa.id}`);
  if (Array.isArray(existentes) && existentes[0]) return jsonResponse(existentes[0]);
  const agora = /* @__PURE__ */ new Date();
  const trialFim = new Date(agora.getTime() + TRIAL_DIAS * 24 * 60 * 60 * 1e3);
  const criadas = await sbInsert(env, "assinaturas", {
    user_id: user.id,
    empresa_id: empresa.id,
    status: "trial",
    trial_inicio: agora.toISOString(),
    trial_fim: trialFim.toISOString()
  });
  const nova = Array.isArray(criadas) ? criadas[0] : criadas;
  if (!nova || !nova.id) return jsonResponse({ error: "N\xE3o consegui iniciar o teste gr\xE1tis" }, 500);
  const avisoDono = enviarEmailAviso(
    env,
    "\u{1F195} Novo cadastro no Marcato PDV",
    `${empresa.razao_social || "(sem raz\xE3o social ainda)"} come\xE7ou o teste gr\xE1tis de ${TRIAL_DIAS} dias.
E-mail: ${empresa.email}`
  );
  const boasVindas = enviarEmail(
    env,
    empresa.email,
    "Bem-vindo(a) ao Marcato PDV! \u{1F389}",
    `Oi, ${empresa.razao_social || "tudo bem"}!

Seu cadastro no Marcato PDV foi feito com sucesso. Voc\xEA tem ${TRIAL_DIAS} dias de teste gr\xE1tis pra usar o sistema completo \u2014 PDV, fluxo de caixa, boletos e tudo mais.

Depois do teste, a assinatura \xE9 R$ ${VALOR_MENSAL}/m\xEAs.

Qualquer d\xFAvida, \xE9 s\xF3 responder esse e-mail.

Equipe Marcato PDV`
  );
  const tarefas = Promise.all([avisoDono, boasVindas]);
  if (ctx) ctx.waitUntil(tarefas);
  else await tarefas;
  return jsonResponse(nova);
}
__name(iniciarTrial, "iniciarTrial");
__name2(iniciarTrial, "iniciarTrial");
async function criarAssinatura(request, env) {
  const { erro, user, empresa } = await autenticarEBuscarEmpresa(request, env);
  if (erro) return erro;
  const mpResp = await fetch(`${MP_API}/preapproval`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({
      reason: "Marcato PDV - assinatura mensal",
      external_reference: empresa.id,
      payer_email: empresa.email,
      auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: VALOR_MENSAL, currency_id: "BRL" },
      back_url: "https://pdv.marcatoapp.com.br/",
      status: "pending"
    })
  });
  const mpData = await mpResp.json();
  if (!mpResp.ok || !mpData.init_point) {
    return jsonResponse({ error: "Erro ao criar assinatura no Mercado Pago", detalhe: mpData }, 502);
  }
  await sbUpdate(env, "assinaturas", `empresa_id=eq.${empresa.id}`, {
    mp_preapproval_id: mpData.id,
    atualizado_em: (/* @__PURE__ */ new Date()).toISOString()
  });
  return jsonResponse({ init_point: mpData.init_point });
}
__name(criarAssinatura, "criarAssinatura");
__name2(criarAssinatura, "criarAssinatura");
async function webhookMercadoPago(request, env, ctx) {
  let payload = {};
  try {
    payload = await request.json();
  } catch (e) {
    return new Response("ok", { status: 200 });
  }
  const preapprovalId = payload?.data?.id || payload?.id;
  if (!preapprovalId) return new Response("ok", { status: 200 });
  const mpResp = await fetch(`${MP_API}/preapproval/${preapprovalId}`, {
    headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` }
  });
  if (!mpResp.ok) return new Response("ok", { status: 200 });
  const preapproval = await mpResp.json();
  const empresaId = preapproval.external_reference;
  if (!empresaId) return new Response("ok", { status: 200 });
  const statusMap = { authorized: "ativa", paused: "atrasada", cancelled: "cancelada", pending: "trial" };
  const novoStatus = statusMap[preapproval.status] || "atrasada";
  const patch = { status: novoStatus, atualizado_em: (/* @__PURE__ */ new Date()).toISOString() };
  if (novoStatus === "atrasada") patch.pagamento_falhou_em = (/* @__PURE__ */ new Date()).toISOString();
  if (novoStatus === "ativa") patch.pagamento_falhou_em = null;
  await sbUpdate(env, "assinaturas", `empresa_id=eq.${empresaId}`, patch);
  if (novoStatus === "ativa" || novoStatus === "atrasada") {
    const [empresa] = await sbSelect(env, "empresas", `id=eq.${empresaId}&select=email,razao_social`);
    const nome = empresa?.razao_social || "tudo bem";
    const tarefas = [];
    if (novoStatus === "ativa") {
      tarefas.push(enviarEmailAviso(
        env,
        "\u{1F4B0} Nova assinatura paga no Marcato PDV",
        `${empresa?.razao_social || "(sem raz\xE3o social)"} confirmou o pagamento \u2014 R$ ${VALOR_MENSAL}/m\xEAs.
E-mail: ${empresa?.email || "?"}`
      ));
      tarefas.push(enviarEmail(
        env,
        empresa?.email,
        "Pagamento confirmado \u2705",
        `Oi, ${nome}!

Recebemos a confirma\xE7\xE3o do seu pagamento \u2014 sua assinatura do Marcato PDV est\xE1 ativa. Obrigado por continuar com a gente!

Equipe Marcato PDV`
      ));
    } else {
      tarefas.push(enviarEmail(
        env,
        empresa?.email,
        "N\xE3o conseguimos confirmar seu pagamento \u26A0\uFE0F",
        `Oi, ${nome}!

N\xE3o conseguimos confirmar o pagamento da sua assinatura do Marcato PDV. Voc\xEA tem ${TOLERANCIA_ATRASO_DIAS} dias pra regularizar antes que o acesso seja bloqueado.

Entra no sistema e clica em "Assinar agora" pra tentar de novo.

Equipe Marcato PDV`
      ));
    }
    const todas = Promise.all(tarefas);
    if (ctx) ctx.waitUntil(todas);
    else await todas;
  }
  return new Response("ok", { status: 200 });
}
__name(webhookMercadoPago, "webhookMercadoPago");
__name2(webhookMercadoPago, "webhookMercadoPago");
async function avisarTrialsAcabando(env) {
  const agora = /* @__PURE__ */ new Date();
  const em24h = new Date(agora.getTime() + 24 * 60 * 60 * 1e3);
  const pendentes = await sbSelect(
    env,
    "assinaturas",
    `status=eq.trial&lembrete_trial_enviado=eq.false&trial_fim=gte.${agora.toISOString()}&trial_fim=lte.${em24h.toISOString()}`
  );
  for (const a of pendentes) {
    const [empresa] = await sbSelect(env, "empresas", `id=eq.${a.empresa_id}&select=email,razao_social`);
    if (empresa?.email) {
      await enviarEmail(
        env,
        empresa.email,
        "Seu teste gr\xE1tis do Marcato PDV acaba amanh\xE3",
        `Oi, ${empresa.razao_social || "tudo bem"}!

Seu teste gr\xE1tis de ${TRIAL_DIAS} dias termina amanh\xE3. Pra continuar usando o Marcato PDV sem interrup\xE7\xE3o, assine por R$ ${VALOR_MENSAL}/m\xEAs direto no sistema.

Equipe Marcato PDV`
      );
    }
    await sbUpdate(env, "assinaturas", `id=eq.${a.id}`, { lembrete_trial_enviado: true });
  }
}
__name(avisarTrialsAcabando, "avisarTrialsAcabando");
__name2(avisarTrialsAcabando, "avisarTrialsAcabando");
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/iniciar-trial" && request.method === "POST") return iniciarTrial(request, env, ctx);
    if (url.pathname === "/api/criar-assinatura" && request.method === "POST") return criarAssinatura(request, env);
    if (url.pathname === "/api/webhook-mercadopago" && request.method === "POST") return webhookMercadoPago(request, env, ctx);
    if (url.pathname === "/api/admin/overview" && request.method === "GET") return adminOverview(request, env);
    if (url.pathname === "/api/admin/enviar-email" && request.method === "POST") return adminEnviarEmail(request, env, ctx);
    if (url.pathname === "/api/admin/liberar-acesso" && request.method === "POST") return adminLiberarAcesso(request, env);
    return new Response(html, {
      headers: { "content-type": "text/html; charset=UTF-8" }
    });
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(avisarTrialsAcabando(env));
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
