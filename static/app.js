const searchForm = document.getElementById('search-form');
const addForm = document.getElementById('add-form');
const searchMessage = document.getElementById('search-message');
const addMessage = document.getElementById('add-message');
const employeeCard = document.getElementById('employee-card');
const detailsMessage = document.getElementById('details-message');
const employeesTableBody = document.getElementById('employees-table-body');
const tableSortableHeaders = document.querySelectorAll('#employees-table thead th[data-sort]');
const formTitle = document.getElementById('form-title');
const formHint = document.getElementById('form-hint');
const submitButton = document.getElementById('submit-button');
const cancelEditButton = document.getElementById('cancel-edit-button');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const salaryInput = document.getElementById('salary');
const departmentInput = document.getElementById('department');
const managerInput = document.getElementById('manager');
const geoLocationInput = document.getElementById('geo-location');
const employeeFilterInput = document.getElementById('employee-filter');
const clearFilterButton = document.getElementById('clear-filter-button');
const sortFieldSelect = document.getElementById('sort-field');
const sortDirectionButton = document.getElementById('sort-direction-button');
const paginationSummary = document.getElementById('pagination-summary');
const prevPageButton = document.getElementById('prev-page-button');
const nextPageButton = document.getElementById('next-page-button');
const toastContainer = document.getElementById('toast-container');
const employeeModal = document.getElementById('employee-modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const closeModalButton = document.getElementById('close-modal-button');
const modalBody = document.getElementById('modal-body');
const totalEmployeesStat = document.getElementById('stat-total-employees');
const totalDepartmentsStat = document.getElementById('stat-total-departments');
const averageSalaryStat = document.getElementById('stat-average-salary');
const managerLoadStat = document.getElementById('stat-manager-load');
const managerNoteStat = document.getElementById('stat-manager-note');
const aiSummaryText = document.getElementById('ai-summary-text');
const aiActionList = document.getElementById('ai-action-list');
const aiQueryInput = document.getElementById('ai-query-input');
const assistantModeSelect = document.getElementById('assistant-mode');
const assistantModeNote = document.getElementById('assistant-mode-note');
const voiceInputButton = document.getElementById('voice-input-button');
const runAiQueryButton = document.getElementById('run-ai-query-button');
const resetAiQueryButton = document.getElementById('reset-ai-query-button');
const exportAiSummaryButton = document.getElementById('export-ai-summary-button');
const exportDepartmentChartButton = document.getElementById('export-department-chart-button');
const exportManagerChartButton = document.getElementById('export-manager-chart-button');
const agentChatLog = document.getElementById('agent-chat-log');
const agentFollowups = document.getElementById('agent-followups');
const agentTyping = document.getElementById('agent-typing');
const agentStatus = document.getElementById('agent-status');
const voiceReplyToggle = document.getElementById('voice-reply-toggle');
const voiceShortcutHint = document.getElementById('voice-shortcut-hint');
const departmentChartCanvas = document.getElementById('department-chart');
const managerChartCanvas = document.getElementById('manager-chart');
const assistantFab = document.getElementById('assistant-fab');
const floatingAssistant = document.getElementById('floating-assistant');
const floatingAssistantHeader = document.getElementById('floating-assistant-header');
const floatingAssistantForm = document.getElementById('floating-assistant-form');
const floatingAssistantInput = document.getElementById('floating-assistant-input');
const floatingAssistantLog = document.getElementById('floating-assistant-log');
const floatingAssistantProvider = document.getElementById('floating-assistant-provider');
const floatingAssistantProviderNote = document.getElementById('floating-assistant-provider-note');
const floatingAssistantStatusBadge = document.getElementById('floating-assistant-status-badge');
const floatingAssistantOpenButton = document.getElementById('floating-assistant-open');
const floatingAssistantMinimizeButton = document.getElementById('floating-assistant-minimize');
const themeToggleButton = document.getElementById('theme-toggle-button');
const panelToggleButtons = document.querySelectorAll('[data-panel-toggle]');

let editingEmployeeId = null;
let allEmployees = [];
let currentSortField = 'id';
let currentSortDirection = 'asc';
let currentPage = 1;
let assistantMode = 'chat';
let aiFilterMode = 'all';
let aiSalaryFilter = null;
let latestInsightSummary = 'Insights will appear once employee data loads.';
let latestInsightActions = ['Loading recommendations...'];
let departmentChartInstance = null;
let managerChartInstance = null;
let latestInsightsRequestId = 0;
let speechRecognitionInstance = null;
let isVoiceListening = false;
let voiceRepliesEnabled = true;
let voiceShortcutActive = false;
let floatingAssistantDragState = null;
let floatingAssistantStatusRequestId = 0;

const PAGE_SIZE = 5;
const FLOATING_ASSISTANT_POSITION_KEY = 'medivra-floating-assistant-position';
const FLOATING_ASSISTANT_OPEN_KEY = 'medivra-floating-assistant-open';
const THEME_PREFERENCE_KEY = 'medivra-theme';
const COLLAPSIBLE_PANELS_STATE_KEY = 'medivra-collapsible-panels';
const statAnimationState = {
  totalEmployees: 0,
  totalDepartments: 0,
  averageSalary: 0,
  managerLoad: 0,
};
let currentTheme = 'light';
const FLOATING_ASSISTANT_PROVIDERS = {
  local: {
    name: 'Local Medivra',
    note: 'Local Medivra assistant replies inside this widget using the app backend.',
  },
  github: {
    name: 'GitHub Copilot (API)',
    note: 'Replies inside this widget using your GitHub token (GITHUB_TOKEN) on the server.',
  },
  chatgpt: {
    name: 'ChatGPT',
    note: 'Opens ChatGPT in a new tab. The prompt is copied so you can paste it immediately.',
    url: 'https://chatgpt.com/',
  },
  gemini: {
    name: 'Gemini',
    note: 'Opens Gemini in a new tab. The prompt is copied so you can paste it immediately.',
    url: 'https://gemini.google.com/app',
  },
  claude: {
    name: 'Claude',
    note: 'Opens Claude in a new tab. The prompt is copied so you can paste it immediately.',
    url: 'https://claude.ai/new',
  },
  perplexity: {
    name: 'Perplexity',
    note: 'Opens Perplexity in a new tab and passes the prompt when supported.',
    url: 'https://www.perplexity.ai/search/new',
    queryParam: 'q',
  },
};

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'toast-error' : 'toast-success'}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add('toast-fade');
    window.setTimeout(() => {
      toast.remove();
    }, 220);
  }, 2600);
}

