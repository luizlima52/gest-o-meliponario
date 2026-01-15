
import React, { useState } from 'react';
import { Hive, Inspection, InspectionType, InspectionDetails } from '../types';
import { getInspectionsByHive, saveInspection, saveHive } from '../services/storageService';
import { ArrowLeft, Plus, Save, Clipboard, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface SelectOption {
  value: string;
  label?: string;
  desc?: string;
}

interface SelectGroupProps {
  label: string;
  options: SelectOption[];
  value: string | string[] | undefined;
  onChange: (value: any) => void;
  multi?: boolean;
}

interface HiveDetailProps {
  hive: Hive;
  onBack: () => void;
  onUpdateHive: (hive: Hive) => void;
}

// Componente auxiliar para os grupos de seleção
const SelectGroup: React.FC<SelectGroupProps> = ({ label, options, value, onChange, multi = false }) => {
  const handleSelect = (optValue: string) => {
    if (multi) {
      const current = Array.isArray(value) ? value : [];
      if (current.includes(optValue)) {
        onChange(current.filter((v: string) => v !== optValue));
      } else {
        onChange([...current, optValue]);
      }
    } else {
      onChange(value === optValue ? '' : optValue);
    }
  };

  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = multi 
            ? Array.isArray(value) && value.includes(opt.value)
            : value === opt.value;
          
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded border transition-colors ${
                isSelected 
                  ? 'bg-honey-600 text-white border-honey-600 shadow-sm' 
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
              title={opt.desc || opt.value}
            >
              {opt.label || opt.value}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const HiveDetail: React.FC<HiveDetailProps> = ({ hive, onBack, onUpdateHive }) => {
  const [inspections, setInspections] = useState<Inspection[]>(getInspectionsByHive(hive.id));
  const [showAddInspection, setShowAddInspection] = useState(false);
  const [expandedInspectionId, setExpandedInspectionId] = useState<string | null>(null);
  
  // Estado do formulário de inspeção
  const [newInspection, setNewInspection] = useState<Partial<Inspection>>({
    type: InspectionType.INSPECTION,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Estado dos detalhes técnicos
  const [details, setDetails] = useState<InspectionDetails>({});

  const handleAddInspection = () => {
    if (!newInspection.date || !newInspection.type) return;

    // 1. Criar e Salvar Inspeção
    const inspection: Inspection = {
      id: uuidv4(),
      hiveId: hive.id,
      date: newInspection.date,
      type: newInspection.type as InspectionType,
      notes: newInspection.notes || '',
      details: details // Salva o objeto de detalhes
    };
    saveInspection(inspection);
    
    // 2. Atualizar Colmeia (Sincronizar última intervenção)
    const updatedHive = { ...hive, lastInterventionDate: newInspection.date };
    saveHive(updatedHive);

    // 3. Atualizar Estado Local
    setInspections(getInspectionsByHive(hive.id));
    setShowAddInspection(false);
    
    // 4. Notificar Pai
    onUpdateHive(updatedHive);
    
    // Reset form
    setNewInspection({
      type: InspectionType.INSPECTION,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setDetails({});
  };

  const updateDetail = (key: keyof InspectionDetails, value: any) => {
    setDetails(prev => ({ ...prev, [key]: value }));
  };

  const toggleExpand = (id: string) => {
    setExpandedInspectionId(expandedInspectionId === id ? null : id);
  };

  const getHealthStyle = (health: string) => {
    switch (health) {
      case 'Forte': return 'bg-green-100 text-green-800 border-green-200';
      case 'Média': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Aguardando Evolução': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Fraca': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Crítica': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft size={18} className="mr-1" />
        Voltar para lista
      </button>

      {/* Header Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              {hive.name}
              <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{hive.species}</span>
            </h1>
            <p className="text-gray-500 mt-1">Localização: {hive.location} • Estabelecida em: {new Date(hive.dateEstablished).toLocaleDateString('pt-BR')}</p>
            {hive.origin && (
              <p className="text-xs text-honey-700 mt-1 flex items-center font-medium">
                <Truck size={14} className="mr-1" /> Origem: {hive.origin}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
              <div className="text-right">
                  <span className="block text-xs text-gray-500 mb-1">Saúde</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getHealthStyle(hive.health)}`}>
                      {hive.health}
                  </span>
              </div>
               <div className="text-right ml-4">
                  <span className="block text-xs text-gray-500 mb-1">Tipo</span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      {hive.classification}
                  </span>
              </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Histórico de Manejo</h2>
        <button 
          onClick={() => setShowAddInspection(true)}
          className="flex items-center bg-honey-600 text-white px-4 py-2 rounded-lg hover:bg-honey-700 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Manejo
        </button>
      </div>

      {/* Add Inspection Form (Ficha Técnica) */}
      {showAddInspection && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg animate-fade-in">
          <div className="bg-honey-50 px-6 py-4 border-b border-honey-100 flex justify-between items-center">
             <h3 className="font-bold text-honey-800">Nova Ficha de Manejo</h3>
             <button onClick={() => setShowAddInspection(false)} className="text-gray-400 hover:text-gray-600"><Plus className="rotate-45" /></button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data</label>
                <input 
                    type="date" 
                    value={newInspection.date}
                    onChange={e => setNewInspection({...newInspection, date: e.target.value})}
                    className="w-full border-gray-300 rounded-lg text-sm focus:ring-honey-500 focus:border-honey-500"
                />
                </div>
                <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Manejo</label>
                <select 
                    value={newInspection.type}
                    onChange={e => setNewInspection({...newInspection, type: e.target.value as InspectionType})}
                    className="w-full border-gray-300 rounded-lg text-sm focus:ring-honey-500 focus:border-honey-500"
                >
                    {Object.values(InspectionType).map(t => (
                    <option key={t} value={t}>{t}</option>
                    ))}
                </select>
                </div>
            </div>

            <div className="border-t border-gray-100 my-4 pt-4">
                <h4 className="text-sm font-bold text-gray-800 mb-3 bg-gray-50 p-2 rounded">Geral e Estado</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SelectGroup label="População" value={details.populacao} onChange={(v) => updateDetail('populacao', v)} 
                        options={[{value: 'B', label: 'Boa'}, {value: 'M', label: 'Média'}, {value: 'R', label: 'Ruim'}]} />
                    <SelectGroup label="Pragas/Ataque" value={details.pragas} onChange={(v) => updateDetail('pragas', v)} 
                        options={[{value: 'F', desc: 'Forídeos'}, {value: 'E', desc: 'Enxameação'}, {value: 'A', desc: 'Ataque'}, {value: 'N', label: 'Não'}]} />
                    <SelectGroup label="Qualidade Caixa" value={details.qualidadeCaixa} onChange={(v) => updateDetail('qualidadeCaixa', v)} 
                        options={[{value: 'B', label: 'Boa'}, {value: 'R', label: 'Ruim'}, {value: 'T', label: 'Trocar'}]} />
                    <SelectGroup label="Nº Módulos" value={details.numModulos} onChange={(v) => updateDetail('numModulos', v)} 
                        options={[{value: '1'}, {value: '2'}, {value: '3'}, {value: '3+'}]} />
                    <SelectGroup label="Sanidade" value={details.sanidade} onChange={(v) => updateDetail('sanidade', v)} 
                        options={[{value: 'B'}, {value: 'M'}, {value: 'R'}]} />
                    <SelectGroup label="Comportamento" value={details.comportamento} onChange={(v) => updateDetail('comportamento', v)} 
                        options={[{value: 'C', label: 'Calma'}, {value: 'D', label: 'Defens.'}]} />
                </div>
            </div>

            <div className="border-t border-gray-100 my-4 pt-4">
                <h4 className="text-sm font-bold text-gray-800 mb-3 bg-gray-50 p-2 rounded">Alimentação e Produção</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SelectGroup label="Estoque Alimento" value={details.estoqueAlimento} onChange={(v) => updateDetail('estoqueAlimento', v)} 
                        options={[{value: 'B'}, {value: 'M'}, {value: 'R'}]} />
                    <SelectGroup label="Fornecido" value={details.fornecido} onChange={(v) => updateDetail('fornecido', v)} multi={true}
                        options={[{value: 'X', desc: 'Xarope'}, {value: 'P', desc: 'Pólen'}, {value: 'C', desc: 'Cera'}, {value: 'M', desc: 'Mel'}]} />
                     <SelectGroup label="Produtividade" value={details.caractProdutiva} onChange={(v) => updateDetail('caractProdutiva', v)} 
                        options={[{value: 'M', desc: 'Mel'}, {value: 'P', desc: 'Própolis'}, {value: 'R', desc: 'Rainha?'}, {value: 'G', desc: 'Genética?'}]} />
                     <SelectGroup label="Tam. Potes" value={details.tamanhoPotes} onChange={(v) => updateDetail('tamanhoPotes', v)} 
                        options={[{value: 'P'}, {value: 'M'}, {value: 'G'}]} />
                </div>
            </div>

            <div className="border-t border-gray-100 my-4 pt-4">
                <h4 className="text-sm font-bold text-gray-800 mb-3 bg-gray-50 p-2 rounded">Ninho e Postura</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SelectGroup label="Tam. Disco" value={details.tamanhoDisco} onChange={(v) => updateDetail('tamanhoDisco', v)} 
                        options={[{value: 'P'}, {value: 'M'}, {value: 'G'}]} />
                    <SelectGroup label="Fase Postura" value={details.fasePostura} onChange={(v) => updateDetail('fasePostura', v)} multi={true}
                        options={[{value: 'SV', desc: 'Subindo Verde'}, {value: 'V', desc: 'Verde'}, {value: '1/2M'}, {value: 'M', desc: 'Maduro'}, {value: 'SM', desc: 'Subindo Maduro'}]} />
                    <SelectGroup label="Módulo Aberto" value={details.moduloAberto} onChange={(v) => updateDetail('moduloAberto', v)} 
                        options={[{value: 'N', desc: 'Ninho'}, {value: 'SN', desc: 'Sobreninho'}, {value: '2'}]} />
                    <SelectGroup label="Postura Módulo" value={details.posturaModulo} onChange={(v) => updateDetail('posturaModulo', v)} multi={true}
                        options={[{value: 'N'}, {value: 'SN'}, {value: '2'}]} />
                    <SelectGroup label="Cria Padrão" value={details.criaPadrao} onChange={(v) => updateDetail('criaPadrao', v)} 
                        options={[{value: 'N', label: 'Normal'}, {value: 'A', label: 'Atípico'}]} />
                </div>
            </div>

            <div className="border-t border-gray-100 my-4 pt-4">
                <h4 className="text-sm font-bold text-gray-800 mb-3 bg-gray-50 p-2 rounded">Manejo e Ações</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SelectGroup label="Ação" value={details.acao} onChange={(v) => updateDetail('acao', v)} 
                        options={[{value: 'L', desc: 'Limpeza'}, {value: 'DV', desc: 'Divisão'}, {value: 'R', desc: 'Reforço'}, {value: 'C', desc: 'Colheita'}]} />
                    <SelectGroup label="Inclusão Mód." value={details.inclusaoModulos} onChange={(v) => updateDetail('inclusaoModulos', v)} 
                        options={[{value: 'SN'}, {value: 'M1'}, {value: 'M2'}]} />
                    <SelectGroup label="Módulo Vazio" value={details.moduloVazio} onChange={(v) => updateDetail('moduloVazio', v)} 
                        options={[{value: 'SN'}, {value: 'M'}]} />
                    <SelectGroup label="Doou/Recebeu" value={details.doouRecebeu} onChange={(v) => updateDetail('doouRecebeu', v)} 
                        options={[{value: 'DD'}, {value: 'DC'}, {value: 'RD'}, {value: 'RC'}]} />
                     <SelectGroup label="Hist. Doenças" value={details.historicoDoencas} onChange={(v) => updateDetail('historicoDoencas', v)} 
                        options={[{value: 'F'}, {value: 'MS'}, {value: 'L'}, {value: 'V'}]} />
                    <SelectGroup label="Preparar Para" value={details.prepararPara} onChange={(v) => updateDetail('prepararPara', v)} 
                        options={[{value: 'IN', desc: 'Indução'}, {value: 'M', desc: 'Mult.'}, {value: 'V', desc: 'Venda'}, {value: 'R', desc: 'Reforço'}]} />
                </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Observações Adicionais</label>
              <textarea 
                value={newInspection.notes}
                onChange={e => setNewInspection({...newInspection, notes: e.target.value})}
                rows={2}
                className="w-full border-gray-300 rounded-lg text-sm focus:ring-honey-500 focus:border-honey-500"
                placeholder="Detalhes extras..."
              />
            </div>

            <div className="flex justify-end space-x-2 mt-6">
                <button 
                onClick={() => setShowAddInspection(false)}
                className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                Cancelar
                </button>
                <button 
                onClick={handleAddInspection}
                className="px-6 py-2.5 bg-honey-600 text-white rounded-lg hover:bg-honey-700 font-medium shadow-sm flex items-center"
                >
                <Save size={18} className="mr-2" />
                Salvar Ficha
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline/List */}
      <div className="space-y-4">
        {inspections.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Clipboard className="mx-auto text-gray-300 mb-2" size={48} />
            <p className="text-gray-500">Nenhum manejo registrado ainda.</p>
          </div>
        ) : (
          inspections.map(insp => {
            const isExpanded = expandedInspectionId === insp.id;
            return (
                <div key={insp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-honey-300 transition-colors">
                <div 
                    className="p-4 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer"
                    onClick={() => toggleExpand(insp.id)}
                >
                    <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-honey-50 text-honey-600 font-bold text-xs flex-col">
                        <span className="text-lg leading-none">{new Date(insp.date).getDate()}</span>
                        <span className="uppercase text-[10px]">{new Date(insp.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                    </div>
                    
                    <div className="flex-grow">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-800">{insp.type}</h4>
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                        </div>
                        <p className="text-gray-600 text-sm truncate">{insp.notes || "Sem observações."}</p>
                        
                        {insp.details && (
                             <div className="flex gap-2 mt-1 flex-wrap">
                                {insp.details.populacao && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">Pop: {insp.details.populacao}</span>}
                                {insp.details.estoqueAlimento && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100">Ali: {insp.details.estoqueAlimento}</span>}
                                {insp.details.sanidade && <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">San: {insp.details.sanidade}</span>}
                             </div>
                        )}
                    </div>
                </div>

                {/* Expanded Details View */}
                {isExpanded && insp.details && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 text-xs">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6 pt-3">
                            {Object.entries(insp.details).map(([key, val]) => {
                                if(!val || (Array.isArray(val) && val.length === 0)) return null;
                                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                const displayVal = Array.isArray(val) ? val.join(', ') : val;
                                return (
                                    <div key={key}>
                                        <span className="text-gray-500 font-medium block">{label}</span>
                                        <span className="text-gray-900 font-bold">{displayVal}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HiveDetail;
