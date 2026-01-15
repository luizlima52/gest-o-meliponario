
import { Hive, Inspection, HiveGenetics, HiveClassification, InspectionType, Species, HiveHealth } from '../types';

const HIVES_KEY = 'melipro_hives';
const INSPECTIONS_KEY = 'melipro_inspections';

// Hives
export const getHives = (): Hive[] => {
  const data = localStorage.getItem(HIVES_KEY);
  if (!data) return [];
  
  try {
    const parsed = JSON.parse(data);
    return parsed.map((h: any) => ({
      ...h,
      classification: h.classification || (h.queenStatus === 'Presente' ? HiveClassification.MATRIZ : HiveClassification.FILHA),
      lastInterventionDate: h.lastInterventionDate || h.lastInterventionDateDiscos || '',
      genetics: h.genetics || HiveGenetics.MIXED
    }));
  } catch (e) {
    console.error("Erro ao ler colmeias do localStorage", e);
    return [];
  }
};

export const saveHive = (hive: Hive): void => {
  try {
    const data = localStorage.getItem(HIVES_KEY);
    let hives: Hive[] = data ? JSON.parse(data) : [];
    
    const index = hives.findIndex(h => h.id === hive.id);
    if (index >= 0) {
      hives[index] = { ...hives[index], ...hive };
    } else {
      hives.push(hive);
    }
    localStorage.setItem(HIVES_KEY, JSON.stringify(hives));
  } catch (e) {
    console.error("Erro ao salvar colmeia", e);
  }
};

export const saveHivesList = (hives: Hive[]): void => {
  localStorage.setItem(HIVES_KEY, JSON.stringify(hives));
};

export const deleteHive = (id: string): void => {
  const hives = getHives().filter(h => h.id !== id);
  localStorage.setItem(HIVES_KEY, JSON.stringify(hives));
  const inspections = getInspections().filter(i => i.hiveId !== id);
  localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(inspections));
};

