import React, { useState, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  Plus, Trash2, Save, Download, Eye, Settings, Target, Users,
} from 'lucide-react';
import { criteriaData, weightsData } from './criteria';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const TABS = [
  { id: 'showroom', name: 'Showroom', icon: Eye },
  { id: 'technical', name: 'Técnicos', icon: Settings },
  { id: 'business', name: 'Negocio', icon: Target },
  { id: 'culture', name: 'Cultura', icon: Users },
];

export default function ProjectDashboard() {
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('showroom');
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');

  const addProject = useCallback(() => {
    if (!newProjectName.trim()) return;
    const project = {
      id: crypto.randomUUID(),
      name: newProjectName.trim(),
      scores: {},
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [...prev, project]);
    setNewProjectName('');
  }, [newProjectName]);

  const deleteProject = useCallback((id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProject?.id === id) setSelectedProject(null);
  }, [selectedProject]);

  const updateScore = useCallback((projectId, criterionId, value) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, scores: { ...p.scores, [criterionId]: Number(value) } }
          : p
      )
    );
  }, []);

  const calculateProjectScore = useCallback((project) => {
    const weights = weightsData[activeTab];
    if (!weights) return 0;
    let totalScore = 0;
    let totalWeight = 0;
    Object.entries(weights).forEach(([id, weight]) => {
      const score = project.scores[id];
      if (score != null) {
        totalScore += score * weight;
        totalWeight += weight;
      }
    });
    return totalWeight ? +(totalScore / totalWeight).toFixed(2) : 0;
  }, [activeTab]);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => calculateProjectScore(b) - calculateProjectScore(a)),
    [projects, calculateProjectScore]
  );

  const barChartData = useMemo(
    () => sortedProjects.map(p => ({ name: p.name, score: calculateProjectScore(p) })),
    [sortedProjects, calculateProjectScore]
  );

  const pieData = useMemo(() => {
    const scores = sortedProjects.map(p => calculateProjectScore(p));
    const ranges = [
      { name: '0-25', value: scores.filter(s => s <= 25).length },
      { name: '26-50', value: scores.filter(s => s > 25 && s <= 50).length },
      { name: '51-75', value: scores.filter(s => s > 50 && s <= 75).length },
      { name: '76-100', value: scores.filter(s => s > 75).length },
    ];
    return ranges.filter(r => r.value);
  }, [sortedProjects, calculateProjectScore]);

  const renderCriteriaSection = (criteriaList, color) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {criteriaList.map(criterion => (
        <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-medium text-gray-900">{criterion.name}</h4>
              <p className="text-xs text-gray-500">{criterion.description}</p>
            </div>
            <span className={`text-xs bg-${color}-100 text-${color}-800 px-2 py-1 rounded`}>
              {weightsData[activeTab]?.[criterion.id] || 0}%
            </span>
          </div>
          <select
            value={selectedProject?.scores[criterion.id] ?? ''}
            onChange={e => updateScore(selectedProject.id, criterion.id, e.target.value)}
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleccionar...</option>
            {[1,2,3,4].map(n => (
              <option key={n} value={n}>{n} - {['Mínimo','Bajo','Medio','Alto'][n-1]}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Save className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">POC Evaluator Dashboard</h1>
                <p className="text-sm text-gray-500">Evalúa y prioriza tus pruebas de concepto</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Save className="h-4 w-4" />
                <span>Guardar</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Agregar Proyecto</h2>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="Nombre del proyecto"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={e => e.key === 'Enter' && addProject()}
                />
                <button
                  onClick={addProject}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Proyectos</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {sortedProjects.map(project => (
                  <div
                    key={project.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedProject?.id === project.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-500">Puntuación: {calculateProjectScore(project)}</p>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedProject ? (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Evaluar: {selectedProject.name}</h2>
                    <div className="text-2xl font-bold text-blue-600">{calculateProjectScore(selectedProject)}</div>
                  </div>
                </div>
                <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Criterios Comunes</h3>
                    {renderCriteriaSection(criteriaData.common, 'blue')}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Criterios {activeTab === 'showroom' ? 'Showroom' : activeTab === 'technical' ? 'Técnicos' : activeTab === 'business' ? 'de Negocio' : 'Culturales'}
                    </h3>
                    {renderCriteriaSection(criteriaData[activeTab] || [], 'green')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un proyecto</h3>
                <p className="text-gray-500">Elige un proyecto de la lista para comenzar la evaluación</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ranking de Proyectos</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0,4]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Puntuaciones</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`} fill="#8884d8" dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
