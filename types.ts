
export enum Species {
  JATAI = 'Jataí',
  MANDACAIA = 'Mandaçaia',
  URUCU = 'Uruçu',
  IRAI = 'Iraí',
  TIUBA = 'Tiúba',
  TUBUNA = 'Tubuna',
  MIRIM = 'Mirim',
  OUTRA = 'Outra'
}

export enum HiveHealth {
  WEAK = 'Fraca',
  MEDIUM = 'Média',
  STRONG = 'Forte',
  CRITICAL = 'Crítica',
  EVOLVING = 'Aguardando Evolução'
}

export enum HiveGenetics {
  HONEY = 'Mel',
  PROPOLIS = 'Própolis',
  MULTIPLICATION = 'Multiplicação',
  MIXED = 'Mista/Outra'
}

export enum HiveClassification {
  MATRIZ = 'Matriz',
  MAE = 'Mãe',
  FILHA = 'Filha',
  CAPTURA = 'Captura',
  RESGATE = 'Resgate'
}

export enum InspectionType {
  FEEDING = 'Alimentação',
  DIVISION = 'Divisão',
  HARVEST = 'Colheita',
  CLEANING = 'Limpeza',
  INSPECTION = 'Vistoria Geral',
  TRANSFER = 'Transferência',
  INTERVENTION = 'Intervenção'
}

export interface InspectionDetails {
  populacao?: 'B' | 'M' | 'R'; // Bom, Médio, Ruim
  pragas?: 'F' | 'E' | 'A' | 'N'; // Forídeos, Enxameação, Ataque, Nenhuma
  qualidadeCaixa?: 'B' | 'R' | 'T'; // Boa, Ruim, Trocar
  numModulos?: '1' | '2' | '3' | '3+';
  estoqueAlimento?: 'B' | 'M' | 'R';
  fornecido?: string[]; // Multi-select: X, P, C, M
  doouRecebeu?: 'DD' | 'DC' | 'RD' | 'RC' | ''; 
  comportamento?: 'C' | 'D'; // Calma, Defensiva
  caractProdutiva?: 'M' | 'P' | 'R' | 'G'; 
  tamanhoPotes?: 'P' | 'M' | 'G';
  tamanhoDisco?: 'P' | 'M' | 'G';
  moduloAberto?: 'N' | 'SN' | '2';
  criaPadrao?: 'N' | 'A'; // Normal, Atípico
  fasePostura?: string[]; // Multi-select: SV (Subindo Verde), V, 1/2M, M, SM
  posturaModulo?: string[]; // Multi-select: N, SN, 2
  moduloVazio?: 'SN' | 'M';
  inclusaoModulos?: 'SN' | 'M1' | 'M2';
  acao?: 'L' | 'DV' | 'R' | 'C';
  sanidade?: 'B' | 'M' | 'R';
  historicoDoencas?: 'F' | 'MS' | 'L' | 'V';
  prepararPara?: 'IN' | 'M' | 'V' | 'R'; // IN=Indução, V=Venda
}

export interface Hive {
  id: string;
  name: string; // e.g., Cx-01
  species: Species;
  genetics: HiveGenetics;
  dateEstablished: string; // Data de Chegada
  lastInterventionDate?: string; // Última Intervenção
  health: HiveHealth;
  location: string;
  origin?: string; // Origem (Resgate, Divisão, Compra, etc)
  classification: HiveClassification;
  boxType: 'INPA' | 'AF' | 'Rústica' | 'Outra';
}

export interface Inspection {
  id: string;
  hiveId: string;
  date: string;
  type: InspectionType;
  notes: string;
  details?: InspectionDetails;
  nextActionDate?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
