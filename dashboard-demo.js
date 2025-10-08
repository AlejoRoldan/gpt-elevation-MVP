const { sparkline, donutChart, gaugeChart, lineChart, autoResize } = dashboardUtils;

const sparkData = [5, 6, 7, 9, 5, 3, 4, 6, 8, 7];
const donutData = [
  { value: 55, color: '#4f8cff' },
  { value: 30, color: '#42d392' },
  { value: 15, color: '#ffb020' }
];
const gaugeValue = 0.72;
const lineSeries = [
  { data: [3, 4, 6, 4, 3, 5, 6, 7, 8, 7, 6, 5], color: '#7aa2ff' },
  { data: [2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 3], color: '#42d392' }
];

function renderDemo() {
  sparkline(document.getElementById('demoSpark'), sparkData, '#4f8cff');
  donutChart(document.getElementById('demoDonut'), donutData, { centerText: 'Demo' });
  gaugeChart(document.getElementById('demoGauge'), gaugeValue, { color: '#ff5d5d' });
  lineChart(document.getElementById('demoLine'), lineSeries, { fillArea: true, showPoints: true });
}

window.addEventListener('DOMContentLoaded', () => {
  renderDemo();
  autoResize([renderDemo]);
});
