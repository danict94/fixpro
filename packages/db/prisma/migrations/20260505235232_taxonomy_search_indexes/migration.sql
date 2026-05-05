-- Taxonomy search performance indexes.
-- Supports public hero/funnel taxonomy search and smart suggestions.
-- No schema/data changes: indexes only.

CREATE INDEX IF NOT EXISTS "interventi_attivo_ordine_idx"
ON "interventi" ("attivo", "ordine");

CREATE INDEX IF NOT EXISTS "categorie_attivo_ordine_idx"
ON "categorie" ("attivo", "ordine");

CREATE INDEX IF NOT EXISTS "servizi_attivo_ordine_idx"
ON "servizi" ("attivo", "ordine");

CREATE INDEX IF NOT EXISTS "servizi_categoria_attivo_ordine_idx"
ON "servizi" ("categoriaId", "attivo", "ordine");

CREATE INDEX IF NOT EXISTS "interventi_alias_gin_idx"
ON "interventi" USING GIN ("alias");

CREATE INDEX IF NOT EXISTS "interventi_search_terms_gin_idx"
ON "interventi" USING GIN ("searchTerms");

CREATE INDEX IF NOT EXISTS "categorie_alias_gin_idx"
ON "categorie" USING GIN ("alias");

CREATE INDEX IF NOT EXISTS "categorie_search_terms_gin_idx"
ON "categorie" USING GIN ("searchTerms");

CREATE INDEX IF NOT EXISTS "servizi_alias_gin_idx"
ON "servizi" USING GIN ("alias");

CREATE INDEX IF NOT EXISTS "servizi_search_terms_gin_idx"
ON "servizi" USING GIN ("searchTerms");

CREATE INDEX IF NOT EXISTS "matching_intervento_cat_categoria_attivo_priorita_idx"
ON "matching_intervento_cat" ("categoriaId", "attivo", "priorita");

CREATE INDEX IF NOT EXISTS "matching_intervento_cat_intervento_attivo_priorita_idx"
ON "matching_intervento_cat" ("interventoId", "attivo", "priorita");

CREATE INDEX IF NOT EXISTS "matching_intervento_servizio_servizio_attivo_priorita_idx"
ON "matching_intervento_servizio" ("servizioId", "attivo", "priorita");

CREATE INDEX IF NOT EXISTS "matching_intervento_servizio_intervento_attivo_priorita_idx"
ON "matching_intervento_servizio" ("interventoId", "attivo", "priorita");
