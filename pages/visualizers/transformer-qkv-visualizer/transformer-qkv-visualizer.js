/* ============================================
   QKV Transformer Visualizer Logic
   ============================================ */
/* global d3 */

document.addEventListener('DOMContentLoaded', () => {
  const btnGenerate = document.getElementById('btnGenerate');
  const promptInput = document.getElementById('promptInput');
  const container = document.getElementById('d3Container');
  const emptyState = document.getElementById('emptyState');
  const tooltip = document.getElementById('tooltip');

  // Pseudo-random number generator for deterministic matrices
  function seedRandom(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  // Softmax over an array of numbers
  function softmax(arr) {
    const max = Math.max(...arr);
    const exp = arr.map((x) => Math.exp(x - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map((x) => x / sum);
  }

  btnGenerate.addEventListener('click', generateVisualization);

  function generateVisualization() {
    const text = promptInput.value.trim();
    if (!text) return;

    // Tokenize by splitting on spaces (simple word-level tokenization)
    const tokens = text.split(/\s+/).filter((t) => t.length > 0);
    if (tokens.length === 0) return;

    emptyState.classList.add('hidden');
    container.innerHTML = ''; // Clear previous

    // Parameters for dummy matrices
    const d_model = 16;
    const N = tokens.length;

    // Generate simulated Q, K, V
    // Instead of full matrices, we directly simulate the Q.K^T matrix to look somewhat realistic
    // but we'll show the mathematical tooltip

    const attentionMatrix = [];

    for (let i = 0; i < N; i++) {
      const qHash = hashString(tokens[i] + '_Q');
      let rawScores = [];

      for (let j = 0; j < N; j++) {
        const kHash = hashString(tokens[j] + '_K');

        // Compute a pseudo-score
        // Real attention usually has high self-attention (i == j),
        // some local attention (abs(i-j) == 1), and semantic matches.

        let score = 0;

        if (i === j) {
          score += 4.0; // Self-attention boost
        } else if (Math.abs(i - j) === 1) {
          score += 1.5; // Local context boost
        }

        // Add deterministic pseudo-random semantic noise
        const seed = qHash ^ kHash;
        const noise = seedRandom(seed) * 3 - 1.5;
        score += noise;

        // If same word appears twice, boost attention between them
        if (tokens[i].toLowerCase() === tokens[j].toLowerCase() && i !== j) {
          score += 3.0;
        }

        rawScores.push(score);
      }

      // Apply scale (1 / sqrt(d_model))
      rawScores = rawScores.map((s) => s / Math.sqrt(d_model));

      // Apply Softmax
      const attnWeights = softmax(rawScores);

      // Store in matrix
      for (let j = 0; j < N; j++) {
        attentionMatrix.push({
          row: i,
          col: j,
          queryToken: tokens[i],
          keyToken: tokens[j],
          rawScore: rawScores[j], // Pre-softmax
          attention: attnWeights[j], // Post-softmax
        });
      }
    }

    drawHeatmap(tokens, attentionMatrix);
  }

  function drawHeatmap(tokens, data) {
    const N = tokens.length;

    // Calculate dimensions based on container and tokens
    const rect = container.getBoundingClientRect();
    const margin = { top: 100, right: 50, bottom: 50, left: 100 };

    // We want square cells, so we figure out the max cell size that fits
    const maxW = rect.width - margin.left - margin.right;
    const maxH = rect.height - margin.top - margin.bottom;

    const maxCellSize = 60;
    const cellSize = Math.min(Math.min(maxW, maxH) / N, maxCellSize);

    const width = cellSize * N;
    const height = cellSize * N;

    // Create SVG
    const svg = d3
      .select('#d3Container')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale mapping [0, 1] to our CSS variables
    // Use D3 interpolator from a dark color to a bright red/orange
    const colorScale = d3.scaleSequential(d3.interpolateInferno).domain([0, 1]);

    // Draw cells
    const cells = svg
      .selectAll('.cell')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', (d) => d.col * cellSize)
      .attr('y', (d) => d.row * cellSize)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 4)
      .attr('ry', 4)
      .style('fill', (d) => colorScale(d.attention))
      .style('opacity', 0)
      .on('mouseover', function (event, d) {
        // Highlight row and col labels
        svg.selectAll('.row-label').classed('active', (l) => l.index === d.row);
        svg.selectAll('.col-label').classed('active', (l) => l.index === d.col);

        // Show tooltip
        tooltip.classList.remove('hidden');
        tooltip.innerHTML = `
          <div style="margin-bottom: 5px;">
            <span class="highlight query">Query:</span> ${d.queryToken} <br/>
            <span class="highlight key">Key:</span> ${d.keyToken}
          </div>
          <div style="font-size: 0.8rem; color: #aaa;">
            Q·K<sup>T</sup> / &radic;d: ${d.rawScore.toFixed(3)}<br/>
            Attention Weight: <strong style="color:white">${(d.attention * 100).toFixed(1)}%</strong>
          </div>
        `;

        const tWidth = tooltip.offsetWidth;
        const tHeight = tooltip.offsetHeight;

        let tx = event.pageX + 15;
        let ty = event.pageY + 15;

        if (tx + tWidth > window.innerWidth) tx = event.pageX - tWidth - 15;
        if (ty + tHeight > window.innerHeight) ty = event.pageY - tHeight - 15;

        tooltip.style.left = tx + 'px';
        tooltip.style.top = ty + 'px';
      })
      .on('mouseout', function () {
        svg.selectAll('.row-label').classed('active', false);
        svg.selectAll('.col-label').classed('active', false);
        tooltip.classList.add('hidden');
      });

    // Animate cells appearing
    cells
      .transition()
      .duration(500)
      .delay((d) => (d.row * N + d.col) * (1000 / (N * N)))
      .style('opacity', 1);

    // Row labels (Queries)
    svg
      .selectAll('.row-label')
      .data(tokens.map((t, i) => ({ token: t, index: i })))
      .enter()
      .append('text')
      .text((d) => d.token)
      .attr('class', 'row-label')
      .attr('x', -10)
      .attr('y', (d) => d.index * cellSize + cellSize / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .style('opacity', 1);

    // Column labels (Keys)
    svg
      .selectAll('.col-label')
      .data(tokens.map((t, i) => ({ token: t, index: i })))
      .enter()
      .append('text')
      .text((d) => d.token)
      .attr('class', 'col-label')
      .attr('x', (d) => d.index * cellSize + cellSize / 2)
      .attr('y', -10)
      .attr('text-anchor', 'start')
      .attr('transform', (d) => `rotate(-45, ${d.index * cellSize + cellSize / 2}, -10)`)
      .style('opacity', 0)
      .transition()
      .duration(800)
      .style('opacity', 1);
  }
});
