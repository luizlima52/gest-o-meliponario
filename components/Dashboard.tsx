import React, { useMemo } from 'react';
import { Hive, Inspection, HiveHealth, HiveGenetics } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Activity, AlertTriangle, Droplets, Copy, MapPin, AlertCircle, CalendarClock, CheckCircle, ExternalLink, Bug, TrendingUp, History } from 'lucide-react';

interface DashboardProps {
  hives: Hive[];
  inspections: Inspection[];
  onSelectHive: (hive: Hive) => void;
}

const GENETICS_COLORS = {
  [HiveGenetics.HONEY]: '#f59e0b', // Amber
  [HiveGenetics.PROPOLIS]: '#10b981', // Emerald
  [HiveGenetics.MULTIPLICATION]: '#3b82f6', // Blue
  [HiveGenetics.MIXED]: '#8b5cf6', // Violet
};

const Dashboard: React.FC<DashboardProps> = ({ hives, inspections, onSelectHive }) => {
  
  // 1. Cálculos Gerais
  const totalHives = hives.length;
  
  // Cálculo de Espécies Diferentes
  const uniqueSpeciesCount = useMemo(() => {
    return new Set(hives.map(h => h.species)).size;
  }, [hives]);

  // Enxames Aguardando Evolução
  const evolvingHives = useMemo(() => {
    return hives.filter(h => h.health === HiveHealth.EVOLVING);
  }, [hives]);

  // 2. Colmeias com Problemas (Fraca ou Crítica)
  const problematicHives = useMemo(() => {
    return hives.filter(h => h.health === HiveHealth.WEAK || h.health === HiveHealth.CRITICAL);
  }, [hives]);

  // 3. Agrupamento por Genética
  const geneticsData = useMemo(() => {
    const counts: Record<string, number> = {};
    const lists: Record<string, string[]> = {};
    
    // Inicializar
    Object.values(HiveGenetics).forEach(g => {
        counts[g] = 0;
        lists[g] = [];
    });

    hives.forEach(h => {
      const gen = h.genetics || HiveGenetics.MIXED;
      counts[gen] = (counts[gen] || 0) + 1;
      lists[gen] = [...(lists[gen] || []), h.name];
    });

    return Object.entries(counts).map(([name, value]) => ({ 
        name, 
        value,
        hives: lists[name]
    })).filter(d => d.value > 0);
  }, [hives]);

  // 4. Prontas para Multiplicação (90 dias + Saúde Forte/Média)
  const multiplicationAnalysis = useMemo(() => {
    const today = new Date();
    const readyToDivide: Hive[] = []; 
    const waitingTime: { hive: Hive, days: number }[] = []; 

    hives.forEach(h => {
        const refDateString = h.lastInterventionDate || h.dateEstablished;
        if (!refDateString) return;
        
        const refDate = new Date(refDateString);
        if (isNaN(refDate.getTime())) return;

        const diffTime = Math.abs(today.getTime() - refDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 90) {
            waitingTime.push({ hive: h, days: diffDays });
            
            if (h.health === HiveHealth.STRONG) {
                readyToDivide.push(h);
            }
        }
    });

    return { readyToDivide, waitingTime };
  }, [hives]);

  // 5. Agrupamento por Localização
  const hivesByLocation = useMemo(() => {
      const map: Record<string, Hive[]> = {};
      hives.forEach(h => {
          let locKey = h.location || 'Não Definida';
          if (locKey.includes('-')) {
             locKey = locKey.split('-')[0].trim();
          }
          if (!map[locKey]) map[locKey] = [];
          map[locKey].push(h);
      });
      return map;
  }, [hives]);


  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* KPI Cards Superiores - Ajustado para lg:grid-cols-5 para forçar uma linha única em telas grandes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Enxames</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity size={18} /></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalHives}</div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase">Caixas ativas</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Espécies</span>
                 <div className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Bug size={18} /></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{uniqueSpeciesCount}</div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase">Diferentes</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Genética Pura</span>
                 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Copy size={18} /></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
                {hives.filter(h => h.genetics === HiveGenetics.MULTIPLICATION).length}
            </div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase">Multiplicação</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between border-l-4 border-l-red-400">
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Atenção</span>
                 <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={18} /></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{problematicHives.length}</div>
            <div className="text-[10px] text-red-500 mt-1 font-bold uppercase">Fracas/Críticas</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between border-l-4 border-l-green-400">
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Prontas</span>
                 <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={18} /></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{multiplicationAnalysis.readyToDivide.length}</div>
            <div className="text-[10px] text-green-600 mt-1 font-bold uppercase">Divisão (>90d)</div>
        </div>
      </div>

      {/* Seção Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
             <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
                <Droplets size={18} className="mr-2 text-honey-600" />
                Seleção Genética
             </h3>
             <div className="flex flex-col md:flex-row gap-4">
                <div className="h-48 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={geneticsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        >
                        {geneticsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={GENETICS_COLORS[entry.name as HiveGenetics] || '#9ca3af'} />
                        ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="flex-1 space-y-2 overflow-y-auto max-h-48 pr-2">
                    {geneticsData.map((g) => (
                        <div key={g.name} className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-center mb-0.5">
                                <span className="font-semibold text-xs text-gray-700" style={{color: GENETICS_COLORS[g.name as HiveGenetics]}}>Para {g.name}</span>
                                <span className="bg-white px-1.5 py-0 rounded text-[10px] border shadow-sm font-bold">{g.value} cx</span>
                            </div>
                            <p className="text-[10px] text-gray-500 leading-relaxed truncate">
                                {g.hives?.join(', ')}
                            </p>
                        </div>
                    ))}
                </div>
             </div>
          </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <MapPin size={20} className="mr-2 text-gray-500" />
                    Localização (Colmeias)
               </h3>
               <div className="space-y-4">
                   {Object.entries(hivesByLocation).map(([loc, list]: [string, Hive[]]) => (
                       <div key={loc} className="relative">
                           <div className="flex justify-between items-center mb-1">
                               <span className="font-medium text-gray-800">{loc}</span>
                               <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-bold">{list.length}</span>
                           </div>
                           <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                                <div 
                                    className="bg-honey-500 h-2 rounded-full" 
                                    style={{ width: `${totalHives > 0 ? (list.length / totalHives) * 100 : 0}%` }}
                                ></div>
                           </div>
                           <p className="text-xs text-gray-500 truncate">
                               {list.map(h => h.name).join(', ')}
                           </p>
                       </div>
                   ))}
               </div>
           </div>
      </div>

      {/* Seção Inferior - Mantida com 3 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Colmeias com Problemas */}
          <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden flex flex-col">
              <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
                  <h3 className="font-bold text-red-800 flex items-center">
                      <AlertCircle size={18} className="mr-2" />
                      Atenção Necessária ({problematicHives.length})
                  </h3>
              </div>
              <div className="p-0 flex-1">
                  {problematicHives.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm italic">Nenhum problema detectado. Excelente!</div>
                  ) : (
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-500 font-medium">
                              <tr>
                                  <th className="px-4 py-2">Caixa</th>
                                  <th className="px-4 py-2">Status</th>
                                  <th className="px-4 py-2 text-right">Ação</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {problematicHives.map(h => (
                                  <tr 
                                    key={h.id} 
                                    className="hover:bg-red-50 group cursor-pointer transition-colors"
                                    onClick={() => onSelectHive(h)}
                                    title="Clique para realizar manejo corretivo"
                                  >
                                      <td className="px-4 py-3 font-bold text-gray-800">
                                          {h.name}
                                          <div className="text-[10px] text-gray-400 font-normal">{h.species}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase">{h.health}</span>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                          <button className="text-red-600 hover:text-red-800 flex items-center justify-end text-xs font-bold gap-1 ml-auto">
                                              <span>Resolver</span>
                                              <ExternalLink size={12} />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  )}
              </div>
          </div>

          {/* Aguardando Evolução */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden flex flex-col">
              <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center justify-between">
                  <h3 className="font-bold text-blue-800 flex items-center">
                      <TrendingUp size={18} className="mr-2" />
                      Aguardando Evolução ({evolvingHives.length})
                  </h3>
              </div>
              <div className="p-0 flex-1">
                  {evolvingHives.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm italic">Nenhum enxame aguardando evolução no momento.</div>
                  ) : (
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-500 font-medium">
                              <tr>
                                  <th className="px-4 py-2">Caixa</th>
                                  <th className="px-4 py-2">Espécie</th>
                                  <th className="px-4 py-2 text-right">Ação</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {evolvingHives.map(h => (
                                  <tr 
                                    key={h.id} 
                                    className="hover:bg-blue-50 group cursor-pointer transition-colors"
                                    onClick={() => onSelectHive(h)}
                                  >
                                      <td className="px-4 py-3 font-bold text-gray-800">{h.name}</td>
                                      <td className="px-4 py-3 text-gray-600">{h.species}</td>
                                      <td className="px-4 py-3 text-right">
                                          <button className="text-blue-600 hover:text-blue-800 flex items-center justify-end text-xs font-bold gap-1 ml-auto">
                                              <span>Ver</span>
                                              <ExternalLink size={12} />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  )}
              </div>
          </div>

          {/* Aguardando Ciclo de 90 dias */}
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden flex flex-col">
               <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-between">
                  <h3 className="font-bold text-amber-800 flex items-center">
                      <CalendarClock size={18} className="mr-2" />
                      Ciclo de Multiplicação ({'>'} 90 dias)
                  </h3>
              </div>
              <div className="p-0 flex-1">
                   {multiplicationAnalysis.waitingTime.length === 0 ? (
                       <div className="p-6 text-center text-gray-400 text-sm italic">Nenhum enxame completou o ciclo de 90 dias ainda.</div>
                   ) : (
                       <div className="max-h-[300px] overflow-y-auto">
                           <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-2">Caixa</th>
                                        <th className="px-4 py-2">Repouso</th>
                                        <th className="px-4 py-2 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {multiplicationAnalysis.waitingTime.map(item => (
                                        <tr 
                                            key={item.hive.id} 
                                            className="hover:bg-amber-50/30 group cursor-pointer transition-colors"
                                            onClick={() => onSelectHive(item.hive)}
                                            title="Clique para planejar a multiplicação"
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {item.hive.name}
                                                <div className="text-[10px] text-gray-400">{item.hive.species}</div>
                                            </td>
                                            <td className="px-4 py-3 text-amber-600 font-semibold">{item.days} dias</td>
                                            <td className="px-4 py-3 text-right">
                                                {item.hive.health === HiveHealth.STRONG ? (
                                                    <button className="text-green-600 hover:text-green-800 flex items-center justify-end text-xs font-bold gap-1 ml-auto">
                                                        <span>Multiplicar</span>
                                                        <ExternalLink size={12} />
                                                    </button>
                                                ) : (
                                                    <span className="text-amber-500 text-[10px] font-bold uppercase">Aguardar Força</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                       </div>
                   )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;