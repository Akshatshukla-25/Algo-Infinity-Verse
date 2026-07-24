/**
 * RabbitMQ Messaging Visualizer
 * Core AMQP Simulation Engine
 * Algo Infinity Verse
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── Global State ──
  let isRunning = true;
  let autoConsume = true;
  let simulateFailures = false;
  let simSpeed = 1.0;
  let msgCounter = 0;
  let selectedMsgId = null;

  const MAX_RETRIES = 3;

  // Telemetry stats
  const stats = {
    published: 0,
    acked: 0,
    retried: 0,
    dlq: 0,
    recentCount: 0,
  };

  // Queues State
  const queues = {
    orders_queue: [],
    retry_queue: [],
    logs_queue: [],
    notifications_queue: [],
    dlq_queue: [],
  };

  // Active Bindings State
  // { exchange, queue, routingKey, headers, xMatch }
  let bindings = [];

  // Consumers State
  // { id, queueId, name, state: 'idle'|'working'|'failing' }
  let consumers = [];

  // ── Initial Bindings & Setup ──
  function initDefaultBindings() {
    bindings = [
      { exchange: 'amq.direct', queue: 'orders_queue', routingKey: 'orders.created' },
      { exchange: 'amq.direct', queue: 'logs_queue', routingKey: 'logs.info' },
      { exchange: 'amq.topic', queue: 'orders_queue', routingKey: 'orders.*' },
      { exchange: 'amq.topic', queue: 'logs_queue', routingKey: 'logs.*.error' },
      { exchange: 'amq.topic', queue: 'notifications_queue', routingKey: 'logs.#' },
      { exchange: 'amq.fanout', queue: 'orders_queue', routingKey: '' },
      { exchange: 'amq.fanout', queue: 'logs_queue', routingKey: '' },
      { exchange: 'amq.fanout', queue: 'notifications_queue', routingKey: '' },
      {
        exchange: 'amq.headers',
        queue: 'orders_queue',
        xMatch: 'all',
        headers: { format: 'pdf', type: 'invoice' },
      },
      { exchange: 'amq.dlx', queue: 'dlq_queue', routingKey: '' },
    ];
  }

  function initDefaultConsumers() {
    consumers = [
      { id: 'c1', queueId: 'orders_queue', name: 'Order Worker A', state: 'idle' },
      { id: 'c2', queueId: 'logs_queue', name: 'Log Ingestor B', state: 'idle' },
      { id: 'c3', queueId: 'notifications_queue', name: 'Notifier Worker C', state: 'idle' },
    ];
  }

  // ── Element References ──
  const pubExchange = document.getElementById('pubExchange');
  const pubRoutingKey = document.getElementById('pubRoutingKey');
  const pubHeaders = document.getElementById('pubHeaders');
  const pubPayload = document.getElementById('pubPayload');
  const pubTTL = document.getElementById('pubTTL');
  const routingKeyGroup = document.getElementById('routingKeyGroup');
  const headersGroup = document.getElementById('headersGroup');

  const btnPublishMsg = document.getElementById('btnPublishMsg');
  const btnBurstStream = document.getElementById('btnBurstStream');
  const scenarioPreset = document.getElementById('scenarioPreset');
  const btnLoadPreset = document.getElementById('btnLoadPreset');

  const btnPlayPauseSim = document.getElementById('btnPlayPauseSim');
  const lblPlayPause = document.getElementById('lblPlayPause');
  const btnStepSim = document.getElementById('btnStepSim');
  const btnResetSim = document.getElementById('btnResetSim');
  const simSpeedInput = document.getElementById('simSpeed');
  const speedVal = document.getElementById('speedVal');
  const chkAutoConsume = document.getElementById('chkAutoConsume');
  const chkSimulateFailures = document.getElementById('chkSimulateFailures');

  const btnToggleBindingForm = document.getElementById('btnToggleBindingForm');
  const bindingForm = document.getElementById('bindingForm');
  const bindExchange = document.getElementById('bindExchange');
  const bindQueue = document.getElementById('bindQueue');
  const bindRoutingKey = document.getElementById('bindRoutingKey');
  const bindXMatch = document.getElementById('bindXMatch');
  const bindKeyContainer = document.getElementById('bindKeyContainer');
  const bindMatchContainer = document.getElementById('bindMatchContainer');
  const btnCreateBinding = document.getElementById('btnCreateBinding');
  const bindingsList = document.getElementById('bindingsList');

  const btnAddConsumer = document.getElementById('btnAddConsumer');
  const consumersContainer = document.getElementById('consumersContainer');

  const logConsole = document.getElementById('logConsole');
  const btnClearLogs = document.getElementById('btnClearLogs');

  const metricPublished = document.getElementById('metricPublished');
  const metricAcked = document.getElementById('metricAcked');
  const metricRetried = document.getElementById('metricRetried');
  const metricDLQ = document.getElementById('metricDLQ');
  const rateVal = document.getElementById('rateVal');
  const rateFill = document.getElementById('rateFill');

  const inspectMsgId = document.getElementById('inspectMsgId');
  const inspectorContent = document.getElementById('inspectorContent');
  const inspectorActions = document.getElementById('inspectorActions');
  const btnManualAck = document.getElementById('btnManualAck');
  const btnManualNack = document.getElementById('btnManualNack');
  const btnManualReject = document.getElementById('btnManualReject');

  const flowSvgLayer = document.getElementById('flowSvgLayer');

  // ── Topic Wildcard Pattern Matcher ──
  function matchTopic(pattern, key) {
    if (pattern === '#') return true;
    if (!pattern || !key) return pattern === key;

    const patternTokens = pattern.split('.');
    const keyTokens = key.split('.');

    function matchHelper(pi, ki) {
      if (pi === patternTokens.length && ki === keyTokens.length) return true;
      if (pi === patternTokens.length) return false;

      const pToken = patternTokens[pi];

      if (pToken === '#') {
        // '#' matches 0 or more words
        if (matchHelper(pi + 1, ki)) return true;
        if (ki < keyTokens.length && matchHelper(pi, ki + 1)) return true;
        return false;
      }

      if (ki === keyTokens.length) return false;

      if (pToken === '*' || pToken === keyTokens[ki]) {
        return matchHelper(pi + 1, ki + 1);
      }

      return false;
    }

    return matchHelper(0, 0);
  }

  // ── Headers Matching Logic ──
  function matchHeaders(msgHeaders, bindingHeaders, xMatch) {
    if (!msgHeaders || !bindingHeaders) return false;
    const keys = Object.keys(bindingHeaders);
    if (keys.length === 0) return false;

    if (xMatch === 'any') {
      return keys.some((k) => msgHeaders[k] === bindingHeaders[k]);
    } else {
      // default: all
      return keys.every((k) => msgHeaders[k] === bindingHeaders[k]);
    }
  }

  // ── Logging Helper ──
  function logEvent(type, message) {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.innerHTML = `<span class="timestamp">[${timeStr}]</span> ${message}`;
    logConsole.appendChild(line);
    logConsole.scrollTop = logConsole.scrollHeight;

    // Keep last 100 lines
    while (logConsole.children.length > 100) {
      logConsole.removeChild(logConsole.firstChild);
    }
  }

  // ── UI Form Handlers ──
  pubExchange.addEventListener('change', () => {
    const ex = pubExchange.value;
    if (ex === 'amq.headers') {
      headersGroup.classList.remove('hidden');
      routingKeyGroup.classList.add('hidden');
    } else if (ex === 'amq.fanout') {
      headersGroup.classList.add('hidden');
      routingKeyGroup.classList.add('hidden');
    } else {
      headersGroup.classList.add('hidden');
      routingKeyGroup.classList.remove('hidden');
    }
  });

  bindExchange.addEventListener('change', () => {
    if (bindExchange.value === 'amq.headers') {
      bindMatchContainer.classList.remove('hidden');
      bindKeyContainer.classList.add('hidden');
    } else {
      bindMatchContainer.classList.add('hidden');
      bindKeyContainer.classList.remove('hidden');
    }
  });

  btnToggleBindingForm.addEventListener('click', () => {
    bindingForm.classList.toggle('hidden');
  });

  btnCreateBinding.addEventListener('click', () => {
    const ex = bindExchange.value;
    const q = bindQueue.value;
    const key = bindRoutingKey.value.trim();
    const xMatch = bindXMatch.value;

    const newBind = { exchange: ex, queue: q, routingKey: key, xMatch };
    if (ex === 'amq.headers') {
      newBind.headers = { format: 'pdf', type: 'invoice' };
    }
    bindings.push(newBind);
    renderBindingsList();
    drawConnectionLines();
    logEvent(
      'sys',
      `Added binding: <strong>${ex}</strong> ➔ <strong>${q}</strong> (${key || 'all'})`
    );
  });

  function renderBindingsList() {
    bindingsList.innerHTML = '';
    bindings.forEach((b, idx) => {
      const item = document.createElement('div');
      item.className = 'binding-item';
      const routeText =
        b.exchange === 'amq.headers' ? `x-match:${b.xMatch}` : b.routingKey || 'broadcast';
      item.innerHTML = `
                <span><strong>${b.exchange}</strong> ➔ ${b.queue}</span>
                <span class="bind-route">[${routeText}]</span>
                <button type="button" class="btn-remove-bind" data-idx="${idx}"><i class="fas fa-trash"></i></button>
            `;
      bindingsList.appendChild(item);
    });

    bindingsList.querySelectorAll('.btn-remove-bind').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
        bindings.splice(idx, 1);
        renderBindingsList();
        drawConnectionLines();
      });
    });
  }

  // ── AMQP Publish Engine ──
  function createMessage(exchange, routingKey, payload, headers, ttl) {
    msgCounter++;
    return {
      id: `msg_${msgCounter}`,
      exchange,
      routingKey,
      payload,
      headers: headers || {},
      ttl: parseInt(ttl) || 0,
      retries: 0,
      publishedAt: new Date().toLocaleTimeString(),
      history: [`Published to ${exchange}`],
    };
  }

  function publishMessage() {
    const exchange = pubExchange.value;
    const key = pubRoutingKey.value.trim();
    const payload = pubPayload.value.trim() || `Payload #${msgCounter + 1}`;
    const ttl = pubTTL.value;

    let headers = {};
    if (exchange === 'amq.headers') {
      try {
        headers = JSON.parse(pubHeaders.value);
      } catch (err) {
        headers = { format: 'pdf', type: 'invoice' };
      }
    }

    const msg = createMessage(exchange, key, payload, headers, ttl);
    stats.published++;
    stats.recentCount++;
    updateStatsUI();

    logEvent(
      'pub',
      `Published <strong>[${msg.id}]</strong> to <em>${exchange}</em> (Key: '${key}')`
    );
    animateProducerPulse();

    // Evaluate Routing
    routeMessage(msg);
  }

  function routeMessage(msg) {
    const targetQueues = new Set();
    const ex = msg.exchange;

    bindings.forEach((b) => {
      if (b.exchange !== ex) return;

      if (ex === 'amq.direct') {
        if (b.routingKey === msg.routingKey) {
          targetQueues.add(b.queue);
        }
      } else if (ex === 'amq.topic') {
        if (matchTopic(b.routingKey, msg.routingKey)) {
          targetQueues.add(b.queue);
        }
      } else if (ex === 'amq.fanout') {
        targetQueues.add(b.queue);
      } else if (ex === 'amq.headers') {
        if (matchHeaders(msg.headers, b.headers, b.xMatch)) {
          targetQueues.add(b.queue);
        }
      } else if (ex === 'amq.dlx') {
        targetQueues.add(b.queue);
      }
    });

    const exNode = document.querySelector(`.exchange-node[data-exchange="${ex}"]`);
    if (exNode) {
      exNode.classList.add('active');
      setTimeout(() => exNode.classList.remove('active'), 500);
    }

    if (targetQueues.size === 0) {
      logEvent(
        'nack',
        `Message <strong>[${msg.id}]</strong> unrouted (No matching queue bindings for exchange ${ex})`
      );
      return;
    }

    targetQueues.forEach((qName) => {
      const msgClone = JSON.parse(JSON.stringify(msg));
      msgClone.history.push(`Routed to ${qName}`);
      queues[qName].push(msgClone);
      renderQueueMessages(qName);
      animatePacketFlow(ex, qName);
      logEvent('sys', `Routed <strong>[${msg.id}]</strong> ➔ Queue <strong>${qName}</strong>`);
    });
  }

  // ── Queue UI Renderer ──
  function renderQueueMessages(qName) {
    const container = document.getElementById(`container-${qName.replace('_queue', '')}`);
    const countBadge = document.getElementById(`count-${qName.replace('_queue', '')}`);
    const fillBar = document.getElementById(`fill-${qName.replace('_queue', '')}`);

    if (!container || !countBadge || !fillBar) return;

    const qList = queues[qName];
    countBadge.textContent = qList.length;
    fillBar.style.width = `${Math.min(qList.length * 10, 100)}%`;

    container.innerHTML = '';
    qList.forEach((msg) => {
      const pill = document.createElement('div');
      pill.className = `msg-pill ${selectedMsgId === msg.id ? 'selected' : ''}`;
      pill.setAttribute('data-id', msg.id);

      let retryTag =
        msg.retries > 0
          ? `<span class="retry-badge" title="Retry attempts">${msg.retries}</span>`
          : '';
      pill.innerHTML = `<i class="fas fa-envelope"></i> ${msg.id} ${retryTag}`;

      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        inspectMessage(qName, msg.id);
      });

      container.appendChild(pill);
    });
  }

  function renderAllQueues() {
    Object.keys(queues).forEach((qName) => renderQueueMessages(qName));
  }

  // ── Consumer Engine ──
  function renderConsumers() {
    consumersContainer.innerHTML = '';
    consumers.forEach((c) => {
      const card = document.createElement('div');
      card.className = `consumer-node ${c.state}`;
      card.innerHTML = `
                <div class="c-head">
                    <span><i class="fas fa-robot"></i> ${c.name}</span>
                    <button type="button" class="btn-remove-bind" data-cid="${c.id}"><i class="fas fa-times"></i></button>
                </div>
                <div class="c-status">Bound to: <strong>${c.queueId}</strong></div>
            `;
      consumersContainer.appendChild(card);
    });

    consumersContainer.querySelectorAll('.btn-remove-bind').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const cid = e.currentTarget.getAttribute('data-cid');
        consumers = consumers.filter((c) => c.id !== cid);
        renderConsumers();
        drawConnectionLines();
      });
    });
  }

  function spawnConsumer() {
    const queueNames = ['orders_queue', 'logs_queue', 'notifications_queue'];
    const q = queueNames[consumers.length % queueNames.length];
    const newC = {
      id: `c_${Date.now()}`,
      queueId: q,
      name: `Worker ${String.fromCharCode(65 + consumers.length)}`,
      state: 'idle',
    };
    consumers.push(newC);
    renderConsumers();
    drawConnectionLines();
    logEvent(
      'sys',
      `Spawned consumer <strong>${newC.name}</strong> listening on <strong>${q}</strong>`
    );
  }

  function consumeStep() {
    if (!isRunning || !autoConsume) return;

    consumers.forEach((c) => {
      const qList = queues[c.queueId];
      if (!qList || qList.length === 0) return;

      // Dequeue message (FIFO)
      const msg = qList.shift();
      renderQueueMessages(c.queueId);

      if (simulateFailures) {
        c.state = 'failing';
        renderConsumers();
        setTimeout(() => {
          c.state = 'idle';
          renderConsumers();
        }, 800);

        if (msg.retries < MAX_RETRIES) {
          msg.retries++;
          msg.history.push(`Failed on ${c.name}. Attempt ${msg.retries} sent to retry_queue`);
          queues.retry_queue.push(msg);
          stats.retried++;
          updateStatsUI();
          renderQueueMessages('retry_queue');
          logEvent(
            'nack',
            `Worker <strong>${c.name}</strong> failed processing <strong>[${msg.id}]</strong>. Pushed to <em>retry_queue</em> (Retry ${msg.retries}/${MAX_RETRIES})`
          );

          // Schedule TTL retry timer
          setTimeout(() => {
            const idx = queues.retry_queue.findIndex((m) => m.id === msg.id);
            if (idx !== -1) {
              const retryMsg = queues.retry_queue.splice(idx, 1)[0];
              renderQueueMessages('retry_queue');
              queues[c.queueId].push(retryMsg);
              renderQueueMessages(c.queueId);
              logEvent(
                'sys',
                `TTL expired for <strong>[${msg.id}]</strong> in <em>retry_queue</em> ➔ Requeued to <strong>${c.queueId}</strong>`
              );
            }
          }, 3000 / simSpeed);
        } else {
          // Exceeded max retries -> DLQ
          msg.history.push(`Exceeded ${MAX_RETRIES} retries. Sent to amq.dlx -> dlq_queue`);
          queues.dlq_queue.push(msg);
          stats.dlq++;
          updateStatsUI();
          renderQueueMessages('dlq_queue');
          logEvent(
            'dlq',
            `CRITICAL: Message <strong>[${msg.id}]</strong> exceeded max retries (${MAX_RETRIES})! Moved to <strong>dead_letter_queue</strong>`
          );
        }
      } else {
        // Success Ack
        c.state = 'working';
        renderConsumers();
        setTimeout(() => {
          c.state = 'idle';
          renderConsumers();
        }, 600);

        stats.acked++;
        updateStatsUI();
        logEvent(
          'ack',
          `Worker <strong>${c.name}</strong> ACKED message <strong>[${msg.id}]</strong>`
        );
      }
    });
  }

  // ── Inspector Handlers ──
  function inspectMessage(qName, msgId) {
    selectedMsgId = msgId;
    const msg = queues[qName].find((m) => m.id === msgId);
    if (!msg) return;

    renderAllQueues();

    inspectMsgId.textContent = msg.id;
    inspectorContent.innerHTML = `
            <div><strong>Queue:</strong> ${qName}</div>
            <div><strong>Exchange:</strong> ${msg.exchange}</div>
            <div><strong>Routing Key:</strong> '${msg.routingKey}'</div>
            <div><strong>Retries:</strong> ${msg.retries} / ${MAX_RETRIES}</div>
            <div><strong>Payload:</strong> "${msg.payload}"</div>
            <div class="mt-2"><strong>Headers:</strong></div>
            <pre style="background: #091120; padding: 0.4rem; border-radius: 4px; overflow-x: auto;">${JSON.stringify(msg.headers, null, 2)}</pre>
            <div><strong>Trace History:</strong></div>
            <ul style="padding-left: 1.2rem; margin: 0.3rem 0;">
                ${msg.history.map((h) => `<li>${h}</li>`).join('')}
            </ul>
        `;
    inspectorActions.classList.remove('hidden');

    btnManualAck.onclick = () => {
      const idx = queues[qName].findIndex((m) => m.id === msgId);
      if (idx !== -1) {
        queues[qName].splice(idx, 1);
        stats.acked++;
        updateStatsUI();
        renderQueueMessages(qName);
        logEvent('ack', `Manual ACK triggered on <strong>[${msgId}]</strong>`);
        clearInspector();
      }
    };

    btnManualNack.onclick = () => {
      const idx = queues[qName].findIndex((m) => m.id === msgId);
      if (idx !== -1) {
        const [m] = queues[qName].splice(idx, 1);
        m.retries++;
        queues.retry_queue.push(m);
        stats.retried++;
        updateStatsUI();
        renderQueueMessages(qName);
        renderQueueMessages('retry_queue');
        logEvent(
          'nack',
          `Manual NACK triggered on <strong>[${msgId}]</strong> ➔ Moved to retry_queue`
        );
        clearInspector();
      }
    };

    btnManualReject.onclick = () => {
      const idx = queues[qName].findIndex((m) => m.id === msgId);
      if (idx !== -1) {
        const [m] = queues[qName].splice(idx, 1);
        queues.dlq_queue.push(m);
        stats.dlq++;
        updateStatsUI();
        renderQueueMessages(qName);
        renderQueueMessages('dlq_queue');
        logEvent(
          'dlq',
          `Manual REJECT triggered on <strong>[${msgId}]</strong> ➔ Moved to dead_letter_queue`
        );
        clearInspector();
      }
    };
  }

  function clearInspector() {
    selectedMsgId = null;
    inspectMsgId.textContent = 'None';
    inspectorContent.innerHTML = `<p class="placeholder-text">Click on any message pill in a queue to inspect payload, headers, routing history, and trigger manual ACK/NACK/REJECT.</p>`;
    inspectorActions.classList.add('hidden');
  }

  // ── Telemetry & Stats UI ──
  function updateStatsUI() {
    metricPublished.textContent = stats.published;
    metricAcked.textContent = stats.acked;
    metricRetried.textContent = stats.retried;
    metricDLQ.textContent = stats.dlq;
  }

  setInterval(() => {
    const rate = stats.recentCount;
    stats.recentCount = 0;
    rateVal.textContent = `${rate.toFixed(1)} msg/s`;
    rateFill.style.width = `${Math.min(rate * 20, 100)}%`;
  }, 1000);

  // ── SVG Canvas Connection Line Drawing ──
  function drawConnectionLines() {
    flowSvgLayer.innerHTML = '';

    const producerEl = document.getElementById('producerNode');
    if (!producerEl) return;

    const producerRect = producerEl.getBoundingClientRect();
    const stageRect = document.getElementById('topologyStage').getBoundingClientRect();

    const pX = producerRect.right - stageRect.left;
    const pY = producerRect.top + producerRect.height / 2 - stageRect.top;

    // Producer to Exchanges
    document.querySelectorAll('.exchange-node').forEach((exEl) => {
      const exRect = exEl.getBoundingClientRect();
      const exX = exRect.left - stageRect.left;
      const exY = exRect.top + exRect.height / 2 - stageRect.top;

      drawSvgPath(pX, pY, exX, exY, 'rgba(255, 102, 0, 0.25)');
    });

    // Exchanges to Queues based on bindings
    bindings.forEach((b) => {
      const exEl = document.querySelector(`.exchange-node[data-exchange="${b.exchange}"]`);
      const qEl = document.querySelector(`.queue-node[data-queue="${b.queue}"]`);

      if (exEl && qEl) {
        const exRect = exEl.getBoundingClientRect();
        const qRect = qEl.getBoundingClientRect();

        const x1 = exRect.right - stageRect.left;
        const y1 = exRect.top + exRect.height / 2 - stageRect.top;
        const x2 = qRect.left - stageRect.left;
        const y2 = qRect.top + qRect.height / 2 - stageRect.top;

        drawSvgPath(x1, y1, x2, y2, 'rgba(6, 182, 212, 0.3)');
      }
    });

    // Queues to Consumers
    consumers.forEach((c) => {
      const qEl = document.querySelector(`.queue-node[data-queue="${c.queueId}"]`);
      const cEl = document.querySelectorAll('.consumer-node')[consumers.indexOf(c)];

      if (qEl && cEl) {
        const qRect = qEl.getBoundingClientRect();
        const cRect = cEl.getBoundingClientRect();

        const x1 = qRect.right - stageRect.left;
        const y1 = qRect.top + qRect.height / 2 - stageRect.top;
        const x2 = cRect.left - stageRect.left;
        const y2 = cRect.top + cRect.height / 2 - stageRect.top;

        drawSvgPath(x1, y1, x2, y2, 'rgba(16, 185, 129, 0.3)');
      }
    });
  }

  function drawSvgPath(x1, y1, x2, y2, color) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const dx = (x2 - x1) * 0.5;
    const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    path.setAttribute('d', d);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    flowSvgLayer.appendChild(path);
  }

  function animatePacketFlow(exchangeId, queueId) {
    const exEl = document.querySelector(`.exchange-node[data-exchange="${exchangeId}"]`);
    const qEl = document.querySelector(`.queue-node[data-queue="${queueId}"]`);

    if (!exEl || !qEl) return;

    const stageRect = document.getElementById('topologyStage').getBoundingClientRect();
    const exRect = exEl.getBoundingClientRect();
    const qRect = qEl.getBoundingClientRect();

    const x1 = exRect.right - stageRect.left;
    const y1 = exRect.top + exRect.height / 2 - stageRect.top;
    const x2 = qRect.left - stageRect.left;
    const y2 = qRect.top + qRect.height / 2 - stageRect.top;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x1);
    circle.setAttribute('cy', y1);
    circle.setAttribute('r', '6');
    circle.setAttribute('class', 'animated-packet');
    flowSvgLayer.appendChild(circle);

    const duration = 600 / simSpeed;
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const dx = (x2 - x1) * 0.5;
      // Cubic bezier formula
      const t = progress;
      const cx1 = x1 + dx;
      const cy1 = y1;
      const cx2 = x2 - dx;
      const cy2 = y2;

      const currX =
        Math.pow(1 - t, 3) * x1 +
        3 * Math.pow(1 - t, 2) * t * cx1 +
        3 * (1 - t) * Math.pow(t, 2) * cx2 +
        Math.pow(t, 3) * x2;
      const currY =
        Math.pow(1 - t, 3) * y1 +
        3 * Math.pow(1 - t, 2) * t * cy1 +
        3 * (1 - t) * Math.pow(t, 2) * cy2 +
        Math.pow(t, 3) * y2;

      circle.setAttribute('cx', currX);
      circle.setAttribute('cy', currY);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        flowSvgLayer.removeChild(circle);
      }
    }

    requestAnimationFrame(animate);
  }

  function animateProducerPulse() {
    const pulse = document.getElementById('producerPulse');
    if (!pulse) return;
    pulse.textContent = 'Publishing...';
    pulse.style.background = 'rgba(255, 102, 0, 0.3)';
    setTimeout(() => {
      pulse.textContent = 'Ready';
      pulse.style.background = 'rgba(16, 185, 129, 0.1)';
    }, 500);
  }

  // ── Scenario Presets Engine ──
  function loadPresetScenario(scenarioKey) {
    // Reset Queues
    Object.keys(queues).forEach((k) => (queues[k] = []));
    renderAllQueues();
    clearInspector();

    if (scenarioKey === 'direct') {
      pubExchange.value = 'amq.direct';
      pubExchange.dispatchEvent(new Event('change'));
      pubRoutingKey.value = 'orders.created';
      pubPayload.value = 'New Order #9910 - $240.00';
      logEvent('sys', 'Loaded Scenario: <strong>Direct Exchange Exact Match</strong>');
    } else if (scenarioKey === 'topic') {
      pubExchange.value = 'amq.topic';
      pubExchange.dispatchEvent(new Event('change'));
      pubRoutingKey.value = 'logs.europe.error';
      pubPayload.value = 'CRITICAL: EU Region DB Connection Timeout';
      logEvent(
        'sys',
        'Loaded Scenario: <strong>Topic Exchange Wildcard Routing (* and #)</strong>'
      );
    } else if (scenarioKey === 'fanout') {
      pubExchange.value = 'amq.fanout';
      pubExchange.dispatchEvent(new Event('change'));
      pubPayload.value = 'GLOBAL NOTICE: Scheduled Platform Upgrade';
      logEvent('sys', 'Loaded Scenario: <strong>Fanout Broadcast Exchange</strong>');
    } else if (scenarioKey === 'headers') {
      pubExchange.value = 'amq.headers';
      pubExchange.dispatchEvent(new Event('change'));
      pubHeaders.value = '{"format":"pdf", "type":"invoice"}';
      pubPayload.value = 'Invoice_#8841.pdf';
      logEvent('sys', 'Loaded Scenario: <strong>Headers Exchange Attribute Matching</strong>');
    } else if (scenarioKey === 'dlq') {
      pubExchange.value = 'amq.direct';
      pubExchange.dispatchEvent(new Event('change'));
      pubRoutingKey.value = 'orders.created';
      pubPayload.value = 'Corrupted Order #7701';
      chkSimulateFailures.checked = true;
      simulateFailures = true;
      logEvent(
        'sys',
        'Loaded Scenario: <strong>Retry Backoff & Dead Letter Queue (DLQ) Recovery</strong>'
      );
    }
  }

  btnLoadPreset.addEventListener('click', () => {
    loadPresetScenario(scenarioPreset.value);
  });

  // ── Controls & Event Listeners ──
  btnPublishMsg.addEventListener('click', () => publishMessage());

  btnBurstStream.addEventListener('click', () => {
    let count = 0;
    const interval = setInterval(() => {
      publishMessage();
      count++;
      if (count >= 5) clearInterval(interval);
    }, 250 / simSpeed);
  });

  btnPlayPauseSim.addEventListener('click', () => {
    isRunning = !isRunning;
    lblPlayPause.textContent = isRunning ? 'Pause' : 'Resume';
    btnPlayPauseSim.querySelector('i').className = isRunning ? 'fas fa-pause' : 'fas fa-play';
    logEvent('sys', isRunning ? 'Simulation Resumed' : 'Simulation Paused');
  });

  btnStepSim.addEventListener('click', () => {
    consumeStep();
  });

  btnResetSim.addEventListener('click', () => {
    Object.keys(queues).forEach((k) => (queues[k] = []));
    renderAllQueues();
    stats.published = 0;
    stats.acked = 0;
    stats.retried = 0;
    stats.dlq = 0;
    stats.recentCount = 0;
    updateStatsUI();
    clearInspector();
    logEvent('sys', 'Engine Reset: All queues and stats cleared.');
  });

  simSpeedInput.addEventListener('input', () => {
    simSpeed = parseFloat(simSpeedInput.value) * 0.5 + 0.5;
    speedVal.textContent = `${simSpeed.toFixed(1)}x`;
  });

  chkAutoConsume.addEventListener('change', () => {
    autoConsume = chkAutoConsume.checked;
  });

  chkSimulateFailures.addEventListener('change', () => {
    simulateFailures = chkSimulateFailures.checked;
  });

  btnClearLogs.addEventListener('click', () => {
    logConsole.innerHTML =
      '<div class="log-line sys"><span class="timestamp">[00:00:00]</span> Log cleared.</div>';
  });

  btnAddConsumer.addEventListener('click', () => spawnConsumer());

  // Main Engine Tick Loop (re-reads simSpeed each tick)
  function scheduleTick() {
    consumeStep();
    setTimeout(scheduleTick, 1200 / simSpeed);
  }
  scheduleTick();

  window.addEventListener('resize', () => {
    drawConnectionLines();
  });

  // ── Initialization ──
  initDefaultBindings();
  initDefaultConsumers();
  renderBindingsList();
  renderConsumers();
  renderAllQueues();
  setTimeout(drawConnectionLines, 300);

  logEvent('sys', 'RabbitMQ Messaging Engine Ready.');
});