function formatEmployeeId(id) {
  return `EMP-${String(id).padStart(4, '0')}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function parseEmployeeId(value) {
  const normalizedValue = value.trim().toUpperCase();

  if (/^EMP-\d+$/.test(normalizedValue)) {
    return Number.parseInt(normalizedValue.replace('EMP-', ''), 10);
  }

  if (/^\d+$/.test(normalizedValue)) {
    return Number.parseInt(normalizedValue, 10);
  }

  return null;
}

function setMessage(target, text, isError = false) {
  target.textContent = text;
  target.className = `message ${isError ? 'error' : 'ok'}`;
}

function clearMessage(target) {
  target.textContent = '';
  target.className = 'message';
}

function getEmployeePayload() {
  return {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    salary: Number(salaryInput.value),
    department: departmentInput.value.trim(),
    manager: managerInput.value.trim(),
    geo_location: geoLocationInput.value.trim(),
  };
}

function setFormModeForAdd() {
  editingEmployeeId = null;
  formTitle.textContent = 'Add Employee';
  formHint.textContent = 'Create a new employee record.';
  submitButton.textContent = 'Add Employee';
  cancelEditButton.classList.add('hidden');
}

function setFormModeForEdit(employee) {
  editingEmployeeId = employee.id;
  formTitle.textContent = `Modify ${formatEmployeeId(employee.id)}`;
  formHint.textContent = `Update the record for ${employee.name}.`;
  submitButton.textContent = 'Save Changes';
  cancelEditButton.classList.remove('hidden');
}

function fillForm(employee) {
  nameInput.value = employee.name;
  emailInput.value = employee.email;
  salaryInput.value = employee.salary;
  departmentInput.value = employee.department;
  managerInput.value = employee.manager;
  geoLocationInput.value = employee.geo_location;
}

function resetForm() {
  addForm.reset();
  setFormModeForAdd();
}

function buildEmployeeDetailsMarkup(employee) {
  return `
    <div class="modal-grid">
      <div class="modal-item"><span>ID</span><strong>${formatEmployeeId(employee.id)}</strong></div>
      <div class="modal-item"><span>Name</span><strong>${employee.name}</strong></div>
      <div class="modal-item"><span>Email</span><strong>${employee.email}</strong></div>
      <div class="modal-item"><span>Salary</span><strong>${formatCurrency(employee.salary)}</strong></div>
      <div class="modal-item"><span>Department</span><strong>${employee.department}</strong></div>
      <div class="modal-item"><span>Manager</span><strong>${employee.manager}</strong></div>
      <div class="modal-item modal-item-wide"><span>Geo Location</span><strong>${employee.geo_location}</strong></div>
    </div>
  `;
}

function openEmployeeModal(employee) {
  modalBody.innerHTML = buildEmployeeDetailsMarkup(employee);
  employeeModal.classList.remove('hidden');
  employeeModal.setAttribute('aria-hidden', 'false');
  showToast(`Viewing ${employee.name} (${formatEmployeeId(employee.id)}).`);
}

function closeEmployeeModal() {
  employeeModal.classList.add('hidden');
  employeeModal.setAttribute('aria-hidden', 'true');
}

function resetAiModes() {
  aiFilterMode = 'all';
  aiSalaryFilter = null;
}

function getFilteredEmployees() {
  const query = employeeFilterInput.value.trim().toLowerCase();
  let employees = [...allEmployees];

  if (aiFilterMode === 'high-salary') {
    const salaryValues = employees
      .map((employee) => Number(employee.salary) || 0)
      .sort((left, right) => left - right);
    const thresholdIndex = Math.max(0, Math.floor(salaryValues.length * 0.75) - 1);
    const threshold = salaryValues[thresholdIndex] || 0;
    employees = employees.filter((employee) => Number(employee.salary) >= threshold);
  }

  if (aiFilterMode === 'salary-range' && aiSalaryFilter) {
    employees = employees.filter((employee) => {
      const salary = Number(employee.salary) || 0;
      if (typeof aiSalaryFilter.min === 'number' && salary < aiSalaryFilter.min) {
        return false;
      }
      if (typeof aiSalaryFilter.max === 'number' && salary > aiSalaryFilter.max) {
        return false;
      }
      return true;
    });
  }

  if (!query) {
    return employees;
  }

  return employees.filter((employee) => {
    const searchableText = [
      formatEmployeeId(employee.id),
      String(employee.id),
      employee.name,
      employee.email,
      employee.department,
      employee.manager,
      employee.geo_location,
    ].join(' ').toLowerCase();

    return searchableText.includes(query);
  });
}

function sortEmployees(employees) {
  return [...employees].sort((left, right) => {
    const leftValue = left[currentSortField];
    const rightValue = right[currentSortField];

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return currentSortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue;
    }

    const comparison = String(leftValue).localeCompare(String(rightValue), undefined, { sensitivity: 'base' });
    return currentSortDirection === 'asc' ? comparison : -comparison;
  });
}

function paginateEmployees(employees) {
  const totalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);
  currentPage = Math.max(currentPage, 1);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedEmployees = employees.slice(startIndex, startIndex + PAGE_SIZE);

  return { totalPages, paginatedEmployees, startIndex };
}

function updatePaginationControls(totalItems, totalPages, startIndex, visibleCount) {
  const endIndex = visibleCount === 0 ? 0 : startIndex + visibleCount;
  paginationSummary.textContent = `Page ${currentPage} of ${totalPages} | Showing ${startIndex + (visibleCount ? 1 : 0)}-${endIndex} of ${totalItems}`;
  prevPageButton.disabled = currentPage <= 1;
  nextPageButton.disabled = currentPage >= totalPages;
}

function updateSortDirectionButton() {
  sortDirectionButton.textContent = currentSortDirection === 'asc' ? 'Ascending' : 'Descending';
}

function updateSortableHeaders() {
  tableSortableHeaders.forEach((header) => {
    const isActive = header.dataset.sort === currentSortField;
    header.classList.toggle('sorted-asc', isActive && currentSortDirection === 'asc');
    header.classList.toggle('sorted-desc', isActive && currentSortDirection === 'desc');
    header.setAttribute('aria-sort', isActive ? (currentSortDirection === 'asc' ? 'ascending' : 'descending') : 'none');
  });
}

function updateDetailsMessage(filteredEmployees) {
  const query = employeeFilterInput.value.trim();
  if (!query) {
    setMessage(detailsMessage, `Showing ${filteredEmployees.length} employee record(s).`);
    return;
  }
  setMessage(detailsMessage, `Showing ${filteredEmployees.length} filtered employee record(s) for "${query}".`);
}

function destroyChart(chartInstance) {
  if (chartInstance) {
    chartInstance.destroy();
  }
}

function getChartPalette() {
  if (currentTheme === 'dark') {
    return {
      department: ['rgba(70, 164, 151, 0.94)', 'rgba(126, 187, 175, 0.94)', 'rgba(166, 207, 198, 0.94)', 'rgba(214, 194, 155, 0.9)', 'rgba(234, 226, 204, 0.86)'],
      manager: ['rgba(214, 194, 155, 0.92)', 'rgba(228, 215, 184, 0.88)', 'rgba(70, 164, 151, 0.9)', 'rgba(126, 187, 175, 0.9)', 'rgba(166, 207, 198, 0.86)'],
    };
  }

  return {
    department: ['rgba(217, 239, 233, 0.95)', 'rgba(190, 228, 220, 0.92)', 'rgba(157, 213, 201, 0.9)', 'rgba(118, 187, 171, 0.88)', 'rgba(242, 228, 198, 0.88)'],
    manager: ['rgba(242, 228, 198, 0.95)', 'rgba(232, 211, 170, 0.92)', 'rgba(217, 239, 233, 0.9)', 'rgba(157, 213, 201, 0.88)', 'rgba(118, 187, 171, 0.86)'],
  };
}

function animateValueTransition(from, to, durationMs, onFrame, onComplete) {
  const startTime = performance.now();
  const distance = to - from;

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    const eased = 1 - ((1 - progress) ** 3);
    onFrame(from + (distance * eased));

    if (progress < 1) {
      window.requestAnimationFrame(step);
      return;
    }

    if (typeof onComplete === 'function') {
      onComplete();
    }
  }

  window.requestAnimationFrame(step);
}

function setAnimatedStat(element, statKey, targetValue, formatter) {
  if (!element) {
    return;
  }

  const normalizedTarget = Number.isFinite(Number(targetValue)) ? Number(targetValue) : 0;
  const startValue = Number.isFinite(statAnimationState[statKey]) ? statAnimationState[statKey] : 0;

  if (startValue === normalizedTarget) {
    element.textContent = formatter(normalizedTarget);
    return;
  }

  animateValueTransition(
    startValue,
    normalizedTarget,
    560,
    (value) => {
      element.textContent = formatter(value);
    },
    () => {
      statAnimationState[statKey] = normalizedTarget;
      element.textContent = formatter(normalizedTarget);
    }
  );
}

function applyTheme(theme) {
  const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
  currentTheme = normalizedTheme;
  document.body.setAttribute('data-theme', normalizedTheme);

  if (themeToggleButton) {
    themeToggleButton.textContent = normalizedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    themeToggleButton.setAttribute('aria-pressed', normalizedTheme === 'dark' ? 'true' : 'false');
    themeToggleButton.setAttribute('title', normalizedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function initializeTheme() {
  const savedTheme = window.localStorage.getItem(THEME_PREFERENCE_KEY);
  const preferredDarkMode = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (preferredDarkMode ? 'dark' : 'light'));
}

function setupCollapsiblePanels() {
  let panelState = {};

  try {
    panelState = JSON.parse(window.localStorage.getItem(COLLAPSIBLE_PANELS_STATE_KEY) || '{}');
  } catch (_error) {
    panelState = {};
  }

  panelToggleButtons.forEach((button) => {
    const targetId = button.getAttribute('data-target');
    if (!targetId) {
      return;
    }

    const targetPanel = document.getElementById(targetId);
    if (!targetPanel) {
      return;
    }

    const setPanelExpandedState = (isExpanded) => {
      targetPanel.classList.toggle('hidden', !isExpanded);
      button.textContent = isExpanded ? 'Collapse' : 'Expand';
      button.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    };

    const isInitiallyExpanded = panelState[targetId] !== false;
    setPanelExpandedState(isInitiallyExpanded);

    button.addEventListener('click', () => {
      const shouldExpand = targetPanel.classList.contains('hidden');
      setPanelExpandedState(shouldExpand);
      panelState[targetId] = shouldExpand;
      window.localStorage.setItem(COLLAPSIBLE_PANELS_STATE_KEY, JSON.stringify(panelState));
    });
  });
}

function renderChart(canvas, chartInstance, countMap, emptyMessage, label, colors) {
  const entries = Object.entries(countMap).sort((left, right) => right[1] - left[1]).slice(0, 5);

  if (!canvas || typeof Chart === 'undefined') {
    return null;
  }

  if (!entries.length) {
    destroyChart(chartInstance);
    if (canvas.parentElement) {
      let emptyNode = canvas.parentElement.querySelector('.mini-chart-empty');
      if (!emptyNode) {
        emptyNode = document.createElement('p');
        emptyNode.className = 'mini-chart-empty';
        canvas.parentElement.appendChild(emptyNode);
      }
      emptyNode.textContent = emptyMessage;
    }
    return null;
  }

  const emptyNode = canvas.parentElement ? canvas.parentElement.querySelector('.mini-chart-empty') : null;
  if (emptyNode) {
    emptyNode.remove();
  }

  destroyChart(chartInstance);

  const axisTickColor = currentTheme === 'dark' ? 'rgba(221, 237, 233, 0.84)' : 'rgba(236, 255, 251, 0.82)';
  const axisGridColor = currentTheme === 'dark' ? 'rgba(186, 215, 209, 0.18)' : 'rgba(255, 255, 255, 0.1)';
  const tooltipBackground = currentTheme === 'dark' ? 'rgba(6, 27, 24, 0.95)' : 'rgba(12, 28, 26, 0.92)';

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: entries.map(([entryLabel]) => entryLabel),
      datasets: [{
        label,
        data: entries.map(([, value]) => value),
        backgroundColor: colors,
        borderRadius: 10,
        borderSkipped: false,
        borderWidth: 0,
        barThickness: 18,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBackground,
          titleColor: '#ffffff',
          bodyColor: '#ecfffb',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.16)',
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: axisTickColor, maxRotation: 0, minRotation: 0 },
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: axisTickColor },
          grid: { color: axisGridColor },
        },
      },
    },
  });
}

function appendAgentMessage(role, text) {
  if (!agentChatLog) {
    return;
  }

  const message = document.createElement('article');
  message.className = `agent-message ${role}`;
  message.innerHTML = `
    <p class="agent-role">${role === 'user' ? 'You' : 'Medivra Agent'}</p>
    <p>${text}</p>
  `;

  agentChatLog.appendChild(message);
  agentChatLog.scrollTop = agentChatLog.scrollHeight;

  if (role === 'assistant') {
    speakAssistantReply(text);
  }
}

function setAgentThinking(isThinking) {
  if (agentTyping) {
    agentTyping.classList.toggle('hidden', !isThinking);
  }
  if (agentStatus) {
    agentStatus.textContent = isThinking ? 'Thinking...' : 'Online';
  }
}

function isChatMode(mode) {
  return ['chat', 'local', 'ai'].includes((mode || '').toLowerCase());
}

function updateAssistantModeUI() {
  if (assistantModeSelect) {
    assistantModeSelect.value = assistantMode;
  }
  if (runAiQueryButton) {
    runAiQueryButton.textContent = isChatMode(assistantMode) ? 'Run Local Chat' : 'Run AI Search';
  }
  if (assistantModeNote) {
    assistantModeNote.textContent = isChatMode(assistantMode)
      ? 'Local Chat mode uses local assistant responses.'
      : 'Data Assistant mode uses records from this page.';
  }
  if (aiQueryInput) {
    aiQueryInput.placeholder = isChatMode(assistantMode)
      ? 'Ask anything. Example: summarize this workforce and suggest hiring priorities.'
      : 'Ask: show engineering team, salary above 80000, salary between 50000 and 90000, manager Sarah, location Hyderabad';
  }
}

async function askLocalAssistant(prompt, provider = 'local') {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, provider }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Assistant request failed.');
  }

  return result.data || {};
}

function getFloatingAssistantProviderConfig() {
  return FLOATING_ASSISTANT_PROVIDERS[floatingAssistantProvider?.value] || FLOATING_ASSISTANT_PROVIDERS.local;
}

async function fetchFloatingAssistantStatus(providerKey) {
  const response = await fetch(`/api/ai/status?provider=${encodeURIComponent(providerKey)}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Unable to load provider status.');
  }

  return result.data || {};
}

