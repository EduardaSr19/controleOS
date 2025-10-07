import React, { useEffect, useMemo, useState } from "react";

// ==========================
// Sistema de Ordem de Serviços (MVP)
// - Armazena no localStorage
// - CRUD de OS
// - Busca, filtros e ordenação simples
// - Layout moderno com TailwindCSS
// ==========================

// Utilitários

// moeda BRL
const fmtBRL = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(n || 0)
  );

// helper: somar dias a um ISO
const addDaysISO = (iso, days) => {
  const d = iso ? new Date(iso) : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

// textos padrão
const TERMO_GARANTIA_PADRAO =
  "3 meses de garantia contra algum defeito de fábrica na peça ou serviço realizado, " +
  "garantia não cobre aparelhos molhados ou danificados após o serviço.";

const OBS_PADRAO =
  "Aparelhos não retirados dentro do prazo de 90 dias, estarão sujeitos a desmontagem, reciclagem e venda!";

// totais
const calcTotais = (os) => {
  const merc = Number(os.totalMercadorias || 0);
  const serv = Number(os.totalServicos || 0);
  const subtotal = merc + serv;
  const desc$ = Number(os.descontoValor || 0);
  const descPct = Number(os.descontoPercent || 0);
  const total = Math.max(0, subtotal - desc$ - (subtotal * descPct) / 100);
  return { merc, serv, subtotal, desc$, descPct, total };
};

const uid = () => Math.random().toString(36).slice(2, 9);
const nowISO = () => new Date().toISOString();
const fmtDate = (iso) => new Date(iso).toLocaleString();

const STATUS_OPTIONS = [
  { value: "aberta", label: "Aberta" },
  { value: "andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];

const PRIORIDADE_OPTIONS = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

const Badge = ({ children, tone = "slate" }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-${tone}-100 text-${tone}-800`}
  >
    {children}
  </span>
);

const StatusPill = ({ status }) => {
  const map = {
    aberta: { label: "Aberta", tone: "amber" },
    andamento: { label: "Em andamento", tone: "blue" },
    concluida: { label: "Concluída", tone: "emerald" },
    cancelada: { label: "Cancelada", tone: "rose" },
  };
  const s = map[status] || map.aberta;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-${s.tone}-100 text-${s.tone}-800`}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-${s.tone}-500`} /> {s.label}
    </span>
  );
};

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl bg-white shadow-md ring-1 ring-slate-100 ${className}`}
  >
    {children}
  </div>
);

const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;

  // trava o scroll da página ao abrir
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl md:max-w-4xl lg:max-w-5xl rounded-2xl bg-white shadow-xl">
        {/* Cabeçalho sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-white p-4 rounded-t-2xl">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Área rolável */}
        <div className="p-4 max-h-[75vh] overflow-y-auto">{children}</div>

        {/* Rodapé sticky */}
        {footer && (
          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t bg-white p-4 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ onCreate }) => (
  <Card className="p-10 text-center">
    <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-slate-50 grid place-content-center text-2xl">
      🧰
    </div>
    <h3 className="text-xl font-semibold">Sem ordens por aqui</h3>
    <p className="mt-1 text-slate-600">
      Crie a primeira OS para começar a organizar seu serviço.
    </p>
    <button
      onClick={onCreate}
      className="mt-6 rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-black"
    >
      Nova OS
    </button>
  </Card>
);

const TextInput = ({ label, required, ...props }) => (
  <label className="grid gap-1">
    <span className="text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-rose-600"> *</span>}
    </span>
    <input
      {...props}
      className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
    />
  </label>
);

const Select = ({ label, required, options, ...props }) => (
  <label className="grid gap-1">
    <span className="text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-rose-600"> *</span>}
    </span>
    <select
      {...props}
      className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

const Confirm = ({ message, onConfirm, onCancel }) => (
  <div className="flex items-center gap-3">
    <span className="text-slate-700">{message}</span>
    <button
      onClick={onConfirm}
      className="rounded-lg bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700"
    >
      Confirmar
    </button>
    <button
      onClick={onCancel}
      className="rounded-lg bg-slate-100 px-3 py-1.5 hover:bg-slate-200"
    >
      Cancelar
    </button>
  </div>
);

