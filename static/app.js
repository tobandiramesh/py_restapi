const searchForm = document.getElementById('search-form');
const addForm = document.getElementById('add-form');
const searchMessage = document.getElementById('search-message');
const addMessage = document.getElementById('add-message');
const employeeCard = document.getElementById('employee-card');

function setMessage(target, text, isError = false) {
  target.textContent = text;
  target.className = `message ${isError ? 'error' : 'ok'}`;
}

function clearMessage(target) {
  target.textContent = '';
  target.className = 'message';
}

function renderEmployee(employee) {
  employeeCard.innerHTML = `
    <dl>
      <dt>ID</dt><dd>${employee.id}</dd>
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

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(searchMessage);
  employeeCard.classList.add('hidden');

  const empId = document.getElementById('emp-id').value.trim();
  if (!empId) {
    setMessage(searchMessage, 'Please enter an employee ID.', true);
    return;
  }

  try {
    const response = await fetch(`/api/employees/${encodeURIComponent(empId)}`);
    const result = await response.json();

    if (!response.ok) {
      setMessage(searchMessage, result.message || 'Employee not found.', true);
      return;
    }

    setMessage(searchMessage, 'Employee found.');
    renderEmployee(result.data);
  } catch (error) {
    setMessage(searchMessage, 'Could not contact server. Please try again.', true);
  }
});

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(addMessage);

  const payload = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    salary: Number(document.getElementById('salary').value),
    department: document.getElementById('department').value.trim(),
    manager: document.getElementById('manager').value.trim(),
    geo_location: document.getElementById('geo-location').value.trim(),
  };

  const emptyField = Object.entries(payload).find(([, value]) => value === '' || Number.isNaN(value));
  if (emptyField) {
    setMessage(addMessage, 'Please fill all fields with valid values.', true);
    return;
  }

  try {
    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(addMessage, result.message || 'Unable to add employee.', true);
      return;
    }

    setMessage(addMessage, `Employee added successfully with ID ${result.data.id}.`);
    addForm.reset();
  } catch (error) {
    setMessage(addMessage, 'Could not contact server. Please try again.', true);
  }
});
