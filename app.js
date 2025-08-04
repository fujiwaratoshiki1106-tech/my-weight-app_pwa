const form = document.getElementById('weight-form');
const dateInput = document.getElementById('date');
const weightInput = document.getElementById('weight');
const recordList = document.getElementById('record-list');
const viewMode = document.getElementById('view-mode');
let chart; // Chartインスタンス

window.addEventListener('DOMContentLoaded', () => {
  loadRecords();
  renderChart('daily');
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const date = dateInput.value;
  const weight = weightInput.value;
  if (!date || !weight) return;

  const record = { date, weight: parseFloat(weight) };
  saveRecord(record);
  appendRecordToList(record);
  form.reset();
  renderChart(viewMode.value);
});

viewMode.addEventListener('change', () => {
  renderChart(viewMode.value);
});

function saveRecord(record) {
  const records = JSON.parse(localStorage.getItem('records') || '[]');
  records.push(record);
  localStorage.setItem('records', JSON.stringify(records));
}

function loadRecords() {
  const records = JSON.parse(localStorage.getItem('records') || '[]');
  records.forEach(appendRecordToList);
}

// 📊 グラフ描画処理
function renderChart(mode) {
  const records = JSON.parse(localStorage.getItem('records') || '[]');
  const data = aggregateRecords(records, mode);

  const ctx = document.getElementById('weight-chart').getContext('2d');
  if (chart) chart.destroy(); // 既存のグラフを削除

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: '体重（kg）',
        data: data.values,
        borderColor: '#0077cc',
        backgroundColor: 'rgba(0, 119, 204, 0.2)',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          title: {
            display: true,
            text: '体重（kg）'
          }
        },
        x: {
          title: {
            display: true,
            text: '日付'
          }
        }
      }
    }
  });
}

// 🧮 集計処理（modeに応じて日/週/月/年でグループ化）
function aggregateRecords(records, mode) {
  const groups = {};

  records.forEach(r => {
    const d = new Date(r.date);
    let key;

    switch (mode) {
      case 'daily':
        key = r.date;
        break;
      case 'weekly':
        const y = d.getFullYear();
        const w = getWeekNumber(d);
        key = `${y}-W${w}`;
        break;
      case 'monthly':
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'yearly':
        key = `${d.getFullYear()}`;
        break;
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(r.weight);
  });

  const labels = Object.keys(groups).sort();
  const values = labels.map(k => {
    const sum = groups[k].reduce((a, b) => a + b, 0);
    return (sum / groups[k].length).toFixed(1);
  });

  return { labels, values };
}

// 📅 週番号取得（ISO準拠ではない簡易版）
function getWeekNumber(date) {
  const onejan = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

// 📄 表示用
function appendRecordToList(record) {
  const li = document.createElement('li');
  li.textContent = `${record.date}：${record.weight} kg`;
  recordList.appendChild(li);
}

// 📦 PWA登録
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}
