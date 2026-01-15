import React from 'react';
import { Hive, HiveHealth } from '../types';
import { Archive, Bug, MapPin, Crown, Pencil, Trash2, Calendar, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface HiveCardProps {
  hive: Hive;
  lastInspectionDate?: string;
  lastInspectionType?: string;
  onSelect: (hive: Hive) => void;
  onEdit: (hive: Hive) => void;
  onDelete: (id: string) => void;
  onExportWord: (hive: Hive) => void;
  
  // Props para reordenação
  isReordering?: boolean;
  onMovePrev?: () => void;
  onMoveNext?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const HiveCard: React.FC<HiveCardProps> = ({ 
  hive, 
  lastInspectionDate, 
  lastInspectionType, 
  onSelect, 
  onEdit, 
  onDelete,
  onExportWord,
  isReordering,
  onMovePrev,
  onMoveNext,
  isFirst,
  isLast
}) => {
  const getHealthColor = (health: HiveHealth) => {
    switch (health) {
      case HiveHealth.STRONG: return 'bg-green-100 text-green-800 border-green-200';
      case HiveHealth.MEDIUM: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case HiveHealth.WEAK: return 'bg-orange-100 text-orange-800 border-orange-200';
      case HiveHealth.CRITICAL: return 'bg-red-100 text-red-800 border-red-200';
      case HiveHealth.EVOLVING: return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGeneticsColor = (genetics: string) => {
     if (!genetics) return 'bg-gray-50 text-gray-600';
     if (genetics.includes('Mel')) return 'bg-amber-50 text-amber-700 border-amber-100';
     if (genetics.includes('Multiplicação')) return 'bg-blue-50 text-blue-700 border-blue-100';
     if (genetics.includes('Própolis')) return 'bg-green-50 text-green-700 border-green-100';
     return 'bg-purple-50 text-purple-700 border-purple-100';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--/--';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' }); 
  };

  const displayDate = lastInspectionDate || hive.lastInterventionDate;

  return (
    <div className={`bg-white rounded-lg shadow-sm border transition-all flex flex-col justify-between group overflow-hidden h-full ${isReordering ? 'border-honey-300 ring-2 ring-honey-100 shadow-md transform scale-[1.01]' : 'border-gray-200 hover:shadow-md'}`}>
      <div 
        className={`p-3 flex-1 flex flex-col ${isReordering ? "cursor-move" : "cursor-pointer"}`}
        onClick={() => !isReordering && onSelect(hive)}
      >
        {/* Header: Nome e Saúde */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className={`p-1.5 rounded-md flex-shrink-0 ${isReordering ? 'bg-honey-200 text-honey-800' : 'bg-honey-100 text-honey-600'}`}>
              <Archive size={18} />
            </div>
            <div className="min-w-0">
               <h3 className="font-bold text-gray-800 text-sm truncate leading-tight" title={hive.name}>{hive.name}</h3>
               <span className="text-[10px] text-gray-500 font-medium truncate block">{hive.boxType}</span>
            </div>
          </div>
          <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${getHealthColor(hive.health)}`}>
            {hive.health}
          </span>
        </div>
        
        {/* Linha de Destaque: Espécie e Classificação */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
           <div className="flex items-center bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
              <Bug size={12} className="mr-1 text-gray-400" />
              <span className="text-[10px] font-medium text-gray-700">{hive.species}</span>
           </div>
           
           {/* CLASSIFICAÇÃO COM DESTAQUE */}
           <div className="flex items-center bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 text-blue-700">
              <Crown size={12} className="mr-1" />
              <span className="text-[10px] font-bold uppercase">{hive.classification}</span>
           </div>
        </div>

        {/* Genética e Localização */}
        <div className="space-y-1 mb-3">
            {hive.genetics && hive.genetics !== 'Mista/Outra' && (
                <div className="flex items-center">
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border w-full text-center ${getGeneticsColor(hive.genetics)}`}>
                        Foco: {hive.genetics === 'Multiplicação' ? 'MULTIPLICAÇÃO' : hive.genetics.toUpperCase()}
                    </span>
                </div>
            )}
            <div className="flex items-center text-gray-500">
                <MapPin size={12} className="mr-1.5 flex-shrink-0" />
                <span className="text-[10px] truncate">{hive.location}</span>
            </div>
        </div>

        {/* ÚLTIMO MANEJO COM DESTAQUE */}
        <div className="mt-auto bg-gray-50 rounded-lg p-2 border border-gray-100">
            <div className="flex items-center text-[10px] text-gray-400 mb-0.5 uppercase font-bold tracking-wider">
                <Calendar size={10} className="mr-1" /> Último Manejo
            </div>
            <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-gray-800">{formatDate(displayDate)}</span>
                <span className="text-[10px] font-medium text-gray-600 truncate max-w-[100px]" title={lastInspectionType}>
                    {lastInspectionType || 'Sem registro'}
                </span>
            </div>
        </div>
      </div>

      {/* Footer Actions */}
      {isReordering ? (
        <div className="flex items-center space-x-1 border-t border-honey-200 bg-honey-50 px-3 py-2">
            <button 
                onClick={(e) => { e.stopPropagation(); onMovePrev?.(); }}
                disabled={isFirst}
                className={`flex-1 p-1 rounded flex justify-center items-center transition-all ${isFirst ? 'text-gray-300' : 'bg-white text-honey-600 shadow-sm border border-honey-200'}`}
            >
                <ChevronLeft size={16} />
            </button>
            <span className="text-[10px] font-bold text-honey-700 uppercase tracking-wider flex items-center justify-center w-12">
                Mover
            </span>
            <button 
                onClick={(e) => { e.stopPropagation(); onMoveNext?.(); }}
                disabled={isLast}
                className={`flex-1 p-1 rounded flex justify-center items-center transition-all ${isLast ? 'text-gray-300' : 'bg-white text-honey-600 shadow-sm border border-honey-200'}`}
            >
                <ChevronRight size={16} />
            </button>
        </div>
      ) : (
        <div className="flex items-center space-x-1 border-t border-gray-100 px-3 py-2 bg-gray-50/50">
            <button 
            onClick={() => onSelect(hive)}
            className="flex-1 bg-white border border-gray-200 text-honey-700 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide hover:bg-honey-50 hover:border-honey-200 transition-all shadow-sm"
            >
            Manejo
            </button>
            <div className="flex gap-1 pl-1">
                <button 
                onClick={(e) => { e.stopPropagation(); onExportWord(hive); }}
                className="p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-green-600 hover:border-green-200 hover:bg-green-50 rounded transition-all shadow-sm"
                title="Relatório Word"
                >
                <FileText size={14} />
                </button>
                <button 
                onClick={(e) => { e.stopPropagation(); onEdit(hive); }}
                className="p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded transition-all shadow-sm"
                title="Editar"
                >
                <Pencil size={14} />
                </button>
                <button 
                onClick={(e) => { e.stopPropagation(); onDelete(hive.id); }}
                className="p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded transition-all shadow-sm"
                title="Excluir"
                >
                <Trash2 size={14} />
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default HiveCard;