// Inspections
export const getInspections = (): Inspection[] => {
  const data = localStorage.getItem(INSPECTIONS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const getInspectionsByHive = (hiveId: string): Inspection[] => {
  return getInspections()
    .filter(i => i.hiveId === hiveId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const saveInspection = (inspection: Inspection): void => {
  const inspections = getInspections();
  inspections.push(inspection);
  localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(inspections));
};

// Export Functions
const downloadCSV = (filename: string, csvContent: string) => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const sanitize = (text: string) => {
  if (!text) return '';
  return text.replace(/(\r\n|\n|\r)/gm, " ").replace(/;/g, ",");
};

const formatDateSafe = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR');
};

export const exportHivesToCSV = () => {
  const hives = getHives();
  let csv = 'ID;Nome da Caixa;Espécie;Genética;Data Chegada;Últ. Intervenção Discos;Saúde;Localização/Origem;Origem Detalhada;Classificação;Tipo de Caixa\n';
  
  hives.forEach(h => {
    const genetics = h.genetics || 'Mista/Outra';
    const arrivalDate = formatDateSafe(h.dateEstablished);
    const lastInterv = formatDateSafe(h.lastInterventionDate);
    csv += `${h.id};${sanitize(h.name)};${h.species};${genetics};${arrivalDate};${lastInterv};${h.health};${sanitize(h.location)};${sanitize(h.origin || '-')};${h.classification};${h.boxType}\n`;
  });

  downloadCSV(`melipro_enxames_${new Date().toISOString().split('T')[0]}.csv`, csv);
};

export const exportInspectionsToCSV = () => {
  const hives = getHives();
  const inspections = getInspections();
  let csv = 'Data;Nome da Caixa;Espécie;Tipo de Manejo;População;Pragas/Ataque;Qualidade Caixa;Nº Módulos;Estoque Alimento;Fornecido;Doou/Recebeu;Comportamento;Produtividade;Tam. Potes;Tam. Disco;Módulo Aberto;Cria Padrão;Fase Postura;Postura Módulo;Módulo Vazio;Inclusão Módulos;Ação Realizada;Sanidade;Hist. Doenças;Preparar Para;Observações\n';

  const sortedInspections = inspections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  sortedInspections.forEach(insp => {
    const hive = hives.find(h => h.id === insp.hiveId);
    const hiveName = hive ? sanitize(hive.name) : 'Caixa Excluída';
    const species = hive ? hive.species : '-';
    const d = insp.details || {};
    
    const dateFormatted = formatDateSafe(insp.date);
    const fornecido = Array.isArray(d.fornecido) ? d.fornecido.join('+') : '';
    const fasePostura = Array.isArray(d.fasePostura) ? d.fasePostura.join('+') : (d.fasePostura || '');
    const posturaModulo = Array.isArray(d.posturaModulo) ? d.posturaModulo.join('+') : (d.posturaModulo || '');

    csv += `${dateFormatted};${hiveName};${species};${insp.type};` +
           `${d.populacao || ''};${d.pragas || ''};${d.qualidadeCaixa || ''};${d.numModulos || ''};` +
           `${d.estoqueAlimento || ''};${fornecido};${d.doouRecebeu || ''};${d.comportamento || ''};` +
           `${d.caractProdutiva || ''};${d.tamanhoPotes || ''};${d.tamanhoDisco || ''};${d.moduloAberto || ''};` +
           `${d.criaPadrao || ''};${fasePostura};${posturaModulo};${d.moduloVazio || ''};` +
           `${d.inclusaoModulos || ''};${d.acao || ''};${d.sanidade || ''};${d.historicoDoencas || ''};` +
           `${d.prepararPara || ''};${sanitize(insp.notes)}\n`;
  });

  downloadCSV(`melipro_manejos_detalhado_${new Date().toISOString().split('T')[0]}.csv`, csv);
};

export const exportHiveToWord = (hive: Hive) => {
  const inspections = getInspectionsByHive(hive.id);
  const date = new Date().toLocaleDateString('pt-BR');

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Relatório - ${hive.name}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        h1 { color: #d97706; border-bottom: 2px solid #d97706; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; background-color: #f3f4f6; padding: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; font-size: 11px; }
        th { background-color: #f9fafb; font-weight: bold; }
        .info-grid { display: table; width: 100%; margin-bottom: 20px; }
        .info-row { display: table-row; }
        .info-cell { display: table-cell; padding: 5px 15px 5px 0; width: 50%; }
        .label { font-weight: bold; color: #666; }
      </style>
    </head>
    <body>
      <h1>Relatório do Enxame: ${hive.name}</h1>
      <p>Gerado em: ${date}</p>
      <h2>Identificação e Status</h2>
      <div class="info-grid">
        <div class="info-row">
          <div class="info-cell"><span class="label">Espécie:</span> ${hive.species}</div>
          <div class="info-cell"><span class="label">Saúde:</span> ${hive.health}</div>
        </div>
        <div class="info-row">
          <div class="info-cell"><span class="label">Genética:</span> ${hive.genetics || 'Mista'}</div>
          <div class="info-cell"><span class="label">Classificação:</span> ${hive.classification}</div>
        </div>
        <div class="info-row">
          <div class="info-cell"><span class="label">Tipo de Caixa:</span> ${hive.boxType}</div>
          <div class="info-cell"><span class="label">Localização:</span> ${hive.location}</div>
        </div>
        <div class="info-row">
          <div class="info-cell"><span class="label">Origem:</span> ${hive.origin || '-'}</div>
          <div class="info-cell"><span class="label">Data Chegada:</span> ${formatDateSafe(hive.dateEstablished)}</div>
        </div>
        <div class="info-row">
          <div class="info-cell"><span class="label">Último Manejo:</span> ${formatDateSafe(hive.lastInterventionDate)}</div>
          <div class="info-cell"></div>
        </div>
      </div>
      <h2>Histórico de Manejo (${inspections.length} registros)</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 15%">Data</th>
            <th style="width: 20%">Tipo</th>
            <th style="width: 65%">Observações e Detalhes</th>
          </tr>
        </thead>
        <tbody>
          ${inspections.length === 0 ? '<tr><td colspan="3">Nenhum registro encontrado.</td></tr>' : ''}
          ${inspections.map(ins => {
            const detailText = ins.details ? Object.entries(ins.details)
              .filter(([_, v]) => v && (!Array.isArray(v) || v.length > 0))
              .map(([k, v]) => {
                 const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                 const val = Array.isArray(v) ? v.join(', ') : v;
                 return `<b>${label}:</b> ${val}`;
              }).join(' | ') : '';
            return `
              <tr>
                <td>${formatDateSafe(ins.date)}</td>
                <td>${ins.type}</td>
                <td>
                  ${ins.notes || '-'}
                  ${detailText ? `<br><small style="color:#666; display:block; margin-top:5px;">${detailText}</small>` : ''}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #999;">
        Gerado pelo sistema MeliPro - Gestão de Meliponário
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Relatorio_${sanitize(hive.name)}_${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportAllInspectionsToWord = () => {
  const hives = getHives();
  const inspections = getInspections().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const date = new Date().toLocaleDateString('pt-BR');

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Relatório de Manejos Geral</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.4; font-size: 10px; }
        h1 { color: #d97706; text-align: center; border-bottom: 1px solid #d97706; padding-bottom: 5px; }
        h2 { color: #333; margin-top: 15px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #d97706; color: white; padding: 5px; border: 1px solid #ccc; font-size: 10px; }
        td { padding: 5px; border: 1px solid #ccc; vertical-align: top; font-size: 9px; }
        .hive-name { font-weight: bold; color: #d97706; }
      </style>
    </head>
    <body>
      <h1>Histórico Geral de Manejos - Meliponário</h1>
      <p>Gerado em: ${date} | Total de registros: ${inspections.length}</p>
      <table>
        <thead>
          <tr>
            <th style="width: 12%">Data</th>
            <th style="width: 15%">Enxame</th>
            <th style="width: 15%">Espécie</th>
            <th style="width: 15%">Tipo</th>
            <th style="width: 43%">Detalhes Técnicos / Observações</th>
          </tr>
        </thead>
        <tbody>
          ${inspections.length === 0 ? '<tr><td colspan="5">Nenhum registro encontrado.</td></tr>' : ''}
          ${inspections.map(ins => {
            const hive = hives.find(h => h.id === ins.hiveId);
            const detailText = ins.details ? Object.entries(ins.details)
              .filter(([_, v]) => v && (!Array.isArray(v) || v.length > 0))
              .map(([k, v]) => {
                 const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                 const val = Array.isArray(v) ? v.join(', ') : v;
                 return `<b>${label}:</b> ${val}`;
              }).join(' | ') : '';
            return `
              <tr>
                <td>${formatDateSafe(ins.date)}</td>
                <td class="hive-name">${hive ? hive.name : 'Excluída'}</td>
                <td>${hive ? hive.species : '-'}</td>
                <td>${ins.type}</td>
                <td>
                  ${ins.notes ? `<i>"${ins.notes}"</i><br>` : ''}
                  <small style="color: #666;">${detailText}</small>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #999;">
        Gerado pelo sistema MeliPro - Gestão de Meliponário
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Historico_Manejos_Geral_${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportGeneralReportToWord = () => {
  const hives = getHives();
  const date = new Date().toLocaleDateString('pt-BR');
  const total = hives.length;
  const strong = hives.filter(h => h.health === HiveHealth.STRONG).length;
  const critical = hives.filter(h => h.health === HiveHealth.CRITICAL || h.health === HiveHealth.WEAK).length;

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Inventário Geral Meliponário</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.4; font-size: 12px; }
        h1 { color: #d97706; text-align: center; }
        .summary { background-color: #f3f4f6; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #d97706; color: white; padding: 8px; border: 1px solid #ccc; font-size: 11px; }
        td { padding: 8px; border: 1px solid #ccc; font-size: 10px; }
        .center { text-align: center; }
      </style>
    </head>
    <body>
      <h1>Inventário Geral do Meliponário</h1>
      <div class="summary">
        <p><strong>Data de Emissão:</strong> ${date}</p>
        <p><strong>Total de Enxames:</strong> ${total} | <strong>Fortes:</strong> ${strong} | <strong>Atenção:</strong> ${critical}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nome/ID</th>
            <th>Espécie</th>
            <th>Classif.</th>
            <th>Saúde</th>
            <th>Caixa</th>
            <th>Origem</th>
            <th>Localização</th>
            <th>Último Manejo</th>
          </tr>
        </thead>
        <tbody>
          ${hives.map(h => `
            <tr>
              <td><strong>${h.name}</strong></td>
              <td class="center">${h.species}</td>
              <td class="center">${h.classification}</td>
              <td class="center">${h.health}</td>
              <td class="center">${h.boxType}</td>
              <td class="center">${h.origin || '-'}</td>
              <td>${h.location}</td>
              <td class="center">${formatDateSafe(h.lastInterventionDate)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <br>
      <p style="text-align:center; color:#666;">MeliPro - Gestão de Meliponário</p>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Inventario_Geral_${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const seedData = () => {
  if (!localStorage.getItem(HIVES_KEY)) {
    const initialHives: Hive[] = [
      {
        id: '1',
        name: 'CX-01 Matriz',
        species: Species.JATAI,
        genetics: HiveGenetics.MULTIPLICATION,
        dateEstablished: '2023-01-15',
        lastInterventionDate: '2023-11-20',
        health: HiveHealth.STRONG,
        location: 'São Paulo - Varanda',
        classification: HiveClassification.MATRIZ,
        boxType: 'AF',
        origin: 'Resgate'
      },
      {
        id: '2',
        name: 'CX-02 Produção',
        species: Species.MANDACAIA,
        genetics: HiveGenetics.HONEY,
        dateEstablished: '2023-06-20',
        lastInterventionDate: '2023-12-10',
        health: HiveHealth.STRONG,
        location: 'Sítio Atibaia',
        classification: HiveClassification.MAE,
        boxType: 'INPA',
        origin: 'Compra'
      }
    ];
    localStorage.setItem(HIVES_KEY, JSON.stringify(initialHives));

    const initialInspections: Inspection[] = [
      {
        id: '101',
        hiveId: '1',
        date: '2023-11-20',
        type: InspectionType.DIVISION,
        notes: 'Divisão realizada com sucesso. Matriz forte.',
        details: { populacao: 'B', estoqueAlimento: 'B' }
      }
    ];
    localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(initialInspections));
  }
};
