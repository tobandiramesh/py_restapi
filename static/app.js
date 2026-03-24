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

const PAGE_SIZE = 5;

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
          backgroundColor: 'rgba(12, 28, 26, 0.92)',
          titleColor: '#ffffff',
          bodyColor: '#ecfffb',
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(245, 255, 252, 0.84)', maxRotation: 0, minRotation: 0 },
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: 'rgba(245, 255, 252, 0.72)' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
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

async function askLocalAssistant(prompt) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Assistant request failed.');
  }

  return result.data || {};
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
  totalEmployeesStat.textContent = String(payload.visible_count || 0);
  totalDepartmentsStat.textContent = String(payload.department_count || 0);
  averageSalaryStat.textContent = formatCurrency(Number(payload.average_salary || 0));
  managerLoadStat.textContent = payload.top_manager ? String(payload.top_manager.count) : '0';
  managerNoteStat.textContent = payload.top_manager
    ? `${payload.top_manager.name} manages the largest visible team`
    : 'No visible employee records';

  latestInsightSummary = payload.summary || 'No insights available.';
  latestInsightActions = Array.isArray(payload.actions) && payload.actions.length
    ? payload.actions
    : ['No recommendations available.'];

  aiSummaryText.textContent = latestInsightSummary;
  aiActionList.innerHTML = latestInsightActions.map((action) => `<li>${action}</li>`).join('');

  departmentChartInstance = renderChart(
    departmentChartCanvas,
    departmentChartInstance,
    payload.distributions?.departments || {},
    'No department data available.',
    'Departments',
    ['rgba(217, 239, 233, 0.95)', 'rgba(190, 228, 220, 0.92)', 'rgba(157, 213, 201, 0.9)', 'rgba(118, 187, 171, 0.88)', 'rgba(242, 228, 198, 0.88)']
  );

  managerChartInstance = renderChart(
    managerChartCanvas,
    managerChartInstance,
    payload.distributions?.managers || {},
    'No manager data available.',
    'Managers',
    ['rgba(242, 228, 198, 0.95)', 'rgba(232, 211, 170, 0.92)', 'rgba(217, 239, 233, 0.9)', 'rgba(157, 213, 201, 0.88)', 'rgba(118, 187, 171, 0.86)']
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

  totalEmployeesStat.textContent = String(employees.length);
  totalDepartmentsStat.textContent = String(Object.keys(departmentCounts).length);
  averageSalaryStat.textContent = formatCurrency(averageSalary);
  managerLoadStat.textContent = topManager ? String(topManager[1]) : '0';
  managerNoteStat.textContent = topManager ? `${topManager[0]} manages the largest visible team` : 'No visible employee records';

  latestInsightSummary = employees.length
    ? `The current view covers ${employees.length} employees across ${Object.keys(departmentCounts).length} departments. Average salary is ${formatCurrency(averageSalary)}${highest ? `, with ${highest.name} highest at ${formatCurrency(highest.salary)}.` : '.'}`
    : 'No records match the current view. Clear the filter or add a new employee to generate AI guidance.';

  latestInsightActions = employees.length
    ? ['Use manager and department filters to inspect team balance.']
    : ['Clear filters to restore the full workforce view.', 'Add an employee record to rebuild insights.'];

  aiSummaryText.textContent = latestInsightSummary;
  aiActionList.innerHTML = latestInsightActions.map((action) => `<li>${action}</li>`).join('');

  departmentChartInstance = renderChart(
    departmentChartCanvas,
    departmentChartInstance,
    departmentCounts,
    'No department data available.',
    'Departments',
    ['rgba(217, 239, 233, 0.95)', 'rgba(190, 228, 220, 0.92)', 'rgba(157, 213, 201, 0.9)', 'rgba(118, 187, 171, 0.88)', 'rgba(242, 228, 198, 0.88)']
  );

  managerChartInstance = renderChart(
    managerChartCanvas,
    managerChartInstance,
    managerCounts,
    'No manager data available.',
    'Managers',
    ['rgba(242, 228, 198, 0.95)', 'rgba(232, 211, 170, 0.92)', 'rgba(217, 239, 233, 0.9)', 'rgba(157, 213, 201, 0.88)', 'rgba(118, 187, 171, 0.86)']
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
      <tr>
        <td><span class="id-badge">${formatEmployeeId(employee.id)}</span></td>
        <td title="${employee.name}">${employee.name}</td>
        <td class="truncate-cell" title="${employee.email}">${employee.email}</td>
        <td><span class="salary-pill">${formatCurrency(Number(employee.salary))}</span></td>
        <td title="${employee.department}">${employee.department}</td>
        <td title="${employee.manager}">${employee.manager}</td>
        <td class="truncate-cell" title="${employee.geo_location}">${employee.geo_location}</td>
        <td>
          <div class="row-actions row-actions-inline">
            <button type="button" class="table-button" data-action="view" data-id="${employee.id}">View</button>
            <button type="button" class="table-button button-secondary" data-action="edit" data-id="${employee.id}">Modify</button>
            <button type="button" class="table-button button-danger" data-action="delete" data-id="${employee.id}">Delete</button>
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

setFormModeForAdd();
sortFieldSelect.value = currentSortField;
updateSortDirectionButton();
updateVoiceReplyToggle();
updateAssistantModeUI();
setupVoiceFeatures();
loadEmployees();
