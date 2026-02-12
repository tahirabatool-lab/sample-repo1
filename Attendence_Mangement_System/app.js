// ==========================================
// STATE MANAGEMENT
// ==========================================
let attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
let currentPage = 1;
const recordsPerPage = 10;
let filteredRecords = [];

// ==========================================
// DOM ELEMENTS
// ==========================================
const elements = {
    form: document.getElementById('attendanceForm'),
    attendanceList: document.getElementById('attendanceList'),
    searchInput: document.getElementById('searchInput'),
    statusFilter: document.getElementById('statusFilter'),
    dateFilter: document.getElementById('dateFilter'),
    clearFilters: document.getElementById('clearFilters'),
    exportBtn: document.getElementById('exportBtn'),
    
    // Edit Modal
    editModal: document.getElementById('editModal'),
    editForm: document.getElementById('editForm'),
    closeModal: document.getElementById('closeModal'),
    cancelEdit: document.getElementById('cancelEdit'),
    
    // Pagination
    pagination: document.getElementById('pagination'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    currentPageEl: document.getElementById('currentPage'),
    totalPagesEl: document.getElementById('totalPages'),
    
    // Stats
    totalRecords: document.getElementById('totalRecords'),
    presentCount: document.getElementById('presentCount'),
    absentCount: document.getElementById('absentCount'),
    lateCount: document.getElementById('lateCount'),
    presentPercentage: document.getElementById('presentPercentage'),
    absentPercentage: document.getElementById('absentPercentage'),
    latePercentage: document.getElementById('latePercentage'),
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    // Initial render
    applyFilters();
    updateStats();
    
    // Event listeners
    setupEventListeners();
});

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Form submission
    elements.form.addEventListener('submit', handleAddRecord);
    
    // Search and filters
    elements.searchInput.addEventListener('input', debounce(applyFilters, 300));
    elements.statusFilter.addEventListener('change', applyFilters);
    elements.dateFilter.addEventListener('change', applyFilters);
    elements.clearFilters.addEventListener('click', clearAllFilters);
    
    // Export
    elements.exportBtn.addEventListener('click', exportToCSV);
    
    // Modal
    elements.closeModal.addEventListener('click', closeEditModal);
    elements.cancelEdit.addEventListener('click', closeEditModal);
    elements.editForm.addEventListener('submit', handleEditRecord);
    
    // Close modal on outside click
    elements.editModal.addEventListener('click', (e) => {
        if (e.target === elements.editModal) {
            closeEditModal();
        }
    });
    
    // Pagination
    elements.prevPage.addEventListener('click', () => changePage(-1));
    elements.nextPage.addEventListener('click', () => changePage(1));
}

// ==========================================
// ADD RECORD
// ==========================================
function handleAddRecord(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newRecord = {
        id: Date.now(),
        studentName: formData.get('studentName').trim(),
        studentId: formData.get('studentId').trim().toUpperCase(),
        date: formData.get('date'),
        status: formData.get('status'),
        remarks: formData.get('remarks').trim(),
        createdAt: new Date().toISOString(),
    };
    
    // Validate
    if (!validateRecord(newRecord)) {
        return;
    }
    
    // Add to records
    attendanceRecords.unshift(newRecord);
    saveToStorage();
    
    // Reset form
    e.target.reset();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    
    // Update UI
    applyFilters();
    updateStats();
    showAlert('Record added successfully!', 'success');
}

// ==========================================
// EDIT RECORD
// ==========================================
function openEditModal(id) {
    const record = attendanceRecords.find(r => r.id === id);
    if (!record) return;
    
    // Populate form
    document.getElementById('editId').value = record.id;
    document.getElementById('editStudentName').value = record.studentName;
    document.getElementById('editStudentId').value = record.studentId;
    document.getElementById('editDate').value = record.date;
    document.getElementById('editStatus').value = record.status;
    document.getElementById('editRemarks').value = record.remarks || '';
    
    // Show modal
    elements.editModal.classList.add('active');
}

function closeEditModal() {
    elements.editModal.classList.remove('active');
    elements.editForm.reset();
}

function handleEditRecord(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('editId').value);
    const index = attendanceRecords.findIndex(r => r.id === id);
    
    if (index === -1) return;
    
    // Update record
    attendanceRecords[index] = {
        ...attendanceRecords[index],
        studentName: document.getElementById('editStudentName').value.trim(),
        studentId: document.getElementById('editStudentId').value.trim().toUpperCase(),
        date: document.getElementById('editDate').value,
        status: document.getElementById('editStatus').value,
        remarks: document.getElementById('editRemarks').value.trim(),
        updatedAt: new Date().toISOString(),
    };
    
    saveToStorage();
    closeEditModal();
    applyFilters();
    updateStats();
    showAlert('Record updated successfully!', 'success');
}

// ==========================================
// DELETE RECORD
// ==========================================
function deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
        return;
    }
    
    attendanceRecords = attendanceRecords.filter(r => r.id !== id);
    saveToStorage();
    applyFilters();
    updateStats();
    showAlert('Record deleted successfully!', 'success');
}

