const searchForm = document.getElementById('search-form');
const addForm = document.getElementById('add-form');
const searchMessage = document.getElementById('search-message');
const addMessage = document.getElementById('add-message');
const employeeCard = document.getElementById('employee-card');
const detailsMessage = document.getElementById('details-message');
const employeesTableBody = document.getElementById('employees-table-body');
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

let editingEmployeeId = null;
let allEmployees = [];
let currentSortField = 'id';
let currentSortDirection = 'asc';
let currentPage = 1;

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
      <div class="modal-item"><span>Salary</span><strong>${employee.salary}</strong></div>
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

function getFilteredEmployees() {
  const query = employeeFilterInput.value.trim().toLowerCase();
  if (!query) {
    return [...allEmployees];
  }

  return allEmployees.filter((employee) => {
    const searchableText = [
      formatEmployeeId(employee.id),
      String(employee.id),
      employee.name,
      employee.email,
      employee.department,
      employee.manager,
      employee.geo_location,
    ]
      .join(' ')
      .toLowerCase();

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

  return {
    totalPages,
    paginatedEmployees,
    startIndex,
  };
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

function updateDetailsMessage(filteredEmployees) {
  const query = employeeFilterInput.value.trim();
  if (!query) {
    setMessage(detailsMessage, `Showing ${filteredEmployees.length} employee record(s).`);
    return;
  }

  setMessage(detailsMessage, `Showing ${filteredEmployees.length} filtered employee record(s) for "${query}".`);
}

function applyEmployeeFilter() {
  const filteredEmployees = getFilteredEmployees();
  const sortedEmployees = sortEmployees(filteredEmployees);
  const { totalPages, paginatedEmployees, startIndex } = paginateEmployees(sortedEmployees);

  renderEmployeesTable(paginatedEmployees);
  updateDetailsMessage(filteredEmployees);
  updatePaginationControls(filteredEmployees.length, totalPages, startIndex, paginatedEmployees.length);
  updateSortDirectionButton();
}

function renderEmployee(employee) {
  employeeCard.innerHTML = `
    <dl>
      <dt>ID</dt><dd>${formatEmployeeId(employee.id)}</dd>
      <dt>Name</dt><dd>${employee.name}</dd>
      <dt>Email</dt><dd>${employee.email}</dd>
      <dt>Salary</dt><dd>${employee.salary}</dd>
      <dt>Department</dt><dd>${employee.department}</dd>
      <dt>Manager</dt><dd>${employee.manager}</dd>
      <dt>Geo Location</dt><dd>${employee.geo_location}</dd>
    </dl>
  `;
  employeeCard.classList.remove('hidden');
}

function renderEmployeesTable(employees) {
  if (!employees.length) {
    employeesTableBody.innerHTML = '<tr><td colspan="8">No employees found.</td></tr>';
    return;
  }

  employeesTableBody.innerHTML = employees
    .map((employee) => `
      <tr>
        <td>${formatEmployeeId(employee.id)}</td>
        <td>${employee.name}</td>
        <td>${employee.email}</td>
        <td>${employee.salary}</td>
        <td>${employee.department}</td>
        <td>${employee.manager}</td>
        <td>${employee.geo_location}</td>
        <td>
          <div class="row-actions">
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !employeeModal.classList.contains('hidden')) {
    closeEmployeeModal();
  }
});

setFormModeForAdd();
sortFieldSelect.value = currentSortField;
updateSortDirectionButton();
loadEmployees();
