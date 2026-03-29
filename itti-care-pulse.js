const { lineChart, sparkline, donutChart, gaugeChart, autoResize } = window.dashboardUtils;

const $ = (sel) => document.querySelector(sel);

const formatPercent = (value) => `${value.toFixed(1)}%`;
const formatNumber = (value) => value.toLocaleString('es-PY');
const formatHours = (value) => `${value.toFixed(1)} h`;

const seedAreas = [
  'Operaciones',
  'Atención al Cliente',
  'Tecnología',
  'Finanzas',
  'Legal',
  'Compliance',
  'Comercial',
  'Bienestar',
];

const palette = {
  primary: '#4f8cff',
  accent: '#42d392',
  warn: '#ffb020',
  danger: '#ff5d5d',
  info: '#7aa2ff',
};

const state = {
  metrics: null,
  series: null,
  areas: null,
};

const rand = (min, max) => Math.random() * (max - min) + min;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smoothSeries = (base, variation = 1) =>
  base.map((val, idx) => clamp(val + rand(-variation, variation) + idx * 0.05, 0, 100));

const buildMetrics = () => {
  const ausentismo = rand(2.4, 3.6);
  const deltaAus = rand(-0.9, -0.2);
  const diasEvitados = Math.round(rand(120, 180));
  const roi = rand(1.4, 2.1);
  const adopcion = rand(68, 82);
  const adopcionSplit = `${Math.round(rand(45, 55))}% BYOD / ${Math.round(rand(45, 55))}% Kit`;
  const nps = Math.round(rand(52, 68));
  const alertas = rand(84, 92);
  const hrvScore = rand(0.68, 0.82);
  const hrScore = rand(0.52, 0.66);

  return {
    ausentismo,
    deltaAus,
    diasEvitados,
    roi,
    adopcion,
    adopcionSplit,
    nps,
    alertas,
    hrvScore,
    hrScore,
  };
};

const buildSeries = () => {
  const base = Array.from({ length: 12 }, () => rand(3.6, 4.4));
  const actual = base.map((val) => clamp(val - rand(0.4, 1.2), 2.2, 4.2));
  const objetivo = base.map((val) => clamp(val - 0.8, 2.2, 3.6));

  const habitsBase = Array.from({ length: 10 }, () => rand(68, 78));
  const sleepBase = Array.from({ length: 10 }, () => rand(6.2, 7.6));

  return {
    ausentismo: { base, actual, objetivo },
    habitos: smoothSeries(habitsBase, 1.8),
    sueno: smoothSeries(sleepBase, 0.4),
    spark: {
      ausentismo: smoothSeries(Array.from({ length: 14 }, () => rand(2.8, 3.8)), 0.4),
      dias: smoothSeries(Array.from({ length: 14 }, () => rand(110, 180)), 5),
      roi: smoothSeries(Array.from({ length: 14 }, () => rand(1.2, 2.4)), 0.1),
      adopcion: smoothSeries(Array.from({ length: 14 }, () => rand(60, 84)), 1.4),
      nps: smoothSeries(Array.from({ length: 14 }, () => rand(46, 70)), 1.6),
      alertas: smoothSeries(Array.from({ length: 14 }, () => rand(78, 96)), 1.4),
    },
  };
};

const buildAreas = () =>
  seedAreas.map((area) => {
    const ausentismo = rand(2.2, 3.9);
    const delta = rand(-1.1, 0.4);
    const actividad = Math.round(rand(140, 220));
    const sueno = rand(6.1, 7.8);
    const alertas = rand(74, 96);
    return { area, ausentismo, delta, actividad, sueno, alertas };
  });

const renderKpis = (metrics) => {
  $('#kpiAusentismo').textContent = formatPercent(metrics.ausentismo);
  const deltaLabel = metrics.deltaAus >= 0 ? `+${metrics.deltaAus.toFixed(1)}%` : `${metrics.deltaAus.toFixed(1)}%`;
  $('#kpiDeltaAus').textContent = deltaLabel;
  $('#kpiDeltaAus').className = `delta ${metrics.deltaAus <= 0 ? 'up' : 'down'}`;

  $('#kpiDias').textContent = formatNumber(metrics.diasEvitados);
  $('#kpiROI').textContent = `${metrics.roi.toFixed(2)}x`;
  $('#kpiAdop').textContent = formatPercent(metrics.adopcion);
  $('#kpiAdopSplit').textContent = metrics.adopcionSplit;
  $('#kpiNPS').textContent = metrics.nps;
  $('#kpiAlertas').textContent = formatPercent(metrics.alertas);
  $('#kpiAlertasRate').textContent = metrics.alertas > 85 ? 'Alto cumplimiento' : 'En recuperación';
};