function renderFloatingAssistantStatusBadge(statusData) {
  if (!floatingAssistantStatusBadge) {
    return;
  }

  const normalizedState = statusData?.state || 'checking';
  floatingAssistantStatusBadge.textContent = statusData?.label || 'Checking...';
  floatingAssistantStatusBadge.className = `floating-assistant-status-badge is-${normalizedState}`;
  floatingAssistantStatusBadge.title = statusData?.message || '';
}

async function refreshFloatingAssistantStatus() {
  const requestId = ++floatingAssistantStatusRequestId;
  const providerKey = floatingAssistantProvider?.value || 'local';

  renderFloatingAssistantStatusBadge({
    state: 'checking',
    label: 'Checking...',
    message: 'Checking provider availability.',
  });

  try {
    const statusData = await fetchFloatingAssistantStatus(providerKey);
    if (requestId !== floatingAssistantStatusRequestId) {
      return;
    }
    renderFloatingAssistantStatusBadge(statusData);
  } catch (error) {
    if (requestId !== floatingAssistantStatusRequestId) {
      return;
    }
    renderFloatingAssistantStatusBadge({
      state: 'error',
      label: 'Error',
      message: error.message || 'Unable to load provider status.',
    });
  }
}

function appendFloatingAssistantMessage(role, text) {
  if (!floatingAssistantLog || !text) {
    return;
  }

  const message = document.createElement('article');
  message.className = `agent-message ${role}`;
  
  // Process text: escape HTML, convert newlines, and extract Try: examples
  const lines = text.split('\n');
  let htmlContent = '';
  const tryExamples = [];
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('Try:')) {
      const exampleText = trimmed.replace('Try:', '').trim();
      tryExamples.push(exampleText);
      htmlContent += `<span style="color: #3fa595; font-weight: 600; cursor: pointer; text-decoration: underline;" class="try-example" data-prompt="${escapeHtml(exampleText)}">${escapeHtml(trimmed)}</span><br>`;
    } else {
      htmlContent += escapeHtml(line) + '<br>';
    }
  });
  
  message.innerHTML = `
    <p class="agent-role">${role === 'assistant' ? 'AI Help' : 'You'}</p>
    <p style="white-space: pre-wrap; word-wrap: break-word;">${htmlContent}</p>
  `;

  floatingAssistantLog.appendChild(message);
  
  // Add click handlers to Try: examples
  message.querySelectorAll('.try-example').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.prompt;
      floatingAssistantInput.value = prompt;
      sendFloatingAssistantMessage();
    });
  });
  
  floatingAssistantLog.scrollTop = floatingAssistantLog.scrollHeight;

  if (role === 'assistant') {
    speakAssistantReply(text);
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function setFloatingAssistantOpen(isOpen) {
  if (!floatingAssistant || !assistantFab) {
    return;
  }

  floatingAssistant.classList.toggle('hidden', !isOpen);
  assistantFab.classList.toggle('hidden', isOpen);
  assistantFab.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  window.localStorage.setItem(FLOATING_ASSISTANT_OPEN_KEY, isOpen ? 'open' : 'closed');
}

function clampFloatingAssistantPosition(left, top) {
  const width = floatingAssistant?.offsetWidth || 0;
  const height = floatingAssistant?.offsetHeight || 0;
  const maxLeft = Math.max(16, window.innerWidth - width - 16);
  const maxTop = Math.max(16, window.innerHeight - height - 16);

  return {
    left: Math.min(Math.max(16, left), maxLeft),
    top: Math.min(Math.max(16, top), maxTop),
  };
}

function saveFloatingAssistantPosition(left, top) {
  window.localStorage.setItem(FLOATING_ASSISTANT_POSITION_KEY, JSON.stringify({ left, top }));
}

function applyFloatingAssistantPosition(left, top) {
  if (!floatingAssistant) {
    return;
  }

  const clampedPosition = clampFloatingAssistantPosition(left, top);
  floatingAssistant.style.left = `${clampedPosition.left}px`;
  floatingAssistant.style.top = `${clampedPosition.top}px`;
  floatingAssistant.style.right = 'auto';
  floatingAssistant.style.bottom = 'auto';
  saveFloatingAssistantPosition(clampedPosition.left, clampedPosition.top);
}

function restoreFloatingAssistantPosition() {
  if (!floatingAssistant) {
    return;
  }

  const rawPosition = window.localStorage.getItem(FLOATING_ASSISTANT_POSITION_KEY);
  if (!rawPosition) {
    return;
  }

  try {
    const parsedPosition = JSON.parse(rawPosition);
    if (typeof parsedPosition.left === 'number' && typeof parsedPosition.top === 'number') {
      applyFloatingAssistantPosition(parsedPosition.left, parsedPosition.top);
    }
  } catch (_error) {
    window.localStorage.removeItem(FLOATING_ASSISTANT_POSITION_KEY);
  }
}

async function copyPromptToClipboard(prompt) {
  if (!prompt || !navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(prompt);
    return true;
  } catch (_error) {
    return false;
  }
}

async function openExternalAssistant(providerKey, prompt) {
  const providerConfig = FLOATING_ASSISTANT_PROVIDERS[providerKey];
  if (!providerConfig?.url) {
    showToast('Selected provider is not available.', true);
    return;
  }

  const destination = new URL(providerConfig.url);
  const trimmedPrompt = (prompt || '').trim();

  if (trimmedPrompt && providerConfig.queryParam) {
    destination.searchParams.set(providerConfig.queryParam, trimmedPrompt);
  }

  const copied = await copyPromptToClipboard(trimmedPrompt);
  window.open(destination.toString(), '_blank', 'noopener,noreferrer');

  appendFloatingAssistantMessage(
    'assistant',
    trimmedPrompt
      ? `Opened ${providerConfig.name}.${copied ? ' Your prompt was copied to the clipboard.' : ' Paste your prompt into the new tab.'}`
      : `Opened ${providerConfig.name} in a new tab.`
  );
  showToast(`Opened ${providerConfig.name}.`);
}

function updateFloatingAssistantUI() {
  const providerConfig = getFloatingAssistantProviderConfig();

  if (floatingAssistantProviderNote) {
    floatingAssistantProviderNote.textContent = providerConfig.note;
  }

  if (floatingAssistantOpenButton) {
    const selectedProvider = floatingAssistantProvider?.value || 'local';
    const opensExternally = Boolean(FLOATING_ASSISTANT_PROVIDERS[selectedProvider]?.url);
    floatingAssistantOpenButton.disabled = !opensExternally;
    floatingAssistantOpenButton.textContent = opensExternally ? 'Open Bot' : 'In-App Active';
  }
}

function handleFloatingAssistantDragStart(event) {
  if (!floatingAssistant || event.target.closest('button, select, textarea, input')) {
    return;
  }

  const rect = floatingAssistant.getBoundingClientRect();
  floatingAssistantDragState = {
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
  };
  floatingAssistant.classList.add('dragging');
}

function handleFloatingAssistantDragMove(event) {
  if (!floatingAssistantDragState) {
    return;
  }

  applyFloatingAssistantPosition(
    event.clientX - floatingAssistantDragState.offsetX,
    event.clientY - floatingAssistantDragState.offsetY,
  );
}

function handleFloatingAssistantDragEnd() {
  if (!floatingAssistantDragState || !floatingAssistant) {
    return;
  }

  floatingAssistantDragState = null;
  floatingAssistant.classList.remove('dragging');
}

async function submitFloatingAssistantPrompt() {
  const providerKey = floatingAssistantProvider?.value || 'local';
  const prompt = floatingAssistantInput?.value.trim() || '';

  if (!prompt) {
    showToast('Enter a prompt for the assistant first.', true);
    return;
  }

  appendFloatingAssistantMessage('user', prompt);

  if (providerKey === 'local' || providerKey === 'github') {
    try {
      const result = await askLocalAssistant(prompt, providerKey);
      appendFloatingAssistantMessage('assistant', result.reply || 'Assistant returned no response.');
      showToast(`${result.provider || 'assistant'} replied using ${result.model || 'configured model'}.`);
    } catch (error) {
      appendFloatingAssistantMessage('assistant', error.message || 'Assistant is unavailable right now.');
      showToast(error.message || 'Assistant is unavailable right now.', true);
    }
  } else {
    await openExternalAssistant(providerKey, prompt);
  }

  floatingAssistantInput.value = '';
}

function setupFloatingAssistant() {
  if (!floatingAssistant || !assistantFab) {
    return;
  }

  const savedState = window.localStorage.getItem(FLOATING_ASSISTANT_OPEN_KEY);
  const shouldOpen = savedState !== 'closed';

  restoreFloatingAssistantPosition();
  updateFloatingAssistantUI();
  setFloatingAssistantOpen(shouldOpen);

  floatingAssistantHeader?.addEventListener('mousedown', handleFloatingAssistantDragStart);
  document.addEventListener('mousemove', handleFloatingAssistantDragMove);
  document.addEventListener('mouseup', handleFloatingAssistantDragEnd);

  window.addEventListener('resize', () => {
    if (!floatingAssistant.style.left || !floatingAssistant.style.top) {
      return;
    }

    const currentLeft = Number.parseFloat(floatingAssistant.style.left);
    const currentTop = Number.parseFloat(floatingAssistant.style.top);
    if (!Number.isNaN(currentLeft) && !Number.isNaN(currentTop)) {
      applyFloatingAssistantPosition(currentLeft, currentTop);
    }
  });

  assistantFab.addEventListener('click', () => {
    setFloatingAssistantOpen(true);
    floatingAssistantInput?.focus();
  });

  floatingAssistantMinimizeButton?.addEventListener('click', () => {
    setFloatingAssistantOpen(false);
  });

  floatingAssistantProvider?.addEventListener('change', () => {
    const providerConfig = getFloatingAssistantProviderConfig();
    updateFloatingAssistantUI();
    refreshFloatingAssistantStatus();
    appendFloatingAssistantMessage('assistant', `Switched to ${providerConfig.name}. ${providerConfig.note}`);
  });

  floatingAssistantForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitFloatingAssistantPrompt();
  });

  floatingAssistantOpenButton?.addEventListener('click', async () => {
    await openExternalAssistant(
      floatingAssistantProvider?.value || 'local',
      floatingAssistantInput?.value.trim() || '',
    );
  });

  document.querySelectorAll('[data-floating-prompt]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!floatingAssistantInput) {
        return;
      }

      floatingAssistantInput.value = button.dataset.floatingPrompt || '';
      await submitFloatingAssistantPrompt();
    });
  });

  refreshFloatingAssistantStatus();
}

