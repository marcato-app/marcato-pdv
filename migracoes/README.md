# Migrações do Supabase

SQL que precisa ser rodado no **SQL Editor** do Supabase pra liberar recursos do app.
Todas usam `IF NOT EXISTS`, então rodar duas vezes não faz mal.

Ordem não importa — são independentes.

## 1. Metas financeiras na empresa

Guarda a meta de lucro e a meta de venda mensal no cadastro, pra não precisar
digitar toda vez no Painel e no Simulador de boleto.

Sem isso: a seção "Metas financeiras" em Configurações não salva.

```sql
alter table empresas
  add column if not exists meta_lucro_mensal numeric,
  add column if not exists meta_venda_mensal numeric;
```

## 2. Orçamento na Venda Fornecedor

Faz a venda de fornecedor nascer como orçamento e só virar venda depois de
aprovada (quando o IMEI de cada aparelho é informado).

Sem isso: o app continua funcionando, mas toda venda entra direto como
aprovada e a tela avisa que a coluna está faltando.

```sql
alter table vendas_fornecedor
  add column if not exists status text not null default 'aprovada';

-- Linhas antigas são vendas de verdade, feitas antes desse fluxo existir:
-- ficam como 'aprovada' pelo default acima. Só o que for criado a partir
-- de agora nasce como 'orcamento'.

alter table vendas_fornecedor
  drop constraint if exists vendas_fornecedor_status_check;

alter table vendas_fornecedor
  add constraint vendas_fornecedor_status_check
  check (status in ('orcamento', 'aprovada'));

create index if not exists vendas_fornecedor_status_idx
  on vendas_fornecedor (status);
```

## 3. Frete e observação na Venda Fornecedor

Guarda o valor do frete/motoboy e uma observação interna da loja. O frete sai
no PDF do cliente; a observação **não** — ela só aparece no histórico, pra
loja. Os dois valem pro orçamento inteiro e ficam repetidos em todas as linhas
do mesmo `grupo_venda` — na soma, o frete é contado uma vez por grupo.

Sem isso: os campos aparecem na tela, mas o app avisa que não conseguiu salvar
os dois e grava o resto normalmente.

```sql
alter table vendas_fornecedor
  add column if not exists valor_frete numeric not null default 0,
  add column if not exists observacoes text;
```


## 4. Nota fiscal anexada na Venda Fornecedor

Deixa anexar o PDF ou a foto da nota fiscal de compra em cada venda (botão
"anexar nota fiscal" no histórico da Venda Fornecedor). Vale pra venda inteira
e fica repetida em todas as linhas do mesmo `grupo_venda`, igual ao frete.

Os arquivos ficam num bucket **privado** (`notas-fiscais`): nota tem CNPJ/CPF e
valores, então não tem link público. Cada loja só enxerga a pasta da própria
empresa. O app abre a nota por um link que expira em 1 hora.

Sem isso: o botão aparece, mas ao anexar o app avisa que falta rodar esta migração.

```sql
alter table vendas_fornecedor
  add column if not exists notas_fiscais jsonb not null default '[]'::jsonb;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notas-fiscais', 'notas-fiscais', false, 10485760,
        array['application/pdf','image/jpeg','image/png','image/heic','image/heif','image/webp'])
on conflict (id) do update set public = false;

-- Caminho do arquivo: <empresa_id>/<venda>/<arquivo>. A primeira pasta tem que
-- ser uma empresa do usuário logado.
drop policy if exists "notas fiscais: ler da propria empresa" on storage.objects;
create policy "notas fiscais: ler da propria empresa" on storage.objects
  for select to authenticated
  using (bucket_id = 'notas-fiscais' and (storage.foldername(name))[1] in
         (select id::text from public.empresas where user_id = auth.uid()));

drop policy if exists "notas fiscais: enviar pra propria empresa" on storage.objects;
create policy "notas fiscais: enviar pra propria empresa" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'notas-fiscais' and (storage.foldername(name))[1] in
              (select id::text from public.empresas where user_id = auth.uid()));

drop policy if exists "notas fiscais: apagar da propria empresa" on storage.objects;
create policy "notas fiscais: apagar da propria empresa" on storage.objects
  for delete to authenticated
  using (bucket_id = 'notas-fiscais' and (storage.foldername(name))[1] in
         (select id::text from public.empresas where user_id = auth.uid()));
```