const renderSparks = (series) => {
  if (!series) return;
  sparkline($('#sparkAus'), series.spark.ausentismo, palette.warn);
  sparkline($('#sparkDias'), series.spark.dias, palette.accent);
  sparkline($('#sparkROI'), series.spark.roi, palette.primary);
  sparkline($('#sparkAdop'), series.spark.adopcion, palette.info);
  sparkline($('#sparkNPS'), series.spark.nps, palette.primary);
  sparkline($('#sparkAlert'), series.spark.alertas, palette.accent);
};

const renderCharts = (metrics, series) => {
  if (!metrics || !series) return;
  lineChart($('#chartAus'), [
    { data: series.ausentismo.base, color: palette.info },
    { data: series.ausentismo.actual, color: palette.accent },
    { data: series.ausentismo.objetivo, color: palette.warn },
  ], { fillArea: true, showPoints: true });

  donutChart($('#chartDonut'), [
    { value: metrics.adopcion, color: palette.accent },
    { value: 100 - metrics.adopcion, color: '#263451' },
  ], { centerText: `${Math.round(metrics.adopcion)}%`, centerColor: '#e7eefc' });

  lineChart($('#chartHabitos'), [
    { data: series.habitos, color: palette.accent },
  ], { fillArea: true, showPoints: true });

  lineChart($('#chartSleep'), [
    { data: series.sueno, color: palette.primary },
  ], { fillArea: true, showPoints: true });

  gaugeChart($('#gaugeHrv'), clamp(metrics.hrvScore, 0, 1), {
    color: palette.accent,
    textColor: '#e7eefc',
  });

  gaugeChart($('#gaugeHr'), clamp(metrics.hrScore, 0, 1), {
    color: palette.warn,
    textColor: '#e7eefc',
  });
};

const renderAreas = (areas) => {
  const tbody = $('#tbodyAreas');
  tbody.innerHTML = '';
  areas.forEach((row) => {
    const tr = document.createElement('tr');
    const deltaLabel = row.delta >= 0 ? `+${row.delta.toFixed(1)}%` : `${row.delta.toFixed(1)}%`;
    tr.innerHTML = `
      <td>${row.area}</td>
      <td>${formatPercent(row.ausentismo)}</td>
      <td style="color:${row.delta < 0 ? palette.accent : palette.danger}">${deltaLabel}</td>
      <td>${row.actividad}</td>
      <td>${formatHours(row.sueno)}</td>
      <td>${formatPercent(row.alertas)}</td>
    `;
    tbody.appendChild(tr);
  });
};

const buildCSV = (metrics, areas) => {
  const lines = [
    ['Indicador', 'Valor'],
    ['Ausentismo mensual', formatPercent(metrics.ausentismo)],
    ['Días evitados', metrics.diasEvitados],
    ['ROI mensual', `${metrics.roi.toFixed(2)}x`],
    ['Adopción activa', formatPercent(metrics.adopcion)],
    ['NPS Bienestar', metrics.nps],
    ['Alertas resueltas', formatPercent(metrics.alertas)],
    [],
    ['Área', 'Ausentismo', '∆ vs baseline', 'Actividad (min/sem)', 'Sueño útil (h)', 'Alertas resueltas'],
    ...areas.map((row) => [
      row.area,
      formatPercent(row.ausentismo),
      `${row.delta.toFixed(1)}%`,
      row.actividad,
      row.sueno.toFixed(1),
      formatPercent(row.alertas),
    ]),
  ];

  return lines
    .map((line) => line.map((item) => `"${item}"`).join(','))
    .join('\n');
};

const downloadCSV = (metrics, areas) => {
  const blob = new Blob([buildCSV(metrics, areas)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'itti-care-pulse.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const setLoading = (isLoading) => {
  document.querySelectorAll('.card').forEach((card) => {
    card.classList.toggle('loading', isLoading);
  });
};

const refreshDashboard = () => {
  setLoading(true);
  state.metrics = buildMetrics();
  state.series = buildSeries();
  state.areas = buildAreas();

  window.setTimeout(() => {
    renderKpis(state.metrics);
    renderSparks(state.series);
    renderCharts(state.metrics, state.series);
    renderAreas(state.areas);
    setLoading(false);
  }, 450);
};

const setDefaultMonth = () => {
  const input = $('#rango');
  if (!input) return;
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  input.value = `${now.getFullYear()}-${month}`;
};

const setupActions = () => {
  $('#refreshBtn').addEventListener('click', refreshDashboard);
  $('#exportBtn').addEventListener('click', () => downloadCSV(state.metrics, state.areas));
  $('#langBtn').addEventListener('click', () => {
    const current = $('#langBtn').textContent.trim();
    $('#langBtn').textContent = current === 'ES / GN' ? 'GN / ES' : 'ES / GN';
  });
};

const initDashboard = () => {
  setDefaultMonth();
  refreshDashboard();
  setupActions();
  autoResize([
    () => renderSparks(state.series),
    () => renderCharts(state.metrics, state.series),
  ]);
};

window.addEventListener('DOMContentLoaded', initDashboard);
