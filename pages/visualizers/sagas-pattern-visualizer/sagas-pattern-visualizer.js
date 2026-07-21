/**
 * sagas-pattern-visualizer.js
 * Simulate the Choreography approach of the Sagas Pattern.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSagas();
});

const els = {
  btnStart: document.getElementById('btnStartSaga'),
  logContent: document.getElementById('logContent'),
  sagaStatus: document.getElementById('sagaStatus'),
  packetContainer: document.getElementById('packetContainer'),
  failRadios: document.querySelectorAll('input[name="failPoint"]'),
  services: {
    order: {
      card: document.getElementById('service-order'),
      status: document.getElementById('status-order'),
    },
    payment: {
      card: document.getElementById('service-payment'),
      status: document.getElementById('status-payment'),
    },
    inventory: {
      card: document.getElementById('service-inventory'),
      status: document.getElementById('status-inventory'),
    },
  },
};

let sagaInProgress = false;

function initSagas() {
  els.btnStart.addEventListener('click', startSaga);
}

function getFailPoint() {
  for (let r of els.failRadios) {
    if (r.checked) return r.value;
  }
  return 'none';
}

function resetUI() {
  els.logContent.innerHTML = '';
  els.packetContainer.innerHTML = '';
  els.sagaStatus.className = 'saga-badge running';
  els.sagaStatus.textContent = 'RUNNING';

  Object.values(els.services).forEach((s) => {
    s.card.className = 'service-card';
    s.status.className = 'status-indicator IDLE';
    s.status.textContent = 'IDLE';
  });
}

const CARD_STATE_CLASS = {
  PROCESSING: 'active',
  COMPLETED: 'success',
  FAILED: 'error',
  COMPENSATING: 'compensating',
  COMPENSATED: 'compensating',
};

function setServiceStatus(serviceId, statusClass, text) {
  const s = els.services[serviceId];
  s.status.className = `status-indicator ${statusClass}`;
  s.status.textContent = text;
  s.card.className = `service-card ${CARD_STATE_CLASS[statusClass] || ''}`;
}

function addLog(type, msg) {
  const time = new Date().toISOString().substring(11, 23);
  const div = document.createElement('div');
  div.className = `log-entry ${type}`;
  div.innerHTML = `<span class="log-time">[${time}]</span> ${msg}`;
  els.logContent.appendChild(div);
  els.logContent.scrollTop = els.logContent.scrollHeight;
}

function createPacket(text, isCompensating, startRect, endRect, onComplete) {
  const packet = document.createElement('div');
  packet.className = `event-packet ${isCompensating ? 'compensating-packet' : ''}`;
  packet.textContent = text;
  els.packetContainer.appendChild(packet);

  const containerRect = els.packetContainer.getBoundingClientRect();
  const startX = startRect.left - containerRect.left + startRect.width / 2;
  const startY = startRect.top - containerRect.top - 20; // slightly above
  const endX = endRect.left - containerRect.left + endRect.width / 2;
  const endY = endRect.top - containerRect.top - 20;

  // Animate up to the bus, across the bus, and down to the destination
  // Simplified: just direct line animation for now to save DOM complexity
  const anim = packet.animate(
    [
      { left: `${startX}px`, top: `${startY}px` },
      { left: `${startX}px`, top: `80px` }, // Bus height approx
      { left: `${endX}px`, top: `80px` },
      { left: `${endX}px`, top: `${endY}px` },
    ],
    {
      duration: 1500,
      easing: 'linear',
    }
  );

  anim.onfinish = () => {
    packet.remove();
    if (onComplete) onComplete();
  };
}

async function startSaga() {
  if (sagaInProgress) return;
  sagaInProgress = true;
  els.btnStart.disabled = true;
  resetUI();

  const failPoint = getFailPoint();
  addLog('action', '<strong>User Checkout:</strong> saga initiated.');

  // Step 1: Order Service
  setServiceStatus('order', 'PROCESSING', 'PROCESSING');
  addLog('action', 'Order Service executing: create_order() [PENDING]');

  await delay(1000);
  setServiceStatus('order', 'COMPLETED', 'PENDING');
  addLog('event', 'Event Published: <code>OrderCreated</code>');

  // Send to Payment
  await simulatePacket('OrderCreated', 'order', 'payment', false);

  // Step 2: Payment Service
  setServiceStatus('payment', 'PROCESSING', 'PROCESSING');

  if (failPoint === 'payment') {
    await delay(1000);
    setServiceStatus('payment', 'FAILED', 'FAILED');
    addLog('error', 'Payment Service: process_payment() [FAILED: Card Declined]');
    addLog('event', 'Event Published: <code>PaymentFailed</code>');

    // Trigger Compensation back to Order
    await simulatePacket('PaymentFailed', 'payment', 'order', true);

    // Order Compensation
    setServiceStatus('order', 'COMPENSATING', 'COMPENSATING');
    addLog('compensate', 'Order Service executing: cancel_order()');
    await delay(1000);
    setServiceStatus('order', 'COMPENSATED', 'CANCELED');

    endSaga('failed');
    return;
  }

  addLog('action', 'Payment Service executing: process_payment() [SUCCESS]');
  await delay(1000);
  setServiceStatus('payment', 'COMPLETED', 'BILLED');
  addLog('event', 'Event Published: <code>PaymentBilled</code>');

  // Send to Inventory
  await simulatePacket('PaymentBilled', 'payment', 'inventory', false);

  // Step 3: Inventory Service
  setServiceStatus('inventory', 'PROCESSING', 'PROCESSING');

  if (failPoint === 'inventory') {
    await delay(1000);
    setServiceStatus('inventory', 'FAILED', 'FAILED');
    addLog('error', 'Inventory Service: reserve_stock() [FAILED: Out of Stock]');
    addLog('event', 'Event Published: <code>InventoryFailed</code>');

    // Trigger Compensation back to Payment
    await simulatePacket('InventoryFailed', 'inventory', 'payment', true);

    // Payment Compensation
    setServiceStatus('payment', 'COMPENSATING', 'COMPENSATING');
    addLog('compensate', 'Payment Service executing: refund_payment()');
    await delay(1000);
    setServiceStatus('payment', 'COMPENSATED', 'REFUNDED');
    addLog('event', 'Event Published: <code>PaymentRefunded</code>');

    // Trigger Compensation back to Order
    await simulatePacket('PaymentRefunded', 'payment', 'order', true);

    // Order Compensation
    setServiceStatus('order', 'COMPENSATING', 'COMPENSATING');
    addLog('compensate', 'Order Service executing: cancel_order()');
    await delay(1000);
    setServiceStatus('order', 'COMPENSATED', 'CANCELED');

    endSaga('rolledback');
    return;
  }

  addLog('action', 'Inventory Service executing: reserve_stock() [SUCCESS]');
  await delay(1000);
  setServiceStatus('inventory', 'COMPLETED', 'RESERVED');
  addLog('event', 'Event Published: <code>InventoryReserved</code>');

  // Send final success back to Order
  await simulatePacket('InventoryReserved', 'inventory', 'order', false);
  setServiceStatus('order', 'COMPLETED', 'CONFIRMED');

  endSaga('success');
}

function simulatePacket(eventName, fromId, toId, isCompensating) {
  return new Promise((resolve) => {
    const fromCard = els.services[fromId].card.getBoundingClientRect();
    const toCard = els.services[toId].card.getBoundingClientRect();
    createPacket(eventName, isCompensating, fromCard, toCard, resolve);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function endSaga(finalState) {
  sagaInProgress = false;
  els.btnStart.disabled = false;

  if (finalState === 'success') {
    els.sagaStatus.className = 'saga-badge success';
    els.sagaStatus.textContent = 'SUCCESS';
    addLog('success', 'Saga completed successfully. Order Confirmed.');
  } else if (finalState === 'failed') {
    els.sagaStatus.className = 'saga-badge failed';
    els.sagaStatus.textContent = 'FAILED';
    addLog('error', 'Saga aborted early due to failure.');
  } else if (finalState === 'rolledback') {
    els.sagaStatus.className = 'saga-badge rolledback';
    els.sagaStatus.textContent = 'ROLLED BACK';
    addLog('compensate', 'Saga failed. Compensating transactions successfully reverted state.');
  }
}
