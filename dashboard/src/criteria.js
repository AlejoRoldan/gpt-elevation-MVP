export const criteriaData = {
  common: [
    { id: 'ai', name: 'AI-Driven', description: 'Nivel de integración de IA en el diseño de la experiencia' },
    { id: 'ecosystem', name: 'Visión ecosistémica', description: 'Nivel de impacto en los diferentes ecosistemas' },
    { id: 'strategy', name: 'Estrategia', description: 'Nivel de alineación objetivos estratégicos del área tecno emergentes' },
    { id: 'data', name: 'Data - Driven', description: 'Grado en que la iniciativa se apalanza en datos como activo estratégico' },
    { id: 'sustainability', name: 'Sostenibilidad', description: 'Grado en que la iniciativa logra triple cuenta de resultado (TBL)' },
    { id: 'maturity', name: 'Madurez de la tecnología', description: 'Nivel de estabilidad y disponibilidad (TRL)' },
    { id: 'regulation', name: 'Fricción regulatoria', description: 'Nivel de fricción regulatoria para la implementación de la POC' },
  ],
  showroom: [
    { id: 'innovation', name: 'Innovación', description: 'Nivel de innovación de la implementación a nivel sectorial o geográfico' },
    { id: 'reputation', name: 'Generación de reputación / Top of mind', description: 'Potencial para posicionar la marca y generar conversación/PR' },
    { id: 'demo', name: 'Preparación demo rápida', description: 'Qué tan rápido se puede presentar una demo de alto impacto' },
    { id: 'cost', name: 'Costo piloto', description: 'Nivel de inversión para la POC' },
  ],
  technical: [
    { id: 'agility', name: 'Agilidad de la prueba y validación', description: 'Velocidad para testear hipótesis técnicas y obtener aprendizajes' },
    { id: 'independence', name: 'Independencia de otros entornos', description: 'Facilidad de desarrollar sin depender de integraciones críticas' },
    { id: 'reuse', name: 'Reuso de recursos existentes', description: 'Aprovechamiento de infraestructura, código y equipos ya disponibles' },
  ],
  business: [
    { id: 'customer', name: 'Impacto en el cliente/usuario final Fidelización', description: 'Mejora de experiencia o resolución de pain points críticos' },
    { id: 'competitive', name: 'Ventaja competitiva / diferenciación', description: 'Diferenciador claro y sostenible frente a competidores' },
    { id: 'scalability', name: 'Potencial de escalabilidad', description: 'Capacidad de crecer técnica y comercialmente' },
  ],
  culture: [
    { id: 'efficiency', name: 'Hipótesis de generación de valor (eficiencia)', description: 'Beneficios esperados: ahorro, productividad' },
    { id: 'production', name: 'Madurez para producción', description: 'Preparación para pasar a producción interna sin riesgos mayores' },
  ],
};

export const weightsData = {
  showroom: {
    ai: 6, ecosystem: 6, strategy: 10, data: 6, sustainability: 6, maturity: 6,
    innovation: 20, reputation: 20, demo: 10, cost: 10, agility: 10, independence: 20, reuse: 15,
  },
  technical: {
    ai: 6, ecosystem: 7, strategy: 10, data: 6, sustainability: 6, maturity: 20,
    agility: 10, independence: 20, reuse: 15,
  },
  business: {
    ai: 6, ecosystem: 10, strategy: 10, data: 6, sustainability: 6, maturity: 7,
    customer: 20, competitive: 20, scalability: 15,
  },
  culture: {
    ai: 9, ecosystem: 4, strategy: 10, data: 7, sustainability: 10, maturity: 10,
    efficiency: 30, production: 15,
  },
};
