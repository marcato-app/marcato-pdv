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

Guarda o valor do frete/motoboy e uma observação livre que sai no PDF do
cliente. Os dois valem pro orçamento inteiro e ficam repetidos em todas as
linhas do mesmo `grupo_venda` — na soma, o frete é contado uma vez por grupo.

Sem isso: os campos aparecem na tela, mas o app avisa que não conseguiu salvar
os dois e grava o resto normalmente.

```sql
alter table vendas_fornecedor
  add column if not exists valor_frete numeric not null default 0,
  add column if not exists observacoes text;
```

