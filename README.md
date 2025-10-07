# Controle OS — MVP (React + Tailwind)

Sistema simples de ordens de serviço (OS) focado em oficinas/assistências técnicas.
Funciona 100% no navegador (offline-first) usando localStorage, com CRUD de OS, busca/ordenação, configurações da empresa, numeração automática e impressão em 1 página A4.

⚠️ MVP local: sem login/servidor. Os dados ficam no navegador do usuário.



## ✨ Funcionalidades

- CRUD de OS
Criar/editar/excluir.
Finalizar/Cancelar com um clique.
- Busca, filtros e ordenação
Busca por cliente, nº, telefone, descrição, técnico.
Filtro por status; ordenar por data, cliente, prioridade, status (asc/desc).
- Totais da OS
Mercadorias (R$), Serviços (R$), Desconto em R$ e %.
Total final calculado automaticamente (subtotal - desconto$ - (subtotal * %)).
Formatação monetária BRL 🇧🇷.
- Impressão profissional (A4, 1 página)
Layout limpo com cabeçalho da empresa, destinatário, conserto, detalhes, totais, observações e duas assinaturas.
Totais em 4 colunas na mesma linha.
Ajuste automático de escala para caber em uma única página (com limite mínimo de 80% para não ficar minúsculo).
- Configurações da empresa
Nome, telefone, endereço, responsável e logo (upload; armazena como DataURL).
- Numeração automática
Padrão configurável (ex.: OS-{YYYY}-), padding de dígitos, reset anual/mensal/never.
Tokens suportados: {YYYY}, {YY}, {MM}, {DD}.
Prévia do próximo número e reset manual.
- Exportar/Importar
Exporta JSON das OS.
Importa arquivo JSON compatível (append/replace).
- UX
Modal com cabeçalho/rodapé “sticky”.
Contador de resultados, badges de prioridade e pílula de status.