function parseSalaryQuery(query) {
  const betweenMatch = query.match(/salary\s+(?:between|from)\s+(\d+)\s+(?:and|to)\s+(\d+)/);
  if (betweenMatch) {
    const min = Number.parseInt(betweenMatch[1], 10);
    const max = Number.parseInt(betweenMatch[2], 10);
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      return { min: Math.min(min, max), max: Math.max(min, max), label: `salary between ${Math.min(min, max)} and ${Math.max(min, max)}` };
    }
  }

  const aboveMatch = query.match(/salary\s+(?:above|over|greater than|more than)\s+(\d+)/);
  if (aboveMatch) {
    const min = Number.parseInt(aboveMatch[1], 10);
    if (!Number.isNaN(min)) {
      return { min, max: null, label: `salary above ${min}` };
    }
  }

  const belowMatch = query.match(/salary\s+(?:below|under|less than)\s+(\d+)/);
  if (belowMatch) {
    const max = Number.parseInt(belowMatch[1], 10);
    if (!Number.isNaN(max)) {
      return { min: null, max, label: `salary below ${max}` };
    }
  }

  return null;
}

function applyDataAssistantRules(query) {
  resetAiModes();
  currentSortField = 'id';
  currentSortDirection = 'asc';

  if (/show all|reset|clear/.test(query)) {
    employeeFilterInput.value = '';
    return 'Reset complete. Showing full employee view.';
  }

  const salaryQuery = parseSalaryQuery(query);
  if (salaryQuery) {
    aiFilterMode = 'salary-range';
    aiSalaryFilter = { min: salaryQuery.min, max: salaryQuery.max };
    currentSortField = 'salary';
    currentSortDirection = 'desc';
  }

  if (/high salary|top salary|highest salary|top paid/.test(query)) {
    aiFilterMode = 'high-salary';
    currentSortField = 'salary';
    currentSortDirection = 'desc';
  }

  const searchText = query
    .replace(/salary\s+(?:between|from)\s+\d+\s+(?:and|to)\s+\d+/g, ' ')
    .replace(/salary\s+(?:above|over|greater than|more than)\s+\d+/g, ' ')
    .replace(/salary\s+(?:below|under|less than)\s+\d+/g, ' ')
    .replace(/high salary|top salary|highest salary|top paid/g, ' ')
    .replace(/\b(show|employees|employee|team|manager|location|salary|with|find|only|all|records|record|whose|where|and|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  employeeFilterInput.value = searchText;
  return `Applied ${searchText || 'general'} filter.`;
}

async function applyAiQuery(rawQuery) {
  const query = (rawQuery || '').trim().toLowerCase();
  if (!query) {
    showToast('Enter an AI search prompt first.', true);
    return;
  }

  appendAgentMessage('user', rawQuery.trim());
  setAgentThinking(true);

  if (isChatMode(assistantMode)) {
    try {
      const result = await askLocalAssistant(query);
      appendAgentMessage('assistant', result.reply || 'Assistant returned no response.');
      showToast(`Assistant replied using ${result.model || 'local model'}.`);
    } catch (error) {
      appendAgentMessage('assistant', error.message || 'Assistant is unavailable right now.');
      showToast(error.message || 'Assistant is unavailable right now.', true);
    }
    setAgentThinking(false);
    return;
  }

  const responseMessage = applyDataAssistantRules(query);
  sortFieldSelect.value = currentSortField;
  const employees = applyEmployeeFilter();
  appendAgentMessage('assistant', `${responseMessage} Found ${employees.length} employee record(s).`);
  setAgentThinking(false);
}

function renderInsightsFromPayload(payload) {
  setAnimatedStat(totalEmployeesStat, 'totalEmployees', payload.visible_count || 0, (value) => String(Math.round(value)));
  setAnimatedStat(totalDepartmentsStat, 'totalDepartments', payload.department_count || 0, (value) => String(Math.round(value)));
  setAnimatedStat(averageSalaryStat, 'averageSalary', payload.average_salary || 0, (value) => formatCurrency(value));
  setAnimatedStat(managerLoadStat, 'managerLoad', payload.top_manager ? payload.top_manager.count : 0, (value) => String(Math.round(value)));
  managerNoteStat.textContent = payload.top_manager
    ? `${payload.top_manager.name} manages the largest visible team`
    : 'No visible employee records';

  latestInsightSummary = payload.summary || 'No insights available.';
  latestInsightActions = Array.isArray(payload.actions) && payload.actions.length
    ? payload.actions
    : ['No recommendations available.'];

  aiSummaryText.textContent = latestInsightSummary;
  aiActionList.innerHTML = latestInsightActions.map((action) => `<li>${action}</li>`).join('');

  const chartPalette = getChartPalette();

  departmentChartInstance = renderChart(
    departmentChartCanvas,
    departmentChartInstance,
    payload.distributions?.departments || {},
    'No department data available.',
    'Departments',
    chartPalette.department
  );

  managerChartInstance = renderChart(
    managerChartCanvas,
    managerChartInstance,
    payload.distributions?.managers || {},
    'No manager data available.',
    'Managers',
    chartPalette.manager
  );
}

function updateInsightsFallback(employees) {
  const departmentCounts = {};
  const managerCounts = {};
  let salaryTotal = 0;
  let highest = employees[0] || null;

  for (const employee of employees) {
    salaryTotal += Number(employee.salary) || 0;
    departmentCounts[employee.department] = (departmentCounts[employee.department] || 0) + 1;
    managerCounts[employee.manager] = (managerCounts[employee.manager] || 0) + 1;
    if (!highest || Number(employee.salary) > Number(highest.salary)) {
      highest = employee;
    }
  }

  const averageSalary = employees.length ? Math.round(salaryTotal / employees.length) : 0;
  const topManager = Object.entries(managerCounts).sort((a, b) => b[1] - a[1])[0] || null;

  setAnimatedStat(totalEmployeesStat, 'totalEmployees', employees.length, (value) => String(Math.round(value)));
  setAnimatedStat(totalDepartmentsStat, 'totalDepartments', Object.keys(departmentCounts).length, (value) => String(Math.round(value)));
  setAnimatedStat(averageSalaryStat, 'averageSalary', averageSalary, (value) => formatCurrency(value));
  setAnimatedStat(managerLoadStat, 'managerLoad', topManager ? topManager[1] : 0, (value) => String(Math.round(value)));
  managerNoteStat.textContent = topManager ? `${topManager[0]} manages the largest visible team` : 'No visible employee records';

  latestInsightSummary = employees.length
    ? `The current view covers ${employees.length} employees across ${Object.keys(departmentCounts).length} departments. Average salary is ${formatCurrency(averageSalary)}${highest ? `, with ${highest.name} highest at ${formatCurrency(highest.salary)}.` : '.'}`
    : 'No records match the current view. Clear the filter or add a new employee to generate AI guidance.';

  latestInsightActions = employees.length
    ? ['Use manager and department filters to inspect team balance.']
    : ['Clear filters to restore the full workforce view.', 'Add an employee record to rebuild insights.'];

  aiSummaryText.textContent = latestInsightSummary;
  aiActionList.innerHTML = latestInsightActions.map((action) => `<li>${action}</li>`).join('');

  const chartPalette = getChartPalette();

  departmentChartInstance = renderChart(
    departmentChartCanvas,
    departmentChartInstance,
    departmentCounts,
    'No department data available.',
    'Departments',
    chartPalette.department
  );

  managerChartInstance = renderChart(
    managerChartCanvas,
    managerChartInstance,
    managerCounts,
    'No manager data available.',
    'Managers',
    chartPalette.manager
  );
}

function buildInsightsQueryParams() {
  const params = new URLSearchParams();
  const query = employeeFilterInput.value.trim();

  if (query) {
    params.set('query', query);
  }

  if (aiFilterMode !== 'all') {
    params.set('ai_mode', aiFilterMode);
  }

  if (aiSalaryFilter?.min !== null && aiSalaryFilter?.min !== undefined) {
    params.set('min_salary', String(aiSalaryFilter.min));
  }

  if (aiSalaryFilter?.max !== null && aiSalaryFilter?.max !== undefined) {
    params.set('max_salary', String(aiSalaryFilter.max));
  }

  return params.toString();
}

async function refreshInsights(fallbackEmployees) {
  const requestId = ++latestInsightsRequestId;
  try {
    const queryString = buildInsightsQueryParams();
    const response = await fetch(queryString ? `/api/insights?${queryString}` : '/api/insights');
    const result = await response.json();

    if (requestId !== latestInsightsRequestId) {
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || 'Unable to load insights.');
    }

    renderInsightsFromPayload(result.data || {});
  } catch (_error) {
    if (requestId !== latestInsightsRequestId) {
      return;
    }
    updateInsightsFallback(fallbackEmployees);
  }
}

function exportAiSummary() {
  const lines = [
    'Medivra AI Workforce Summary',
    '',
    latestInsightSummary,
    '',
    'Suggested Actions:',
    ...latestInsightActions.map((action, index) => `${index + 1}. ${action}`),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'medivra-ai-summary.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('AI summary exported.');
}

function exportChartImage(canvas, filename, emptyMessage) {
  if (!canvas) {
    showToast(emptyMessage, true);
    return;
  }

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast(`Exported ${filename}.`);
}

function speakAssistantReply(text) {
  if (!voiceRepliesEnabled || !('speechSynthesis' in window) || !text) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 260));
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 0.9;
  window.speechSynthesis.speak(utterance);
}

