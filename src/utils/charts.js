import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const renderer = new ChartJSNodeCanvas({ width: 900, height: 450, backgroundColour: '#1e1e2e' });

export async function genererGraphiqueCA(statsParMois) {
  const labels = statsParMois.map(r => {
    const mois = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
    return mois[parseInt(r.mois) - 1];
  });

  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'CA (€)',
          data: statsParMois.map(r => r.ca?.toFixed(2) || 0),
          backgroundColor: 'rgba(180, 100, 255, 0.7)',
          borderColor: 'rgba(180, 100, 255, 1)',
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: 'y',
        },
        {
          label: 'Bénéfice brut (€)',
          data: statsParMois.map(r => r.benefice_brut?.toFixed(2) || 0),
          backgroundColor: 'rgba(80, 220, 160, 0.7)',
          borderColor: 'rgba(80, 220, 160, 1)',
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: 'y',
        },
        {
          label: 'Nb ventes',
          data: statsParMois.map(r => r.nb_ventes || 0),
          type: 'line',
          borderColor: 'rgba(255, 200, 80, 1)',
          backgroundColor: 'rgba(255, 200, 80, 0.1)',
          borderWidth: 2,
          pointRadius: 5,
          fill: true,
          yAxisID: 'y2',
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          labels: { color: '#cdd6f4', font: { size: 13 } },
        },
        title: {
          display: true,
          text: 'Évolution CA & Bénéfice par mois',
          color: '#cdd6f4',
          font: { size: 18, weight: 'bold' },
        },
      },
      scales: {
        x: { ticks: { color: '#cdd6f4' }, grid: { color: '#313244' } },
        y: {
          ticks: { color: '#cdd6f4', callback: v => v + ' €' },
          grid: { color: '#313244' },
          position: 'left',
        },
        y2: {
          ticks: { color: '#fab387' },
          grid: { drawOnChartArea: false },
          position: 'right',
        },
      },
    },
  };

  return renderer.renderToBuffer(config);
}

export async function genererGraphiqueMeilleuresVentes(ventes) {
  const top = ventes.slice(0, 8);
  const config = {
    type: 'horizontalBar',
    data: {
      labels: top.map(v => v.article),
      datasets: [{
        label: 'Bénéfice (€)',
        data: top.map(v => v.benefice?.toFixed(2) || 0),
        backgroundColor: top.map((_, i) => `hsl(${260 + i * 15}, 70%, 60%)`),
        borderRadius: 6,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Top articles par bénéfice',
          color: '#cdd6f4',
          font: { size: 18, weight: 'bold' },
        },
      },
      scales: {
        x: {
          ticks: { color: '#cdd6f4', callback: v => v + ' €' },
          grid: { color: '#313244' },
        },
        y: { ticks: { color: '#cdd6f4' }, grid: { color: '#313244' } },
      },
    },
  };

  return renderer.renderToBuffer(config);
}
