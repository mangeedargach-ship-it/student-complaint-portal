const API_URL = '/api/complaints';

// ==========================================
// 1. KUTAA FUULA BARATAA (index.html)
// ==========================================
const complaintForm = document.getElementById('complaint-form');
const studentList = document.getElementById('student-complaint-list');
const formMessage = document.getElementById('form-message');

if (complaintForm) {
  // Komii haaraa erguu
  complaintForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      student_name: document.getElementById('student_name').value.trim(),
      student_id: document.getElementById('student_id').value.trim(),
      department: document.getElementById('department').value.trim(),
      category: document.getElementById('category').value,
      description: document.getElementById('description').value.trim(),
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        formMessage.style.color = '#15803d';
        formMessage.textContent = 'Komiin keessan milkaa\'inaan ergameera!';
        complaintForm.reset();
        loadStudentComplaints();
      } else {
        const errData = await res.json();
        formMessage.style.color = '#dc2626';
        formMessage.textContent = errData.error || 'Dogoggorri uumameera.';
      }
    } catch (err) {
      formMessage.style.color = '#dc2626';
      formMessage.textContent = 'Server waliin walqunnamuun hin danda\'amne.';
    }
  });

  // Komiiwwan dhiyaatan agarsiisuu
  async function loadStudentComplaints() {
    try {
      const res = await fetch(API_URL);
      const complaints = await res.json();
      studentList.innerHTML = '';

      if (complaints.length === 0) {
        studentList.innerHTML = '<p style="color:#64748b;">Hanga ammaatti komiin galmaa\'e hin jiru.</p>';
        return;
      }

      complaints.forEach((c) => {
        const badgeClass = `badge-${c.status.replace(' ', '-')}`;
        const date = new Date(c.created_at).toLocaleDateString();

        const div = document.createElement('div');
        div.className = 'complaint-item';
        div.innerHTML = `
          <div class="complaint-top">
            <span class="complaint-title">${c.category}</span>
            <span class="badge ${badgeClass}">${c.status}</span>
          </div>
          <div class="complaint-meta">
            Barataa: <strong>${c.student_name}</strong> (${c.student_id}) | Dept: ${c.department} | Guyyaa: ${date}
          </div>
          <p class="complaint-desc">${c.description}</p>
        `;
        studentList.appendChild(div);
      });
    } catch (err) {
      console.error('Error loading complaints:', err);
    }
  }

  loadStudentComplaints();
}

// ==========================================
// 2. KUTAA FUULA ADMIN (admin.html)
// ==========================================
const adminList = document.getElementById('admin-complaint-list');
const filterSelect = document.getElementById('filter-status');

if (adminList) {
  let allComplaints = [];

  async function loadAdminComplaints() {
    try {
      const res = await fetch(API_URL);
      allComplaints = await res.json();
      renderAdminComplaints();
    } catch (err) {
      console.error('Error loading admin complaints:', err);
    }
  }

  function renderAdminComplaints() {
    const selectedStatus = filterSelect ? filterSelect.value : 'All';
    const filtered =
      selectedStatus === 'All'
        ? allComplaints
        : allComplaints.filter((c) => c.status === selectedStatus);

    adminList.innerHTML = '';

    if (filtered.length === 0) {
      adminList.innerHTML = '<p style="color:#64748b;">Komiin argame hin jiru.</p>';
      return;
    }

    filtered.forEach((c) => {
      const badgeClass = `badge-${c.status.replace(' ', '-')}`;
      const date = new Date(c.created_at).toLocaleString();

      const div = document.createElement('div');
      div.className = 'complaint-item';
      div.innerHTML = `
        <div class="complaint-top">
          <span class="complaint-title">#${c.id} - ${c.category}</span>
          <span class="badge ${badgeClass}">${c.status}</span>
        </div>
        <div class="complaint-meta">
          Maqaa: <strong>${c.student_name}</strong> | ID: ${c.student_id} | Dept: ${c.department} | Yeroo: ${date}
        </div>
        <p class="complaint-desc">${c.description}</p>
        <div class="admin-actions">
          <label for="status-${c.id}" style="margin:0;">Status Jijjiiri:</label>
          <select id="status-${c.id}" onchange="updateStatus(${c.id}, this.value)">
            <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
          </select>
          <button class="btn-delete" onclick="deleteComplaint(${c.id})">Haqi (Delete)</button>
        </div>
      `;
      adminList.appendChild(div);
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', renderAdminComplaints);
  }

  // Status komii jijjiiruu
  window.updateStatus = async function (id, newStatus) {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadAdminComplaints();
    } catch (err) {
      alert('Status jijjiiruun hin danda\'amne.');
    }
  };

  // Komii haquu
  window.deleteComplaint = async function (id) {
    if (!confirm('Dhuguma komii kana haquu barbaaddaa?')) return;

    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      loadAdminComplaints();
    } catch (err) {
      alert('Haquun hin danda\'amne.');
    }
  };

  loadAdminComplaints();
}