function updateVoiceButtonState() {
  if (!voiceInputButton) {
    return;
  }

  voiceInputButton.textContent = isVoiceListening ? 'Listening...' : 'Voice';
  voiceInputButton.setAttribute('aria-pressed', isVoiceListening ? 'true' : 'false');
}

function updateVoiceReplyToggle() {
  if (!voiceReplyToggle) {
    return;
  }

  voiceReplyToggle.textContent = voiceRepliesEnabled ? 'Voice Replies: On' : 'Voice Replies: Off';
  voiceReplyToggle.setAttribute('aria-pressed', voiceRepliesEnabled ? 'true' : 'false');
}

function stopVoiceRecognition() {
  if (!speechRecognitionInstance) {
    return;
  }

  voiceShortcutActive = false;
  isVoiceListening = false;
  updateVoiceButtonState();
  speechRecognitionInstance.stop();
}

function startVoiceRecognition() {
  if (!speechRecognitionInstance || isVoiceListening) {
    return;
  }

  isVoiceListening = true;
  updateVoiceButtonState();
  speechRecognitionInstance.start();
}

function setupVoiceFeatures() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (voiceInputButton) {
      voiceInputButton.disabled = true;
      voiceInputButton.textContent = 'Voice N/A';
      voiceInputButton.title = 'Speech recognition is not supported in this browser';
    }

    if (voiceShortcutHint) {
      voiceShortcutHint.textContent = 'Voice shortcut unavailable in this browser.';
    }

    return;
  }

  speechRecognitionInstance = new SpeechRecognition();
  speechRecognitionInstance.lang = 'en-US';
  speechRecognitionInstance.interimResults = false;
  speechRecognitionInstance.maxAlternatives = 1;

  speechRecognitionInstance.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
    if (!transcript) {
      return;
    }

    aiQueryInput.value = transcript;
    applyAiQuery(transcript);
  };

  speechRecognitionInstance.onerror = () => {
    isVoiceListening = false;
    updateVoiceButtonState();
    showToast('Voice input could not be processed. Try again.', true);
  };

  speechRecognitionInstance.onend = () => {
    isVoiceListening = false;
    updateVoiceButtonState();
  };

  voiceInputButton?.addEventListener('click', () => {
    if (!speechRecognitionInstance) {
      return;
    }

    if (isVoiceListening) {
      stopVoiceRecognition();
      return;
    }

    startVoiceRecognition();
  });

  updateVoiceButtonState();
}