// ==========================================
// FILTERS & SEARCH
// ==========================================
function applyFilters() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const statusFilter = elements.statusFilter.value;
    const dateFilter = elements.dateFilter.value;
    
    filteredRecords = attendanceRecords.filter(record => {
        // Search filter
        const matchesSearch = !searchTerm || 
            record.studentName.toLowerCase().includes(searchTerm) ||
            record.studentId.toLowerCase().includes(searchTerm);
        
        // Status filter
        const matchesStatus = !statusFilter || record.status === statusFilter;
        
        // Date filter
        const matchesDate = !dateFilter || record.date === dateFilter;
        
        return matchesSearch && matchesStatus && matchesDate;
    });
    
    currentPage = 1;
    renderRecords();
}

function clearAllFilters() {
    elements.searchInput.value = '';
    elements.statusFilter.value = '';
    elements.dateFilter.value = '';
    applyFilters();
}

// ==========================================
// RENDER RECORDS
// ==========================================
function renderRecords() {
    if (filteredRecords.length === 0) {
        elements.attendanceList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <h3>No Records Found</h3>
                <p>Try adjusting your filters or add a new record</p>
            </div>
        `;
        elements.pagination.style.display = 'none';
        return;
    }
    
    // Pagination
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);
    
    // Render table
    const tableHTML = `
        <table class="attendance-table">
            <thead>
                <tr>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${paginatedRecords.map(record => `
                    <tr>
                        <td><strong>${escapeHtml(record.studentName)}</strong></td>
                        <td><code>${escapeHtml(record.studentId)}</code></td>
                        <td>${formatDate(record.date)}</td>
                        <td>
                            <span class="status-badge status-${record.status.toLowerCase()}">
                                ${record.status}
                            </span>
                        </td>
                        <td>${escapeHtml(record.remarks) || '-'}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon" onclick="openEditModal(${record.id})" title="Edit">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                <button class="btn-icon danger" onclick="deleteRecord(${record.id})" title="Delete">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    elements.attendanceList.innerHTML = tableHTML;
    
    // Update pagination
    if (totalPages > 1) {
        elements.pagination.style.display = 'flex';
        elements.currentPageEl.textContent = currentPage;
        elements.totalPagesEl.textContent = totalPages;
        elements.prevPage.disabled = currentPage === 1;
        elements.nextPage.disabled = currentPage === totalPages;
    } else {
        elements.pagination.style.display = 'none';
    }
}

// ==========================================
// PAGINATION
// ==========================================
function changePage(direction) {
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    currentPage += direction;
    
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    renderRecords();
    
    // Scroll to top of table
    elements.attendanceList.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// STATISTICS
// ==========================================
function updateStats() {
    const total = attendanceRecords.length;
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter(r => r.date === today);
    
    const present = todayRecords.filter(r => r.status === 'Present').length;
    const absent = todayRecords.filter(r => r.status === 'Absent').length;
    const late = todayRecords.filter(r => r.status === 'Late').length;
    const totalToday = todayRecords.length;
    
    elements.totalRecords.textContent = total;
    elements.presentCount.textContent = present;
    elements.absentCount.textContent = absent;
    elements.lateCount.textContent = late;
    
    // Calculate percentages
    if (totalToday > 0) {
        elements.presentPercentage.textContent = `${Math.round((present / totalToday) * 100)}%`;
        elements.absentPercentage.textContent = `${Math.round((absent / totalToday) * 100)}%`;
        elements.latePercentage.textContent = `${Math.round((late / totalToday) * 100)}%`;
    } else {
        elements.presentPercentage.textContent = '0%';
        elements.absentPercentage.textContent = '0%';
        elements.latePercentage.textContent = '0%';
    }
}

// ==========================================
// EXPORT TO CSV
// ==========================================
function exportToCSV() {
    if (attendanceRecords.length === 0) {
        showAlert('No records to export', 'warning');
        return;
    }
    
    // CSV headers
    const headers = ['Student Name', 'Student ID', 'Date', 'Status', 'Remarks', 'Created At'];
    
    // CSV rows
    const rows = attendanceRecords.map(record => [
        record.studentName,
        record.studentId,
        record.date,
        record.status,
        record.remarks || '',
        new Date(record.createdAt).toLocaleString()
    ]);
    
    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_records_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('Records exported successfully!', 'success');
}

// ==========================================
// VALIDATION
// ==========================================
function validateRecord(record) {
    let isValid = true;
    
    // Clear previous errors
    document.getElementById('nameError').textContent = '';
    document.getElementById('idError').textContent = '';
    
    // Validate name
    if (record.studentName.length < 2) {
        document.getElementById('nameError').textContent = 'Name must be at least 2 characters';
        isValid = false;
    }
    
    // Validate ID
    if (record.studentId.length < 3) {
        document.getElementById('idError').textContent = 'ID must be at least 3 characters';
        isValid = false;
    }
    
    // Check for duplicate entry (same student, same date)
    const duplicate = attendanceRecords.find(r => 
        r.studentId === record.studentId && 
        r.date === record.date &&
        r.id !== record.id
    );
    
    if (duplicate) {
        showAlert('An attendance record already exists for this student on this date', 'error');
        isValid = false;
    }
    
    return isValid;
}

// ==========================================
// UTILITIES
// ==========================================
function saveToStorage() {
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
}

function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
    };
    
    alert.innerHTML = `
        ${icons[type] || icons.success}
        <span>${message}</span>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        alert.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        elements.searchInput.focus();
    }
    
    // Escape to close modal
    if (e.key === 'Escape' && elements.editModal.classList.contains('active')) {
        closeEditModal();
    }
});

// Make functions globally available for onclick handlers
window.openEditModal = openEditModal;
window.deleteRecord = deleteRecord;