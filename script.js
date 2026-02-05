document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const contactList = document.getElementById('contact-list');
    const searchInput = document.getElementById('search');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const formTitle = document.getElementById('form-title');
    
    // State
    let contacts = JSON.parse(localStorage.getItem('contacts')) || [];
    let isEditing = false;
    let editId = null;

    // Functions
    const saveToLocalStorage = () => {
        localStorage.setItem('contacts', JSON.stringify(contacts));
    };

    const renderContacts = (filter = '') => {
        contactList.innerHTML = '';
        
        const filteredContacts = contacts.filter(contact => 
            contact.name.toLowerCase().includes(filter.toLowerCase()) ||
            contact.phone.includes(filter) ||
            contact.email.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredContacts.length === 0) {
            contactList.innerHTML = '<tr><td colspan="4" style="text-align:center;">No contacts found</td></tr>';
            return;
        }

        filteredContacts.forEach(contact => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${contact.name}</td>
                <td>${contact.phone}</td>
                <td>${contact.email}</td>
                <td class="action-btns">
                    <button class="btn btn-sm btn-edit" onclick="editContact('${contact.id}')">Edit</button>
                    <button class="btn btn-sm btn-delete" onclick="deleteContact('${contact.id}')">Delete</button>
                </td>
            `;
            contactList.appendChild(tr);
        });
    };

    const resetForm = () => {
        contactForm.reset();
        isEditing = false;
        editId = null;
        formTitle.textContent = 'Add New Contact';
        submitBtn.textContent = 'Add Contact';
        cancelBtn.style.display = 'none';
    };

    // Global scope functions for onclick handlers
    window.deleteContact = (id) => {
        if (confirm('Are you sure you want to delete this contact?')) {
            contacts = contacts.filter(c => c.id !== id);
            saveToLocalStorage();
            renderContacts(searchInput.value);
            if (isEditing && editId === id) resetForm();
        }
    };

    window.editContact = (id) => {
        const contact = contacts.find(c => c.id === id);
        if (contact) {
            document.getElementById('contact-id').value = contact.id;
            document.getElementById('name').value = contact.name;
            document.getElementById('phone').value = contact.phone;
            document.getElementById('email').value = contact.email;
            
            isEditing = true;
            editId = id;
            formTitle.textContent = 'Edit Contact';
            submitBtn.textContent = 'Update Contact';
            cancelBtn.style.display = 'inline-block';
            
            // Scroll to form
            contactForm.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Event Listeners
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;

        if (isEditing) {
            contacts = contacts.map(c => 
                c.id === editId ? { ...c, name, phone, email } : c
            );
        } else {
            const newContact = {
                id: Date.now().toString(),
                name,
                phone,
                email
            };
            contacts.push(newContact);
        }

        saveToLocalStorage();
        renderContacts(searchInput.value);
        resetForm();
    });

    cancelBtn.addEventListener('click', resetForm);

    searchInput.addEventListener('input', (e) => {
        renderContacts(e.target.value);
    });

    // Initial render
    renderContacts();
});