const initialForm = {
  id: "",
  numero: "",

  // Destinatário
  cliente: "", // Nome/Razão Social
  cpfCnpj: "", // novo
  telefone: "",

  // Conserto
  marca: "", // novo
  modelo: "", // novo
  condicoes: "", // novo (texto livre: condições do aparelho)
  termoGarantia: TERMO_GARANTIA_PADRAO, // novo
  dataGarantia: "", // novo (data de término da garantia)

  // Gerais
  descricao: "",
  tecnico: "",
  prioridade: "media",
  status: "aberta",
  dataAbertura: "",

  // Totais
  totalMercadorias: 0, // novo
  totalServicos: 0, // novo
  descontoValor: 0, // novo (R$)
  descontoPercent: 0, // novo (%)
  observacoes: OBS_PADRAO, // novo
};

export default function SistemaOS() {
  const [itens, setItens] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [sortKey, setSortKey] = useState("dataAbertura");
  const [sortDir, setSortDir] = useState("desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Config da numeração: persistimos no localStorage
  const [numeracao, setNumeracao] = useState({
    prefixo: "OS-{YYYY}-", // pode usar {YYYY},{YY},{MM},{DD}
    padding: 4, // dígitos
    proxSeq: 1, // próximo número
    resetModo: "yearly", // "never" | "yearly" | "monthly"
    ultimoReset: "", // "2025" ou "2025-09" (depende do modo)
  });

  // carregar
  useEffect(() => {
    const raw = localStorage.getItem(NUM_KEY);
    if (raw) setNumeracao(JSON.parse(raw));
  }, []);

  // salvar
  useEffect(() => {
    localStorage.setItem(NUM_KEY, JSON.stringify(numeracao));
  }, [numeracao]);

  const precisaResetar = () => {
    const d = new Date();
    if (numeracao.resetModo === "yearly") {
      const ano = String(d.getFullYear());
      return numeracao.ultimoReset !== ano;
    }
    if (numeracao.resetModo === "monthly") {
      const ym = `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}`;
      return numeracao.ultimoReset !== ym;
    }
    return false; // never
  };

  const aplicarResetSePreciso = () => {
    if (!precisaResetar()) return;
    const d = new Date();
    const novoUltimo =
      numeracao.resetModo === "yearly"
        ? String(d.getFullYear())
        : numeracao.resetModo === "monthly"
        ? `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}`
        : numeracao.ultimoReset;
    setNumeracao((prev) => ({ ...prev, proxSeq: 1, ultimoReset: novoUltimo }));
  };

  const getProximoNumero = () => {
    // garante reset antes
    const d = new Date();
    let novoUltimo = numeracao.ultimoReset;
    if (precisaResetar()) {
      novoUltimo =
        numeracao.resetModo === "yearly"
          ? String(d.getFullYear())
          : `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}`;
    }
    const seq = (precisaResetar() ? 1 : numeracao.proxSeq) || 1;
    const numeroStr = formatNumero(numeracao, seq, d);

    // avança e persiste
    setNumeracao((prev) => ({
      ...prev,
      proxSeq: seq + 1,
      ultimoReset: novoUltimo,
    }));

    return numeroStr;
  };

  // 👉 util: ler arquivo como DataURL (logo)
  const fileToDataURL = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  // 👉 dados da empresa para o cabeçalho do PDF
  const EMPRESA_KEY = "sistema_os_empresa";

  const [empresa, setEmpresa] = useState({
    nome: "Minha Empresa",
    endereco: "",
    telefone: "",
    logo: "", // dataURL
    responsavel: "", // 👈 novo
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // carregar empresa
  useEffect(() => {
    const raw = localStorage.getItem(EMPRESA_KEY);
    if (raw) setEmpresa(JSON.parse(raw));
  }, []);
  // salvar empresa
  useEffect(() => {
    localStorage.setItem(EMPRESA_KEY, JSON.stringify(empresa));
  }, [empresa]);

  // Carrega do localStorage
  useEffect(() => {
    const raw = localStorage.getItem("sistema_os_itens");
    if (raw) setItens(JSON.parse(raw));
  }, []);

  // Salva no localStorage
  useEffect(() => {
    localStorage.setItem("sistema_os_itens", JSON.stringify(itens));
  }, [itens]);

  const openCreate = () => {
    aplicarResetSePreciso();
    const agora = nowISO();
    setForm({
      ...initialForm,
      id: "",
      numero: getProximoNumero(),
      dataAbertura: agora,
      dataGarantia: addDaysISO(agora, 90),
      tecnico: empresa.responsavel || "", // 👈 aqui
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setForm({ ...item });
    setModalOpen(true);
  };

  const reset = () => {
    setModalOpen(false);
    setForm(initialForm);
  };

  const save = () => {
    // Validação simples
    if (!form.cliente || !form.descricao) {
      alert("Preencha pelo menos Cliente e Descrição.");
      return;
    }
    if (form.id) {
      setItens((prev) => prev.map((i) => (i.id === form.id ? { ...form } : i)));
    } else {
      setItens((prev) => [{ ...form, id: uid() }, ...prev]);
    }
    reset();
  };

  const remove = (id) => {
    setItens((prev) => prev.filter((i) => i.id !== id));
    setConfirmDelete(null);
  };

  const toggleStatus = (id, newStatus) => {
    setItens((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    );
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = itens.filter((i) =>
      [i.numero, i.cliente, i.telefone, i.descricao, i.tecnico]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
    if (statusFilter !== "todos")
      data = data.filter((i) => i.status === statusFilter);
    const dir = sortDir === "asc" ? 1 : -1;
    data.sort((a, b) => {
      const va = a[sortKey] || "";
      const vb = b[sortKey] || "";
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return data;
  }, [itens, query, statusFilter, sortKey, sortDir]);

  const exportar = () => {
    const blob = new Blob([JSON.stringify(itens, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `os_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data)) setItens(data);
        else alert("Arquivo inválido");
      } catch (err) {
        alert("Falha ao importar");
      }
    };
    reader.readAsText(file);
  };

  // 👉 imprime 1 OS com template próprio em uma nova janela
  const imprimirOS = (item) => {
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return alert("Permita pop-ups para imprimir.");

    const t = calcTotais(item);
    const estilo = `
    <style>
      * { box-sizing: border-box; }
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#0f172a; margin: 32px; }
      .row { display:flex; gap:16px; }
      .col { flex:1; }
      .card { border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-top:16px; }
      
      /* Descrição + Técnico lado a lado */
.card .row .col.desc { flex: 1 1 72%; }      
.card .row .col.tech { flex: 0 0 28%; max-width: 28%; } 
      .muted { color:#475569; }
      .title { font-size:20px; font-weight:700; margin:0; }
      .h { font-size:14px; font-weight:600; color:#334155; margin-bottom:6px; }
      .v { font-size:14px; }
      .header { display:flex; align-items:center; justify-content:space-between; }
      .logo { height:56px; object-fit:contain; }
      table { width:100%; border-collapse:collapse; }
      th, td { text-align:left; padding:10px 12px; border-bottom:1px solid #e2e8f0; }
      .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; background:#f1f5f9; }
      .sign { height:90px; border:1px dashed #94a3b8; border-radius:10px; margin-top:24px; }
      .foot { font-size:12px; color:#64748b; text-align:center; margin-top:24px; }
      @media print { .no-print { display:none } }

      /* Totais compacto */
.card.totais { padding: 10px 12px; }
.card.totais .h { margin-bottom: 6px; }
.card.totais table.compact th,
.card.totais table.compact td {
  padding: 4px 6px;        
  font-size: 12px;          
  border-bottom: none;       
}
.card.totais table.compact th { width: 65%; font-weight:600; color:#334155; }
.card.totais table.compact tr.total th,
.card.totais table.compact tr.total td {
  padding-top: 6px;
  border-top: 1px solid #e2e8f0;
  font-size: 13px;
}

/* Conserto: mais legível */
.row.gap-lg { gap: 24px; }   
.kv{ display:flex; flex-direction:column; gap:4px; }
.kv .lab{ font-size:12px; font-weight:700; color:#334155; }
.kv .val{ font-size:13px; }
.section-sep{ height:1px; background:#e2e8f0; margin:10px 0 12px; }

/* --- layout tipo formulário (todos os blocos) --- */
.form-grid-1{display:grid;grid-template-columns:1fr;gap:12px}
.form-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.form-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.form-grid-4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px}
.form-grid-2-1{display:grid;grid-template-columns:2fr 1fr;gap:12px}
.field{display:flex;flex-direction:column;gap:6px}
.field .label{font-size:12px;font-weight:600;color:#334155}
.field .input{border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;min-height:38px;background:#fff;font-size:13px}
.field .input.pre{white-space:pre-wrap}
.field .input.textarea{min-height:90px}
.field .input.right{text-align:right}
.field .input.sign{border:1px dashed #94a3b8;border-radius:10px;min-height:90px;background:#fff}

/* grid 3 colunas com a 1ª mais larga (Descrição) */
.form-grid-details{
  display:grid;
  grid-template-columns: 2fr 1fr 0.9fr; /* descrição | técnico | status */
  gap:12px;
  align-items:start;
}

/* Totais em 4 colunas na impressão */
.form-grid-totais{
  display:grid;
  grid-template-columns: 1fr 1fr 1fr 1fr; /* Mercadorias | Serviços | Descontos | Total */
  gap:12px;
  align-items:start;
}

@media print {
  @page { size: A4; margin: 8mm; } 
  html, body { margin:0; }

  /* compacta geral */
  .card{ padding:12px; margin-top:10px; }
  .title{ font-size:19px; }
  .h{ font-size:13px; }
  .muted{ font-size:12px; }
  .logo{ height:48px; }  

  .field .label{ font-size:12px; }   
  .field .input{ font-size:13px; padding:9px 11px; min-height:36px; } 
  .input.right{ text-align:right; }

  /* textões ficam baixinhos */
  .card .input.textarea{ min-height:56px; } 
  /* se quiser ainda menor: 46px */

  /* detalhes em 3 colunas e totais em 4 colunas */
  .form-grid-details{ grid-template-columns:2fr 1fr 0.9fr; gap:10px; }
  .form-grid-totais{ grid-template-columns:1fr 1fr 1fr 1fr; gap:10px; }

  /* assinaturas mais baixas */
  .sign{ min-height:60px; margin-top:14px; }

  /* rodapé curtinho */
  .foot{ margin-top:10px; font-size:11px; }
}


    </style>
  `;

    const logoImg = empresa.logo
      ? `<img class="logo" src="${empresa.logo}" alt="logo"/>`
      : `<div style="font-weight:800;font-size:20px;">${
          empresa.nome || "Minha Empresa"
        }</div>`;

    const prioridadeLabel =
      PRIORIDADE_OPTIONS.find((p) => p.value === item.prioridade)?.label || "";
    const statusLabel =
      {
        aberta: "Aberta",
        andamento: "Em andamento",
        concluida: "Concluída",
        cancelada: "Cancelada",
      }[item.status] || "";

    const html = `
    <!doctype html><html><head><meta charset="utf-8"/><title>OS #${
      item.numero
    }</title>${estilo}</head>
    <body>
      <div class="header">
        <div class="row" style="align-items:center; gap:12px;">
          ${logoImg}
          <div>
            <div class="title">Ordem de Serviço #${item.numero}</div>
       <div class="muted">${empresa.nome || ""}</div>
       <div class="muted">${empresa.endereco || ""}</div>
       <div class="muted">${empresa.telefone || ""}</div>
       <div class="muted"><strong>Responsável:</strong> ${
         empresa.responsavel || "—"
       }</div> <!-- 👈 novo -->
     </div>
        </div>
        <div class="muted">Abertura: ${fmtDate(item.dataAbertura)}</div>
      </div>

      <!-- DESTINATÁRIO -->
      <div class="card">
  <div class="h">Destinatário</div>
  <div class="form-grid-3">
    <div class="field">
      <div class="label">Nome / Razão Social</div>
      <div class="input">${item.cliente || "—"}</div>
    </div>
    <div class="field">
      <div class="label">CPF / CNPJ</div>
      <div class="input">${item.cpfCnpj || "—"}</div>
    </div>
    <div class="field">
      <div class="label">Telefone</div>
      <div class="input">${item.telefone || "—"}</div>
    </div>
  </div>
</div>

      <!-- CONSERTO -->
      <div class="card">
  <div class="h">Conserto</div>

  <div class="form-grid-4">
    <div class="field">
      <div class="label">Marca</div>
      <div class="input">${item.marca || "—"}</div>
    </div>
    <div class="field">
      <div class="label">Modelo</div>
      <div class="input">${item.modelo || "—"}</div>
    </div>
    <div class="field">
      <div class="label">Data de garantia (término)</div>
      <div class="input">${
        item.dataGarantia ? fmtDate(item.dataGarantia) : "—"
      }</div>
    </div>
    <div class="field">
      <div class="label">Prioridade</div>
      <div class="input">${prioridadeLabel}</div>
    </div>
  </div>

  <div style="height:10px"></div>

  <div class="form-grid-3">
    <div class="field" style="grid-column:1 / span 2">
      <div class="label">Condições</div>
      <div class="input textarea pre">${item.condicoes || "—"}</div>
    </div>
    <div class="field">
      <div class="label">Termo de Garantia</div>
      <div class="input textarea pre">${item.termoGarantia || ""}</div>
    </div>
  </div>
</div>

     <!-- DETALHES -->
<div class="card">
  <div class="h">Detalhes</div>
  <div class="form-grid-details">
    <div class="field">
      <div class="label">Descrição do serviço</div>
      <div class="input textarea pre">${item.descricao || "—"}</div>
    </div>
    <div class="field">
      <div class="label">Técnico</div>
      <div class="input">${item.tecnico || "—"}</div>
    </div>
    <div class="field">
      <div class="label">Status</div>
      <div class="input">${
        {
          aberta: "Aberta",
          andamento: "Em andamento",
          concluida: "Concluída",
          cancelada: "Cancelada",
        }[item.status] || "—"
      }</div>
    </div>
  </div>
</div>

      <!-- TOTAIS -->
<div class="card">
  <div class="h">Totais</div>
  <div class="form-grid-totais">
    <div class="field">
      <div class="label">Mercadorias</div>
      <div class="input right">${fmtBRL(t.merc)}</div>
    </div>
    <div class="field">
      <div class="label">Serviços</div>
      <div class="input right">${fmtBRL(t.serv)}</div>
    </div>
    <div class="field">
      <div class="label">Descontos</div>
      <div class="input right">${
        (t.desc$ > 0 ? "-" + fmtBRL(t.desc$) : fmtBRL(0)) +
        (t.descPct > 0 ? ` (${t.descPct}%)` : "")
      }</div>
    </div>
    <div class="field">
      <div class="label">Total</div>
      <div class="input right"><strong>${fmtBRL(t.total)}</strong></div>
    </div>
  </div>
</div>

      <!-- OBSERVAÇÕES -->
<div class="card">
  <div class="form-grid-1">
    <div class="field">
      <div class="label">Observações</div>
      <div class="input textarea pre">${item.observacoes || ""}</div>
    </div>
  </div>
</div>

      <!-- ASSINATURAS -->
<div class="card">
  <div class="h">Assinaturas</div>
  <div class="form-grid-2">
    <div class="field">
      <div class="label">Assinatura do Cliente</div>
      <div class="input sign"></div>
    </div>
    <div class="field">
      <div class="label">Assinatura do Técnico</div>
      <div class="input sign"></div>
    </div>
  </div>
</div>

      <div class="foot">Gerado pelo Sistema de OS — ${new Date().toLocaleString()}</div>

      <div class="no-print" style="margin-top:16px;text-align:right;">
        <button onclick="window.print()" style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;background:#0f172a;color:#fff;">Imprimir / Salvar PDF</button>
      </div>
    </body></html>
  `;

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      const mmToPx = (mm) => (mm / 25.4) * 96; // 96dpi
      const printableHeight = mmToPx(297 - 2 * 8); // A4, margens @page 8mm

      const doc = win.document;
      requestAnimationFrame(() => {
        const contentH = doc.body.scrollHeight;

        // usa ~98.5% da folha pra não arriscar quebra
        const target = printableHeight * 0.985;
        let scale = target / contentH;

        // pode crescer até 1.06x e nunca ficar menor que 0.90x
        scale = Math.max(0.9, Math.min(1.06, scale));

        doc.body.style.zoom = scale; // Chrome/Edge
        if (getComputedStyle(doc.body).zoom === "normal") {
          // Firefox/Safari fallback
          doc.body.style.transformOrigin = "top left";
          doc.body.style.transform = `scale(${scale})`;
        }

        win.print();
      });
    };
  };

  // ===== Numeração automática =====
  const NUM_KEY = "sistema_os_numeracao";

  const pad = (n, size) => String(n).padStart(size, "0");

  // Gera string final a partir do padrão e do seq.
  // Padrões suportados: {YYYY} {YY} {MM} {DD}
  const formatNumero = ({ prefixo, padding }, seq, date = new Date()) => {
    const YYYY = date.getFullYear();
    const YY = String(YYYY).slice(-2);
    const MM = pad(date.getMonth() + 1, 2);
    const DD = pad(date.getDate(), 2);
    const base = (prefixo || "OS-{YYYY}-")
      .replaceAll("{YYYY}", YYYY)
      .replaceAll("{YY}", YY)
      .replaceAll("{MM}", MM)
      .replaceAll("{DD}", DD);
    return `${base}${pad(seq, padding || 4)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-content-center text-white overflow-hidden">
              {empresa.logo ? (
                <img
                  src={empresa.logo}
                  alt="Logo"
                  className="h-9 w-9 object-contain bg-white rounded"
                />
              ) : (
                <img
                  src="/favicon-os.png"
                  alt="Logo"
                  className="h-9 w-9 object-contain"
                />
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight">
                Controle OS
              </h1>
              <p className="text-xs text-slate-500">MVP — localStorage</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreate}
              className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-black"
            >
              Nova OS
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-xl border border-slate-200 px-4 py-2 hover:bg-slate-50"
            >
              Configurações
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-6xl p-4">
        {/* Filtros */}
        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <TextInput
                label="Buscar"
                placeholder="Cliente, nº, técnico..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: "todos", label: "Todos" }, ...STATUS_OPTIONS]}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Ordenar por"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                options={[
                  { value: "dataAbertura", label: "Data" },
                  { value: "cliente", label: "Cliente" },
                  { value: "prioridade", label: "Prioridade" },
                  { value: "status", label: "Status" },
                ]}
              />
              <Select
                label="Direção"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value)}
                options={[
                  { value: "desc", label: "Desc" },
                  { value: "asc", label: "Asc" },
                ]}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge tone="slate">{filtered.length} resultado(s)</Badge>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportar}
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50"
              >
                Exportar
              </button>
              <label className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                Importar{" "}
                <input
                  type="file"
                  className="hidden"
                  accept="application/json"
                  onChange={importar}
                />
              </label>
            </div>
          </div>
        </Card>

        {/* Lista */}
        <div className="mt-4">
          {filtered.length === 0 ? (
            <EmptyState onCreate={openCreate} />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Nº</th>
                      <th className="px-4 py-3">Nome/Razão Social</th>
                      <th className="px-4 py-3">Telefone</th>
                      <th className="px-4 py-3">Descrição</th>
                      <th className="px-4 py-3">Técnico</th>
                      <th className="px-4 py-3">Prioridade</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Abertura</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((i) => (
                      <tr key={i.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium">{i.numero}</td>
                        <td className="px-4 py-3">{i.cliente}</td>
                        <td className="px-4 py-3">{i.telefone}</td>
                        <td
                          className="px-4 py-3 max-w-[28ch] truncate"
                          title={i.descricao}
                        >
                          {i.descricao}
                        </td>
                        <td className="px-4 py-3">{i.tecnico}</td>
                        <td className="px-4 py-3">
                          <Badge
                            tone={
                              i.prioridade === "alta"
                                ? "rose"
                                : i.prioridade === "baixa"
                                ? "slate"
                                : "amber"
                            }
                          >
                            {
                              PRIORIDADE_OPTIONS.find(
                                (p) => p.value === i.prioridade
                              )?.label
                            }
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={i.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {fmtBRL(calcTotais(i).total)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {fmtDate(i.dataAbertura)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(i)}
                              className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
                            >
                              Editar
                            </button>
                            {i.status !== "concluida" && (
                              <button
                                onClick={() => toggleStatus(i.id, "concluida")}
                                className="rounded-lg border border-emerald-200 px-2 py-1 text-emerald-700 hover:bg-emerald-50"
                              >
                                Finalizar
                              </button>
                            )}
                            {i.status !== "cancelada" && (
                              <button
                                onClick={() => toggleStatus(i.id, "cancelada")}
                                className="rounded-lg border border-rose-200 px-2 py-1 text-rose-700 hover:bg-rose-50"
                              >
                                Cancelar
                              </button>
                            )}

                            <button
                              onClick={() => imprimirOS(i)}
                              className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
                            >
                              Imprimir
                            </button>

                            <button
                              onClick={() => setConfirmDelete(i)}
                              className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Modal de criação/edição */}
      <Modal
        open={modalOpen}
        onClose={reset}
        title={form.id ? `Editar OS #${form.numero}` : "Nova OS"}
        footer={
          <>
            <button
              onClick={reset}
              className="rounded-xl bg-slate-100 px-4 py-2 hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-black"
            >
              Salvar
            </button>
          </>
        }
      >
        <div className="grid gap-6">
          {/* DESTINATÁRIO */}
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-sm font-semibold mb-2">Destinatário</div>
            <div className="grid gap-3 md:grid-cols-3">
              <TextInput
                label="Nome / Razão Social"
                required
                placeholder="Cliente ou empresa"
                value={form.cliente}
                onChange={(e) => setForm({ ...form, cliente: e.target.value })}
              />
              <TextInput
                label="CPF / CNPJ"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={form.cpfCnpj}
                onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })}
              />
              <TextInput
                label="Telefone"
                placeholder="(00) 00000-0000"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>
          </div>

          {/* CONSERTO */}
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-sm font-semibold mb-2">Conserto</div>
            <div className="grid gap-3 md:grid-cols-4">
              <TextInput
                label="Marca"
                placeholder="Ex.: Samsung"
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
              />
              <TextInput
                label="Modelo"
                placeholder="Ex.: A52"
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
              />
              <TextInput
                label="Data de garantia (término)"
                type="date"
                value={
                  form.dataGarantia
                    ? new Date(form.dataGarantia).toISOString().slice(0, 10)
                    : ""
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    dataGarantia: e.target.value
                      ? new Date(e.target.value + "T00:00:00").toISOString()
                      : "",
                  })
                }
              />
              <Select
                label="Prioridade"
                value={form.prioridade}
                onChange={(e) =>
                  setForm({ ...form, prioridade: e.target.value })
                }
                options={PRIORIDADE_OPTIONS}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2 mt-3">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700">
                  Condições
                </span>
                <textarea
                  rows={3}
                  className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Ex.: Aparelho riscado, sem parafusos, sem bateria..."
                  value={form.condicoes}
                  onChange={(e) =>
                    setForm({ ...form, condicoes: e.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700">
                  Termo de Garantia
                </span>
                <textarea
                  rows={3}
                  className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
                  value={form.termoGarantia}
                  onChange={(e) =>
                    setForm({ ...form, termoGarantia: e.target.value })
                  }
                />
              </label>
            </div>
          </div>

          {/* DETALHES / STATUS */}
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-sm font-semibold mb-2">Detalhes</div>
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput
                label="Descrição do serviço"
                required
                placeholder="Ex.: Manutenção de notebook / troca de tela"
                value={form.descricao}
                onChange={(e) =>
                  setForm({ ...form, descricao: e.target.value })
                }
              />
              <TextInput
                label="Técnico"
                placeholder="Responsável"
                value={form.tecnico}
                onChange={(e) => setForm({ ...form, tecnico: e.target.value })}
              />
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>

          {/* TOTAIS */}
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-sm font-semibold mb-2">Totais</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <TextInput
                label="Total mercadorias (R$)"
                type="number"
                step="0.01"
                min="0"
                value={form.totalMercadorias}
                onChange={(e) =>
                  setForm({ ...form, totalMercadorias: Number(e.target.value) })
                }
              />
              <TextInput
                label="Total serviços (R$)"
                type="number"
                step="0.01"
                min="0"
                value={form.totalServicos}
                onChange={(e) =>
                  setForm({ ...form, totalServicos: Number(e.target.value) })
                }
              />
              <TextInput
                label="Desconto OS (R$)"
                type="number"
                step="0.01"
                min="0"
                value={form.descontoValor}
                onChange={(e) =>
                  setForm({ ...form, descontoValor: Number(e.target.value) })
                }
              />
              <TextInput
                label="Desconto OS (%)"
                type="number"
                step="0.01"
                min="0"
                value={form.descontoPercent}
                onChange={(e) =>
                  setForm({ ...form, descontoPercent: Number(e.target.value) })
                }
              />
              {/* resumo */}
              <div className="grid gap-1 text-sm">
                <span className="text-slate-700 font-medium">Total final</span>
                <span className="text-slate-900">
                  {fmtBRL(calcTotais(form).total)}
                </span>
              </div>
            </div>
          </div>

          {/* OBSERVAÇÕES */}
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-sm font-semibold mb-2">Observações</div>
            <label className="grid gap-1">
              <textarea
                rows={3}
                className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
                value={form.observacoes}
                onChange={(e) =>
                  setForm({ ...form, observacoes: e.target.value })
                }
              />
            </label>
          </div>

          {/* metadados */}
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
            <div>
              <span className="block font-medium text-slate-700">Nº</span>
              <span>{form.numero || "—"}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-700">Abertura</span>
              <span>{fmtDate(form.dataAbertura || nowISO())}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-700">ID</span>
              <span className="font-mono">{form.id || "(novo)"}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmação de exclusão */}
      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title={`Excluir OS #${confirmDelete?.numero}`}
        footer={
          <>
            <button
              onClick={() => setConfirmDelete(null)}
              className="rounded-xl bg-slate-100 px-4 py-2 hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              onClick={() => remove(confirmDelete.id)}
              className="rounded-xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
            >
              Excluir
            </button>
          </>
        }
      >
        <p>
          Tem certeza que deseja excluir esta OS? Esta ação não poderá ser
          desfeita.
        </p>
      </Modal>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Configurações da Empresa"
        footer={
          <>
            <button
              onClick={() => setSettingsOpen(false)}
              className="rounded-xl bg-slate-100 px-4 py-2 hover:bg-slate-200"
            >
              Fechar
            </button>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
            label="Nome da empresa"
            value={empresa.nome}
            onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })}
          />
          <TextInput
            label="Telefone"
            value={empresa.telefone}
            onChange={(e) =>
              setEmpresa({ ...empresa, telefone: e.target.value })
            }
          />
          <TextInput
            label="Endereço"
            value={empresa.endereco}
            onChange={(e) =>
              setEmpresa({ ...empresa, endereco: e.target.value })
            }
          />

          <TextInput
            label="Funcionário responsável"
            placeholder="Ex.: Maria Souza"
            value={empresa.responsavel}
            onChange={(e) =>
              setEmpresa({ ...empresa, responsavel: e.target.value })
            }
          />

          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">
              Logo (PNG/JPG)
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const data = await fileToDataURL(f);
                setEmpresa((prev) => ({ ...prev, logo: data }));
              }}
            />
            {empresa.logo && (
              <img
                src={empresa.logo}
                alt="Logo"
                className="mt-2 h-12 w-auto rounded border border-slate-200 bg-white p-1"
              />
            )}
          </label>
        </div>

        <div className="md:col-span-2 mt-4 rounded-xl border border-slate-200 p-3">
          <div className="text-sm font-semibold mb-2">Numeração das OS</div>

          <div className="grid gap-3 md:grid-cols-3">
            <TextInput
              label="Prefixo (use {YYYY}, {YY}, {MM}, {DD})"
              value={numeracao.prefixo}
              onChange={(e) =>
                setNumeracao((prev) => ({ ...prev, prefixo: e.target.value }))
              }
              placeholder="OS-{YYYY}-"
            />
            <TextInput
              label="Dígitos (padding)"
              type="number"
              min={1}
              value={numeracao.padding}
              onChange={(e) =>
                setNumeracao((prev) => ({
                  ...prev,
                  padding: Math.max(1, Number(e.target.value || 1)),
                }))
              }
              placeholder="4"
            />
            <Select
              label="Reset automático"
              value={numeracao.resetModo}
              onChange={(e) =>
                setNumeracao((prev) => ({ ...prev, resetModo: e.target.value }))
              }
              options={[
                { value: "never", label: "Nunca" },
                { value: "yearly", label: "Anual" },
                { value: "monthly", label: "Mensal" },
              ]}
            />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3 items-end">
            <TextInput
              label="Próximo sequencial"
              type="number"
              min={1}
              value={numeracao.proxSeq}
              onChange={(e) =>
                setNumeracao((prev) => ({
                  ...prev,
                  proxSeq: Math.max(1, Number(e.target.value || 1)),
                }))
              }
            />
            <div className="text-sm text-slate-600">
              Exemplo gerado agora:
              <div className="mt-1 font-mono text-slate-800">
                {formatNumero(numeracao, numeracao.proxSeq, new Date())}
              </div>
            </div>
            <button
              onClick={() => {
                // reset manual rápido
                const d = new Date();
                setNumeracao((prev) => ({
                  ...prev,
                  proxSeq: 1,
                  ultimoReset:
                    prev.resetModo === "monthly"
                      ? `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}`
                      : String(d.getFullYear()),
                }));
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 hover:bg-slate-50"
            >
              Resetar contador
            </button>
          </div>
        </div>
      </Modal>

      {/* Rodapé */}
      <footer className="mx-auto max-w-6xl p-6 text-center text-xs text-slate-500">
        MVP local (sem servidor).
      </footer>
    </div>
  );
}