function applyEmployeeFilter() {
  const filteredEmployees = getFilteredEmployees();
  const sortedEmployees = sortEmployees(filteredEmployees);
  const { totalPages, paginatedEmployees, startIndex } = paginateEmployees(sortedEmployees);

  renderEmployeesTable(paginatedEmployees);
  updateDetailsMessage(filteredEmployees);
  updatePaginationControls(filteredEmployees.length, totalPages, startIndex, paginatedEmployees.length);
  updateSortDirectionButton();
  updateSortableHeaders();
  refreshInsights(filteredEmployees);
  return filteredEmployees;
}

function renderEmployee(employee) {
  employeeCard.innerHTML = `
    <dl>
      <dt>ID</dt><dd>${formatEmployeeId(employee.id)}</dd>
      <dt>Name</dt><dd>${employee.name}</dd>
      <dt>Email</dt><dd>${employee.email}</dd>
      <dt>Salary</dt><dd>${formatCurrency(Number(employee.salary))}</dd>
      <dt>Department</dt><dd>${employee.department}</dd>
      <dt>Manager</dt><dd>${employee.manager}</dd>
      <dt>Geo Location</dt><dd>${employee.geo_location}</dd>
    </dl>
  `;
  employeeCard.classList.remove('hidden');
}

function renderEmployeesTable(employees) {
  if (!employees.length) {
    employeesTableBody.innerHTML = '<tr><td colspan="8" class="empty-table-state">No employees found.</td></tr>';
    return;
  }

  employeesTableBody.innerHTML = employees
    .map((employee) => `
      <tr class="employee-row-card">
        <td data-label="ID"><span class="id-badge">${formatEmployeeId(employee.id)}</span></td>
        <td data-label="Name" title="${employee.name}">${employee.name}</td>
        <td data-label="Email" class="truncate-cell" title="${employee.email}">${employee.email}</td>
        <td data-label="Salary"><span class="salary-pill">${formatCurrency(Number(employee.salary))}</span></td>
        <td data-label="Department" title="${employee.department}">${employee.department}</td>
        <td data-label="Manager" title="${employee.manager}">${employee.manager}</td>
        <td data-label="Geo Location" class="truncate-cell" title="${employee.geo_location}">${employee.geo_location}</td>
        <td data-label="Actions">
          <div class="row-actions row-actions-inline">
            <button type="button" class="table-button table-icon-button" data-action="view" data-id="${employee.id}" title="View employee details" aria-label="View employee details">
              <span class="table-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><path d="M12 5C6.5 5 2.1 8.3 1 12c1.1 3.7 5.5 7 11 7s9.9-3.3 11-7c-1.1-3.7-5.5-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"/></svg>
              </span>
              <span class="table-button-text">View</span>
            </button>
            <button type="button" class="table-button table-icon-button button-secondary" data-action="edit" data-id="${employee.id}" title="Modify employee" aria-label="Modify employee">
              <span class="table-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><path d="M3 17.3V21h3.7L18 9.7 14.3 6 3 17.3Zm17.7-10.1a1 1 0 0 0 0-1.4l-2.5-2.5a1 1 0 0 0-1.4 0L15 5l3.7 3.7 2-1.8Z"/></svg>
              </span>
              <span class="table-button-text">Modify</span>
            </button>
            <button type="button" class="table-button table-icon-button button-danger" data-action="delete" data-id="${employee.id}" title="Delete employee" aria-label="Delete employee">
              <span class="table-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 10h2v8H7v-8Z"/></svg>
              </span>
              <span class="table-button-text">Delete</span>
            </button>
          </div>
        </td>
      </tr>
    `)
    .join('');
}

