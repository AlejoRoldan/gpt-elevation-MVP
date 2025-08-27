(function (global) {
  const getDevicePixelRatio = () => Math.min(global.devicePixelRatio || 1, 2);

  function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = getDevicePixelRatio();
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
    return ctx;
  }

  function drawAxes(ctx, w, h, padding, showGrid = true) {
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, h - padding);
    ctx.lineTo(w - padding, h - padding);
    ctx.moveTo(padding, h - padding);
    ctx.lineTo(padding, padding);
    ctx.stroke();
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,.04)';
      ctx.setLineDash([5, 5]);
      for (let i = 1; i <= 4; i++) {
        const gy = padding + (i * (h - 2 * padding)) / 5;
        ctx.beginPath();
        ctx.moveTo(padding, gy);
        ctx.lineTo(w - padding, gy);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }

  function scaleLinear(domain, range) {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    const m = (r1 - r0) / (d1 - d0);
    return (v) => r0 + (v - d0) * m;
  }
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }


  function lineChart(canvas, dataSeries, opts = {}) {
    const ctx = setupCanvas(canvas);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const padding = 40;
    drawAxes(ctx, w, h, padding, opts.showGrid !== false);
    const allValues = dataSeries.flatMap((s) => s.data);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const x = scaleLinear([0, dataSeries[0].data.length - 1], [padding, w - padding]);
    const y = scaleLinear([min * 0.95, max * 1.05], [h - padding, padding]);
    dataSeries.forEach((s) => {
      if (opts.fillArea) {
        const gradient = ctx.createLinearGradient(0, padding, 0, h - padding);
        gradient.addColorStop(0, s.color + '40');
        gradient.addColorStop(1, s.color + '00');
        ctx.beginPath();
        ctx.moveTo(x(0), h - padding);
        s.data.forEach((v, i) => ctx.lineTo(x(i), y(v)));
        ctx.lineTo(x(s.data.length - 1), h - padding);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = s.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      s.data.forEach((v, i) => {
        const px = x(i);
        const py = y(v);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      if (opts.showPoints) {
        s.data.forEach((v, i) => {
          ctx.beginPath();
          ctx.arc(x(i), y(v), 3, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
    });
  }

  function sparkline(canvas, data, color = '#4f8cff') {
    const ctx = setupCanvas(canvas);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const x = scaleLinear([0, data.length - 1], [2, w - 2]);
    const y = scaleLinear([min * 0.9, max * 1.1], [h - 2, 2]);
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, color + '30');
    gradient.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.moveTo(x(0), h - 2);
    data.forEach((v, i) => ctx.lineTo(x(i), y(v)));
    ctx.lineTo(x(data.length - 1), h - 2);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x(0), y(data[0]));
    data.forEach((v, i) => ctx.lineTo(x(i), y(v)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function donutChart(canvas, segments, opts = {}) {
    const ctx = setupCanvas(canvas);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const radius = Math.min(w, h) / 2 - 10;
    const cx = w / 2;
    const cy = h / 2;
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    let start = -Math.PI / 2;
    segments.forEach((s) => {
      const angle = (s.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = radius * 0.6;
      ctx.arc(cx, cy, radius, start, start + angle);
      ctx.stroke();
      start += angle;
    });
    if (opts.centerText) {
      ctx.fillStyle = opts.centerColor || '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText(opts.centerText, cx, cy);
    }
  }

  function gaugeChart(canvas, value, opts = {}) {
    const ctx = setupCanvas(canvas);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const radius = Math.min(w, h) / 2 - 10;
    const cx = w / 2;
    const cy = h / 2;
    const start = Math.PI * 0.75;
    const end = Math.PI * 2.25;
    ctx.lineWidth = 10;
    ctx.strokeStyle = opts.bgColor || 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, end);
    ctx.stroke();
    ctx.strokeStyle = opts.color || '#42d392';
    const angle = start + (end - start) * clamp(value, 0, 1);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, angle);
    ctx.stroke();
    ctx.fillStyle = opts.textColor || '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px system-ui';
    ctx.fillText(Math.round(value * 100) + '%', cx, cy);
  }

  function autoResize(renderers) {
    global.addEventListener('resize', () => {
      renderers.forEach((r) => r());
    });
  }

  global.dashboardUtils = {
    setupCanvas,
    drawAxes,
    scaleLinear,
    lineChart,
    sparkline,
    donutChart,
    gaugeChart,
    autoResize,
  };
})(typeof window !== 'undefined' ? window : globalThis);
