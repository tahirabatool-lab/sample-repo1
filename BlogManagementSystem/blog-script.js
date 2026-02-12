// Blog posts storage
let blogPosts = JSON.parse(localStorage.getItem('blogPosts')) || [];
let editingPostId = null;

// DOM elements
const postForm = document.getElementById('postForm');
const postsContainer = document.getElementById('postsContainer');
const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const notification = document.getElementById('notification');
const editorTitle = document.getElementById('editorTitle');
const submitBtn = document.getElementById('submitBtn');
const submitBtnText = document.getElementById('submitBtnText');
const cancelBtn = document.getElementById('cancelBtn');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    renderPosts();
    updateStats();
});

// Create/Update Post
postForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const postTitle = document.getElementById('postTitle').value;
    const postAuthor = document.getElementById('postAuthor').value;
    const postCategory = document.getElementById('postCategory').value;
    const postContent = document.getElementById('postContent').value;
    const postTags = document.getElementById('postTags').value;
    
    if (editingPostId) {
        // Update existing post
        const postIndex = blogPosts.findIndex(post => post.id === editingPostId);
        if (postIndex !== -1) {
            blogPosts[postIndex] = {
                ...blogPosts[postIndex],
                title: postTitle,
                author: postAuthor,
                category: postCategory,
                content: postContent,
                tags: postTags ? postTags.split(',').map(tag => tag.trim()) : [],
                updatedAt: new Date().toISOString()
            };
            showNotification('Post updated successfully!', 'success');
        }
        editingPostId = null;
        resetForm();
    } else {
        // Create new post
        const newPost = {
            id: Date.now(),
            title: postTitle,
            author: postAuthor,
            category: postCategory,
            content: postContent,
            tags: postTags ? postTags.split(',').map(tag => tag.trim()) : [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        blogPosts.unshift(newPost);
        showNotification('Post published successfully!', 'success');
        postForm.reset();
    }
    
    saveToLocalStorage();
    renderPosts();
    updateStats();
});

// Cancel editing
cancelBtn.addEventListener('click', function() {
    editingPostId = null;
    resetForm();
});

// Search functionality
searchInput.addEventListener('input', function() {
    renderPosts();
});

// Filter by category
filterCategory.addEventListener('change', function() {
    renderPosts();
});

// Render posts
function renderPosts() {
    let filteredPosts = blogPosts;
    
    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredPosts = filteredPosts.filter(post =>
            post.title.toLowerCase().includes(searchTerm) ||
            post.author.toLowerCase().includes(searchTerm) ||
            post.content.toLowerCase().includes(searchTerm) ||
            post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply category filter
    const selectedCategory = filterCategory.value;
    if (selectedCategory) {
        filteredPosts = filteredPosts.filter(post => post.category === selectedCategory);
    }
    
    if (filteredPosts.length === 0) {
        postsContainer.innerHTML = '<div class="empty-state"><p>📭 No posts found.</p></div>';
        return;
    }
    
    postsContainer.innerHTML = filteredPosts.map(post => `
        <div class="post-item">
            <div class="post-header">
                <div>
                    <div class="post-title">${post.title}</div>
                    <div class="post-meta">
                        <span>👤 ${post.author}</span>
                        <span>📅 ${formatDate(post.createdAt)}</span>
                    </div>
                    <span class="post-category">${post.category}</span>
                </div>
            </div>
            
            <div class="post-content">
                ${post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content}
            </div>
            
            ${post.tags.length > 0 ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="post-actions">
                <button class="btn-edit" onclick="editPost(${post.id})">
                    ✏️ Edit
                </button>
                <button class="btn-delete" onclick="deletePost(${post.id})">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Edit post
function editPost(id) {
    const post = blogPosts.find(p => p.id === id);
    if (!post) return;
    
    editingPostId = id;
    
    document.getElementById('postTitle').value = post.title;
    document.getElementById('postAuthor').value = post.author;
    document.getElementById('postCategory').value = post.category;
    document.getElementById('postContent').value = post.content;
    document.getElementById('postTags').value = post.tags.join(', ');
    
    editorTitle.textContent = '✏️ Edit Post';
    submitBtnText.textContent = 'Update Post';
    cancelBtn.style.display = 'block';
    
    // Scroll to form
    document.querySelector('.post-editor').scrollIntoView({ behavior: 'smooth' });
}

// Delete post
function deletePost(id) {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        blogPosts = blogPosts.filter(post => post.id !== id);
        saveToLocalStorage();
        renderPosts();
        updateStats();
        showNotification('Post deleted successfully!', 'success');
    }
}

// Reset form
function resetForm() {
    postForm.reset();
    editorTitle.textContent = '📝 Create New Post';
    submitBtnText.textContent = 'Publish Post';
    cancelBtn.style.display = 'none';
}

// Update statistics
function updateStats() {
    document.getElementById('totalPosts').textContent = blogPosts.length;
    document.getElementById('publishedPosts').textContent = blogPosts.length;
}

// Save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('blogPosts', JSON.stringify(blogPosts));
}

// Format date
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Show notification
function showNotification(message, type) {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}