async function fetchEmployee(employeeId) {
  const response = await fetch(`/api/employees/${encodeURIComponent(employeeId)}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Employee not found.');
  }

  return result.data;
}

async function handleEditEmployee(employeeId) {
  clearMessage(addMessage);

  try {
    const employee = await fetchEmployee(employeeId);
    fillForm(employee);
    setFormModeForEdit(employee);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMessage(addMessage, `Editing ${employee.name} (${formatEmployeeId(employee.id)}). Update the fields and save changes.`);
    showToast(`Editing ${employee.name} (${formatEmployeeId(employee.id)}).`);
  } catch (error) {
    setMessage(addMessage, error.message || 'Unable to load employee for editing.', true);
    showToast(error.message || 'Unable to load employee for editing.', true);
  }
}

async function handleDeleteEmployee(employeeId) {
  const confirmed = window.confirm(`Delete employee ${formatEmployeeId(employeeId)}?`);
  if (!confirmed) {
    return;
  }

  clearMessage(addMessage);

  try {
    const response = await fetch(`/api/employees/${encodeURIComponent(employeeId)}`, {
      method: 'DELETE',
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(addMessage, result.message || 'Unable to delete employee.', true);
      showToast(result.message || 'Unable to delete employee.', true);
      return;
    }

    if (editingEmployeeId === employeeId) {
      resetForm();
    }

    employeeCard.classList.add('hidden');
    setMessage(addMessage, `Employee ${result.data.name} was deleted successfully. Removed ID: ${formatEmployeeId(result.data.id)}.`);
    showToast(`Deleted ${result.data.name} (${formatEmployeeId(result.data.id)}).`);
    await loadEmployees();
  } catch (_error) {
    setMessage(addMessage, 'Could not contact server. Please try again.', true);
    showToast('Could not contact server. Please try again.', true);
  }
}

async function loadEmployees() {
  clearMessage(detailsMessage);
  try {
    const response = await fetch('/api/employees');
    const result = await response.json();

    if (!response.ok) {
      setMessage(detailsMessage, result.message || 'Unable to load employee details.', true);
      showToast(result.message || 'Unable to load employee details.', true);
      return;
    }

    allEmployees = result.data || [];
    applyEmployeeFilter();
  } catch (_error) {
    setMessage(detailsMessage, 'Could not load employee details from server.', true);
    showToast('Could not load employee details from server.', true);
  }
}

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(searchMessage);
  employeeCard.classList.add('hidden');

  const empIdInput = document.getElementById('emp-id').value.trim();
  if (!empIdInput) {
    setMessage(searchMessage, 'Please enter an employee ID.', true);
    showToast('Please enter an employee ID.', true);
    return;
  }

  const empId = parseEmployeeId(empIdInput);
  if (!empId || empId < 1) {
    setMessage(searchMessage, 'Enter a valid employee ID like EMP-0001 or 1.', true);
    showToast('Enter a valid employee ID like EMP-0001 or 1.', true);
    return;
  }

  try {
    const response = await fetch(`/api/employees/${encodeURIComponent(empId)}`);
    const result = await response.json();

    if (!response.ok) {
      setMessage(searchMessage, result.message || 'Employee not found.', true);
      showToast(result.message || 'Employee not found.', true);
      return;
    }

    setMessage(searchMessage, 'Employee found.');
    showToast(`Found ${result.data.name} (${formatEmployeeId(result.data.id)}).`);
    renderEmployee(result.data);
    await loadEmployees();
  } catch (_error) {
    setMessage(searchMessage, 'Could not contact server. Please try again.', true);
    showToast('Could not contact server. Please try again.', true);
  }
});

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(addMessage);

  const payload = getEmployeePayload();

  const emptyField = Object.entries(payload).find(([, value]) => value === '' || Number.isNaN(value));
  if (emptyField) {
    setMessage(addMessage, 'Please fill all fields with valid values.', true);
    showToast('Please fill all fields with valid values.', true);
    return;
  }

  try {
    const isEditing = editingEmployeeId !== null;
    const response = await fetch(isEditing ? `/api/employees/${encodeURIComponent(editingEmployeeId)}` : '/api/employees', {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(addMessage, result.message || 'Unable to add employee.', true);
      showToast(result.message || 'Unable to add employee.', true);
      return;
    }

    setMessage(addMessage, isEditing
      ? `Employee ${result.data.name} was updated successfully. ID: ${formatEmployeeId(result.data.id)} | Department: ${result.data.department} | Email: ${result.data.email}`
      : `Employee ${result.data.name} was added successfully. Assigned ID: ${formatEmployeeId(result.data.id)} | Department: ${result.data.department} | Email: ${result.data.email}`);
    showToast(isEditing
      ? `Updated ${result.data.name} (${formatEmployeeId(result.data.id)}).`
      : `Added ${result.data.name} (${formatEmployeeId(result.data.id)}).`);
    renderEmployee(result.data);
    resetForm();
    await loadEmployees();
  } catch (_error) {
    setMessage(addMessage, 'Could not contact server. Please try again.', true);
    showToast('Could not contact server. Please try again.', true);
  }
});

employeesTableBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const employeeId = Number.parseInt(button.dataset.id, 10);
  if (!employeeId) {
    return;
  }

  if (button.dataset.action === 'edit') {
    await handleEditEmployee(employeeId);
    return;
  }

  if (button.dataset.action === 'view') {
    try {
      const employee = await fetchEmployee(employeeId);
      openEmployeeModal(employee);
    } catch (error) {
      setMessage(detailsMessage, error.message || 'Unable to load employee details.', true);
      showToast(error.message || 'Unable to load employee details.', true);
    }
    return;
  }

  if (button.dataset.action === 'delete') {
    await handleDeleteEmployee(employeeId);
  }
});

employeeFilterInput.addEventListener('input', () => {
  currentPage = 1;
  applyEmployeeFilter();
});

clearFilterButton.addEventListener('click', () => {
  resetAiModes();
  employeeFilterInput.value = '';
  currentPage = 1;
  applyEmployeeFilter();
  employeeFilterInput.focus();
});

sortFieldSelect.addEventListener('change', () => {
  currentSortField = sortFieldSelect.value;
  currentPage = 1;
  applyEmployeeFilter();
});

sortDirectionButton.addEventListener('click', () => {
  currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
  currentPage = 1;
  applyEmployeeFilter();
});

tableSortableHeaders.forEach((header) => {
  const handleSort = () => {
    const field = header.dataset.sort;
    if (!field) {
      return;
    }

    if (currentSortField === field) {
      currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      currentSortField = field;
      currentSortDirection = field === 'salary' ? 'desc' : 'asc';
    }

    if (sortFieldSelect.querySelector(`option[value="${currentSortField}"]`)) {
      sortFieldSelect.value = currentSortField;
    }

    currentPage = 1;
    applyEmployeeFilter();
  };

  header.addEventListener('click', handleSort);
  header.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSort();
    }
  });
});

prevPageButton.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage -= 1;
    applyEmployeeFilter();
  }
});

nextPageButton.addEventListener('click', () => {
  currentPage += 1;
  applyEmployeeFilter();
});

cancelEditButton.addEventListener('click', () => {
  clearMessage(addMessage);
  resetForm();
});

closeModalButton.addEventListener('click', () => {
  closeEmployeeModal();
});

modalBackdrop.addEventListener('click', () => {
  closeEmployeeModal();
});

runAiQueryButton.addEventListener('click', () => {
  applyAiQuery(aiQueryInput.value);
});

resetAiQueryButton.addEventListener('click', () => {
  aiQueryInput.value = '';
  applyAiQuery('show all employees');
});

exportAiSummaryButton.addEventListener('click', () => {
  exportAiSummary();
});

exportDepartmentChartButton.addEventListener('click', () => {
  exportChartImage(departmentChartCanvas, 'medivra-department-mix.png', 'Department chart is not ready yet.');
});

exportManagerChartButton.addEventListener('click', () => {
  exportChartImage(managerChartCanvas, 'medivra-manager-coverage.png', 'Manager chart is not ready yet.');
});

voiceReplyToggle?.addEventListener('click', () => {
  voiceRepliesEnabled = !voiceRepliesEnabled;
  updateVoiceReplyToggle();

  if (!voiceRepliesEnabled && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
});

assistantModeSelect?.addEventListener('change', () => {
  assistantMode = isChatMode(assistantModeSelect.value) ? 'chat' : 'data';
  updateAssistantModeUI();
  appendAgentMessage(
    'assistant',
    isChatMode(assistantMode)
      ? 'Switched to Local Chat mode. I will answer from the local assistant backend.'
      : 'Switched to Data Assistant mode. I will now apply filters and insights on this page data.'
  );
});

document.querySelectorAll('[data-ai-prompt]').forEach((button) => {
  button.addEventListener('click', () => {
    aiQueryInput.value = button.dataset.aiPrompt;
    applyAiQuery(button.dataset.aiPrompt);
  });
});

aiQueryInput.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.code === 'Space' && speechRecognitionInstance) {
    event.preventDefault();

    if (!isVoiceListening) {
      voiceShortcutActive = true;
      startVoiceRecognition();
      showToast('Voice listening started (Ctrl + Space).');
    }
    return;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    applyAiQuery(aiQueryInput.value);
  }
});

aiQueryInput.addEventListener('keyup', (event) => {
  if (voiceShortcutActive && (!event.ctrlKey || event.code === 'Space' || event.key === 'Control')) {
    stopVoiceRecognition();
  }
});

aiQueryInput.addEventListener('blur', () => {
  if (voiceShortcutActive) {
    stopVoiceRecognition();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !employeeModal.classList.contains('hidden')) {
    closeEmployeeModal();
  }
});

themeToggleButton?.addEventListener('click', () => {
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  window.localStorage.setItem(THEME_PREFERENCE_KEY, nextTheme);

  if (allEmployees.length) {
    refreshInsights(getFilteredEmployees());
  }
});

initializeTheme();
setFormModeForAdd();
sortFieldSelect.value = currentSortField;
updateSortDirectionButton();
updateVoiceReplyToggle();
updateAssistantModeUI();
setupVoiceFeatures();
setupFloatingAssistant();
setupCollapsiblePanels();
loadEmployees();
