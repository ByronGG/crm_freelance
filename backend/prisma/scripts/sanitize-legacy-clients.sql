-- ============================================================================
-- Saneamiento de filas legacy sin cliente
-- ----------------------------------------------------------------------------
-- Prepara los datos para la migración "contract" que pone NOT NULL en el eje
-- cliente (Project.contactId, Invoice.contactId, Proposal.contactId).
--
-- ESTO NO ES UNA MIGRACIÓN DE PRISMA: son operaciones de datos puntuales de
-- este entorno. Ejecútalo por PASOS, revisando cada uno. El PASO 2 requiere
-- decisiones tuyas (qué cliente corresponde a cada proyecto).
--
-- Uso:
--   docker exec -i crm_db psql -U crm -d crm_freelance < este-archivo.sql
-- o pegando cada paso en `npx prisma studio` / psql.
-- ============================================================================


-- ─────────────────────────── PASO 0 · Reporte previo ────────────────────────
-- Debe coincidir con lo que esperas antes de tocar nada.

SELECT 'proyectos sin cliente' AS entidad, count(*) FROM "Project"  WHERE "contactId" IS NULL
UNION ALL
SELECT 'facturas sin cliente',            count(*) FROM "Invoice"  WHERE "contactId" IS NULL
UNION ALL
SELECT 'propuestas sin cliente',          count(*) FROM "Proposal" WHERE "contactId" IS NULL;


-- ──────────────── PASO 1 · Purgar cuentas de prueba con huérfanos ───────────
-- DESTRUCTIVO E IRREVERSIBLE: borrar un User elimina EN CASCADA todos sus
-- datos (contactos, proyectos, facturas, propuestas...).
--
-- Estas 4 cuentas son las únicas de prueba que contienen filas bloqueantes:
--   dash@crm.test            → 1 proyecto + 2 facturas
--   e2e-1783014489@test.com  → 1 proyecto + 1 factura
--   tt-1783121190@test.com   → 1 proyecto
--   p2-1783102797@test.com   → 1 propuesta
--
-- REVISA la lista antes de ejecutar. No se tocan demo@crm.test, miembro@crm.test
-- ni otro@crm.test (no tienen huérfanos), ni ninguna cuenta @gmail.com.

DELETE FROM "User"
WHERE email IN (
  'dash@crm.test',
  'e2e-1783014489@test.com',
  'tt-1783121190@test.com',
  'p2-1783102797@test.com'
);


-- OPCIONAL · Higiene: otras cuentas de prueba SIN huérfanos (no bloquean la
-- migración). Descomenta solo si quieres limpiar el entorno del todo.
--
-- DELETE FROM "User"
-- WHERE email IN (
--   'admin-1783121171@test.com',
--   'miembro-1783121172@test.com',
--   'csv-1783102808@test.com',
--   'csv2-1783102868@test.com',
--   'e2e2-1783014505@test.com',
--   'e2e3-1783014523@test.com',
--   'p1-1783039263@test.com',
--   'p1b-1783039279@test.com'
-- );


-- ────────── PASO 2 · Asignar cliente a los proyectos reales (TU DECISIÓN) ────
-- Cuenta: luisalardin@gmail.com. Son 3 proyectos COMPLETADOS creados sin
-- oportunidad de origen, por lo que no había de dónde derivar el cliente.
--
-- Contactos disponibles en esa cuenta (elige uno por proyecto):
--   bdeaa70a-c2e5-49a1-b6f8-4098a10d8978  Daniela Martinez     (Devians)
--   0c803972-0279-452f-94b2-1b1e6eeab243  Efrain Doria         (Prisa)
--   8a588aa3-26c7-4d7c-80d7-5676a7f24a2f  Fernando Salas       (Devians)
--   b465e2b5-29f9-4360-9025-f3eb25873aa5  Jorge Castillo       (—)
--   1c266d77-5adf-4557-aa96-e05023825a87  Juan Torres          (DB-Counsorce)
--   defb1935-5d82-49f3-a616-9a58ddab9dfe  Karen Ruiz           (Devins S.A. de C.V.)
--   1a8d11f8-301d-44c3-b8a3-97e9d890f297  Luis Clatza          (Empresa Hidalgo)
--   d4984c72-2553-41e5-b2a6-4ccee1a3e46b  Margarita Hernandez  (QueenIncs)
--   0d81276e-1e69-412d-9874-f01104199a70  Maria Garcia         (Farmacia Gen)
--
-- Sustituye <CONTACT_ID> en cada línea y ejecútalas.
-- (Alternativa sin SQL: hazlo desde la UI en Proyectos → editar → Cliente.)

-- Punto de Venta
-- UPDATE "Project" SET "contactId" = '<CONTACT_ID>'
-- WHERE id = '24a1a764-8566-47fe-b472-1df3fbf9e8d5';

-- Test-to-SQL
-- UPDATE "Project" SET "contactId" = '<CONTACT_ID>'
-- WHERE id = '4839760b-bf72-4a14-95a5-87c6e6d2b76d';

-- GymRam2 - Revenge
-- UPDATE "Project" SET "contactId" = '<CONTACT_ID>'
-- WHERE id = '5b005059-897d-42a6-8c91-171d23684a60';


-- ───────── PASO 3 · Re-derivar el cliente de las facturas desde su proyecto ──
-- Invoice.contactId está denormalizado: se fija al emitir y NO se actualiza
-- solo cuando cambia el cliente del proyecto. Esta sentencia es idempotente y
-- solo toca facturas sin cliente cuyo proyecto ya lo tenga.

UPDATE "Invoice" AS i
SET "contactId" = p."contactId"
FROM "Project" AS p
WHERE i."projectId" = p."id"
  AND i."contactId" IS NULL
  AND p."contactId" IS NOT NULL;


-- ───────────── PASO 4 · Propuesta legacy sin cliente (TU DECISIÓN) ──────────
-- Cuenta: luisalardin@gmail.com
--   3c0b6802-8798-40f8-ab9d-9f3f471c8d45  "Propuesta para diseñar endpoint de
--                                          GymRats"  (RECHAZADA)
--
-- Opción A · asignarle cliente (sustituye <CONTACT_ID>):
-- UPDATE "Proposal" SET "contactId" = '<CONTACT_ID>'
-- WHERE id = '3c0b6802-8798-40f8-ab9d-9f3f471c8d45';
--
-- Opción B · borrarla (está rechazada; sus ítems se van en cascada):
-- DELETE FROM "Proposal" WHERE id = '3c0b6802-8798-40f8-ab9d-9f3f471c8d45';


-- ───────────────────────── PASO 5 · Verificación final ──────────────────────
-- Las tres cifras deben ser 0. Solo entonces aplica la migración NOT NULL.

SELECT 'proyectos sin cliente' AS entidad, count(*) FROM "Project"  WHERE "contactId" IS NULL
UNION ALL
SELECT 'facturas sin cliente',            count(*) FROM "Invoice"  WHERE "contactId" IS NULL
UNION ALL
SELECT 'propuestas sin cliente',          count(*) FROM "Proposal" WHERE "contactId" IS NULL;
