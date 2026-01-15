
import React, { useState, useEffect, useCallback } from 'react';
import { Hive, Species, HiveHealth, HiveGenetics, HiveClassification, Inspection } from './types';
import { getHives, saveHive, saveHivesList, deleteHive, seedData, exportHivesToCSV, exportInspectionsToCSV, getInspectionsByHive, exportHiveToWord, exportGeneralReportToWord, getInspections, exportAllInspectionsToWord } from './services/storageService';
import Dashboard from './components/Dashboard';
import HiveCard from './components/HiveCard';
import HiveDetail from './components/HiveDetail';
import { v4 as uuidv4 } from 'uuid';
import { LayoutDashboard, Grid, Plus, X, FileSpreadsheet, Download, ArrowLeftRight, Check, FileText, MapPin, Truck } from 'lucide-react';

type View = 'dashboard' | 'hives';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [hives, setHives] = useState<Hive[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selectedHive, setSelectedHive] = useState<Hive | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  
  // Hive Form State
  const [formData, setFormData] = useState<Partial<Hive>>({
    species: Species.JATAI,
    genetics: HiveGenetics.MIXED,
    health: HiveHealth.MEDIUM,
    boxType: 'INPA',
    classification: HiveClassification.FILHA
  });

  const locationPresets = [
    "Guarapuava-Meliponário São Francisco",
    "Na Mata",
    "Outros"
  ];

  const refreshData = useCallback(() => {
    const allHives = getHives();
    const allInspections = getInspections();
    setHives(allHives);
    setInspections(allInspections);
  }, []);

  useEffect(() => {
    seedData(); 
    refreshData();
  }, [refreshData]);

  const handleOpenCreateModal = () => {
    setFormData({ 
      species: Species.JATAI, 
      genetics: HiveGenetics.MIXED, 
      health: HiveHealth.MEDIUM, 
      boxType: 'INPA', 
      classification: HiveClassification.FILHA,
      dateEstablished: new Date().toISOString().split('T')[0],
      lastInterventionDate: '',
      location: '',
      origin: ''
    });
    setIsModalOpen(true);
  };

  const handleEditHive = (hive: Hive) => {
    setFormData({ ...hive });
    setIsModalOpen(true);
  };

  const handleSaveHive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.species) return;

    const hiveToSave: Hive = {
      id: formData.id || uuidv4(),
      name: formData.name,
      species: formData.species as Species,
      genetics: formData.genetics as HiveGenetics,
      dateEstablished: formData.dateEstablished || new Date().toISOString().split('T')[0],
      lastInterventionDate: formData.lastInterventionDate || '',
      health: formData.health as HiveHealth,
      location: formData.location || '',
      origin: formData.origin || '',
      classification: formData.classification as HiveClassification,
      boxType: (formData.boxType as 'INPA' | 'AF' | 'Rústica' | 'Outra') || 'INPA'
    };

    saveHive(hiveToSave);
    
    if (selectedHive && selectedHive.id === hiveToSave.id) {
      setSelectedHive(hiveToSave);
    }
    
    refreshData();
    setIsModalOpen(false);
    setFormData({ 
      species: Species.JATAI, 
      genetics: HiveGenetics.MIXED, 
      health: HiveHealth.MEDIUM, 
      boxType: 'INPA', 
      classification: HiveClassification.FILHA 
    });
  };

  const handleDeleteHive = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este enxame e todo seu histórico?')) {
      deleteHive(id);
      refreshData();
      if (selectedHive?.id === id) setSelectedHive(null);
    }
  };

  const handleExportWord = (hive: Hive) => {
    exportHiveToWord(hive);
  };

  const handleMoveHive = (index: number, direction: 'prev' | 'next') => {
    const newHives = [...hives];
    if (direction === 'prev' && index > 0) {
      [newHives[index], newHives[index - 1]] = [newHives[index - 1], newHives[index]];
    } else if (direction === 'next' && index < newHives.length - 1) {
      [newHives[index], newHives[index + 1]] = [newHives[index + 1], newHives[index]];
    } else {
      return;
    }
    setHives(newHives);
    saveHivesList(newHives);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900 font-sans">
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col z-10 shrink-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center space-x-2 text-honey-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-hexagon"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <span className="text-xl font-bold tracking-tight text-gray-900">Meli<span className="text-honey-600">Pro</span></span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <button 
            onClick={() => { setCurrentView('dashboard'); setSelectedHive(null); setIsReordering(false); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${currentView === 'dashboard' && !selectedHive ? 'bg-honey-50 text-honey-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={18} />
            <span>Painel Geral</span>
          </button>
          <button 
            onClick={() => { setCurrentView('hives'); setSelectedHive(null); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${currentView === 'hives' || selectedHive ? 'bg-honey-50 text-honey-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Grid size={18} />
            <span>Meus Enxames</span>
          </button>
          
          <div className="pt-4 mt-4 border-t border-gray-100">
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Relatórios Word</p>
            <button onClick={() => exportGeneralReportToWord()} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mb-1">
              <FileText size={16} className="text-blue-600" />
              <span>Inventário Geral (Word)</span>
            </button>
            <button onClick={() => exportAllInspectionsToWord()} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mb-1">
              <FileText size={16} className="text-honey-600" />
              <span>Manejos Geral (Word)</span>
            </button>
          </div>

          <div className="pt-2 mt-2 border-t border-gray-100">
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Exportar Dados (CSV)</p>
            <button onClick={() => exportInspectionsToCSV()} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mb-1">
              <FileSpreadsheet size={16} className="text-green-600" />
              <span>Manejos (CSV)</span>
            </button>
            <button onClick={() => exportHivesToCSV()} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Download size={16} className="text-gray-500" />
              <span>Inventário (CSV)</span>
            </button>
          </div>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-6 overflow-y-auto h-screen bg-gray-50/50">
        {selectedHive ? (
          <HiveDetail 
            hive={selectedHive} 
            onBack={() => { setSelectedHive(null); refreshData(); }} 
            onUpdateHive={(updated) => { setSelectedHive(updated); refreshData(); }} 
          />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                {currentView === 'dashboard' ? 'Visão Geral' : 'Enxames'}
              </h1>
              {currentView === 'hives' && (
                <div className="flex space-x-2 w-full sm:w-auto">
                    <button 
                      onClick={() => setIsReordering(!isReordering)}
                      className={`flex-1 sm:flex-none justify-center px-3 py-2 rounded-lg shadow-sm flex items-center transition-colors font-medium text-sm ${
                          isReordering ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {isReordering ? <><Check size={16} className="mr-2" /> Concluir</> : <><ArrowLeftRight size={16} className="mr-2" /> Organizar</>}
                    </button>
                    {!isReordering && (
                        <button onClick={handleOpenCreateModal} className="flex-1 sm:flex-none justify-center bg-honey-600 hover:bg-honey-700 text-white px-3 py-2 rounded-lg shadow-sm flex items-center transition-colors text-sm font-medium">
                          <Plus size={16} className="mr-2" /> Novo
                        </button>
                    )}
                </div>
              )}
            </div>
            {currentView === 'dashboard' && (
              <Dashboard 
                hives={hives} 
                inspections={inspections} 
                onSelectHive={(hive) => {
                  setSelectedHive(hive);
                }}
              />
            )}
            {currentView === 'hives' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-20">
                {hives.map((hive, index) => {
                  const hiveInspections = getInspectionsByHive(hive.id);
                  const lastInspection = hiveInspections.length > 0 ? hiveInspections[0] : null;
                  return (
                    <HiveCard 
                      key={hive.id} 
                      hive={hive} 
                      lastInspectionDate={lastInspection?.date}
                      lastInspectionType={lastInspection?.type}
                      onSelect={setSelectedHive}
                      onEdit={handleEditHive}
                      onDelete={handleDeleteHive} 
                      onExportWord={handleExportWord}
                      isReordering={isReordering}
                      onMovePrev={() => handleMoveHive(index, 'prev')}
                      onMoveNext={() => handleMoveHive(index, 'next')}
                      isFirst={index === 0}
                      isLast={index === hives.length - 1}
                    />
                  );
                })}
                {hives.length === 0 && (
                   <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                       <p className="mb-2">Nenhum enxame cadastrado.</p>
                       <button onClick={handleOpenCreateModal} className="text-honey-600 font-medium hover:underline">Cadastrar o primeiro</button>
                   </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">{formData.id ? 'Editar Enxame' : 'Cadastrar Novo Enxame'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveHive} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Identificação (Nome/Número)</label>
                  <input required type="text" className="w-full border-gray-300 rounded-lg p-2.5 focus:ring-honey-500 focus:border-honey-500 border" placeholder="Ex: CX-05" 
                    value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Espécie</label>
                  <select className="w-full border-gray-300 rounded-lg p-2.5 focus:ring-honey-500 focus:border-honey-500 border"
                    value={formData.species} onChange={e => setFormData({...formData, species: e.target.value as Species})}>
                    {Object.values(Species).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Foco Genético</label>
                   <select className="w-full border-gray-300 rounded-lg p-2.5 focus:ring-honey-500 focus:border-honey-500 border"
                     value={formData.genetics} onChange={e => setFormData({...formData, genetics: e.target.value as HiveGenetics})}>
                     {Object.values(HiveGenetics).map(g => <option key={g} value={g}>{g}</option>)}
                   </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modelo de Caixa</label>
                  <select className="w-full border-gray-300 rounded-lg p-2.5 focus:ring-honey-500 focus:border-honey-500 border"
                    value={formData.boxType} onChange={e => setFormData({...formData, boxType: e.target.value as any})}>
                    <option value="INPA">INPA</option>
                    <option value="AF">AF (Ailton Fontana)</option>
                    <option value="Rústica">Rústica/Tronco</option>
                    <option value="Outra">Outra</option>
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Data de Chegada</label>
                   <input type="date" className="w-full border-gray-300 rounded-lg p-2.5 focus:ring-honey-500 focus:border-honey-500 border"
                     value={formData.dateEstablished} onChange={e => setFormData({...formData, dateEstablished: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Última Intervenção Discos</label>
                   <input type="date" className="w-full border-gray-300 rounded-lg p-2.5 focus:ring-honey-500 focus:border-honey-500 border"
                     value={formData.lastInterventionDate || ''} onChange={e => setFormData({...formData, lastInterventionDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Força do Enxame</label>
                  <select className="w-full border-gray-300 rounded-lg p-2.5 focus:ring-honey-500 focus:border-honey-500 border"
                    value={formData.health} onChange={e => setFormData({...formData, health: e.target.value as HiveHealth})}>
                    {Object.values(HiveHealth).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classificação</label>
                  <select className="w-full border-gray-300 rounded-lg p-2.5 focus:ring-honey-500 focus:border-honey-500 border"
                    value={formData.classification} onChange={e => setFormData({...formData, classification: e.target.value as HiveClassification})}>
                    {Object.values(HiveClassification).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* NOVO CAMPO: ORIGEM */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origem do Enxame</label>
                  <div className="relative">
                    <Truck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      className="w-full border-gray-300 rounded-lg p-2.5 pl-10 focus:ring-honey-500 focus:border-honey-500 border" 
                      placeholder="Ex: Resgate, Divisão, Compra de [Nome], Captura..."
                      value={formData.origin || ''} 
                      onChange={e => setFormData({...formData, origin: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Localização (Colmeias)</label>
                  
                  {/* Presets / Opções Rápidas */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {locationPresets.map(loc => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setFormData({...formData, location: loc})}
                        className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                          formData.location === loc 
                          ? 'bg-honey-100 border-honey-500 text-honey-700 font-bold' 
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-white hover:border-honey-300'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      className="w-full border-gray-300 rounded-lg p-2.5 pl-10 focus:ring-honey-500 focus:border-honey-500 border" 
                      placeholder="Ou escreva uma localização personalizada..."
                      value={formData.location || ''} 
                      onChange={e => setFormData({...formData, location: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex gap-3 sticky bottom-0 bg-white border-t border-gray-100 py-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-honey-600 text-white rounded-lg hover:bg-honey-700 font-medium shadow-sm transition-colors">{formData.id ? 'Atualizar Enxame' : 'Salvar Enxame'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
