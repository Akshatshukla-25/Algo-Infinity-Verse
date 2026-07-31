// ===== STATE MANAGEMENT =====
const COMMUNITY_STORAGE_KEY = 'algoInfinityVerse_communityPosts';

// Sample initial data if storage is empty
const initialPosts = [
    {
        id: 1,
        title: "How to approach dynamic programming?",
        content: "I always struggle with finding the state and base cases for DP problems. What's a good mental model for this?",
        tags: ["dp", "help", "strategy"],
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        votes: 12,
        userVote: 0,
        comments: [
            { text: "Try to solve it recursively first, then memoize it. If you can write the recursive relation, you have your state!", timestamp: new Date(Date.now() - 80000000).toISOString() }
        ]
    },
    {
        id: 2,
        title: "Great resource for Graph Algorithms",
        content: "Just found this amazing visualization tool for Dijkstra and A*. It really helped me understand how the priority queue works under the hood.",
        tags: ["graphs", "resources"],
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        votes: 24,
        userVote: 1,
        comments: []
    }
];

function getPosts() {
    const stored = localStorage.getItem(COMMUNITY_STORAGE_KEY);
    if (stored) {
        let posts = JSON.parse(stored);
        let migrated = false;
        posts = posts.map(p => {
            if (p.likes !== undefined) {
                p.votes = p.likes;
                p.userVote = p.isLiked ? 1 : 0;
                delete p.likes;
                delete p.isLiked;
                migrated = true;
            }
            return p;
        });
        if (migrated) savePosts(posts);
        return reconcilePosts(validatePosts(posts));
    }
    // Set initial data if none exists
    localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(initialPosts));
    return initialPosts;
}

function savePosts(posts) {
    const validatedPosts = validatePosts(posts);
    const reconciledPosts = reconcilePosts(validatedPosts);

    localStorage.setItem(
        COMMUNITY_STORAGE_KEY,
        JSON.stringify(reconciledPosts)
    );
}

function validatePosts(posts) {
    return posts.filter(post =>
        post &&
        typeof post.id !== "undefined" &&
        typeof post.title === "string" &&
        typeof post.content === "string"
    );
}

function reconcilePosts(posts) {
    const uniquePosts = new Map();

    posts.forEach(post => {
        const existing = uniquePosts.get(post.id);

        if (!existing) {
            uniquePosts.set(post.id, post);
            return;
        }

        const existingTime = new Date(existing.timestamp).getTime();
        const currentTime = new Date(post.timestamp).getTime();

        if (currentTime > existingTime) {
            uniquePosts.set(post.id, post);
        }
    });

    return Array.from(uniquePosts.values());
}

function sortCommentsByTimestamp(comments = []) {
    return comments.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
}

function generateUniquePostId(posts) {
    let id = Date.now();

    while (posts.some(post => post.id === id)) {
        id++;
    }

    return id;
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Set flag so if user navigates to index.html, it skips the intro animation
    sessionStorage.setItem('algoInfinityVerse_appLoaded', 'true');
    initNavbar();
    initCommunityFeed();
});

// ===== NAVBAR & UI (Reused logic) =====
function initNavbar() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    let overlay = document.querySelector('.nav-overlay');
    if (!overlay && menuToggle && navLinks) {
        overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        document.body.appendChild(overlay);
    }

    const toggleMenu = (open) => {
        const isOpen = open !== undefined ? open : !navLinks.classList.contains('active');
        navLinks.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', isOpen);
        if (overlay) overlay.classList.toggle('active', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars', !isOpen);
            icon.classList.toggle('fa-times', isOpen);
        }
    };

    const closeMenu = () => {
        if (!navLinks.classList.contains('active')) return;
        toggleMenu(false);
    };

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        if (overlay) overlay.addEventListener('click', closeMenu);

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    // Dropdown functionality
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    const isMobile = () => window.matchMedia('(max-width: 1024px)').matches;

    dropdownToggles.forEach(toggle => {
        const parent = toggle.closest('.has-dropdown');
        const menu = parent?.querySelector('.dropdown-menu');
        if (!parent || !menu) return;

        let hoverTimeout;

        const showMenu = () => { clearTimeout(hoverTimeout); parent.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); };
        const hideMenu = () => { hoverTimeout = setTimeout(() => { parent.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }, 250); };

        parent.addEventListener('mouseenter', () => { if (!isMobile()) showMenu(); });
        parent.addEventListener('mouseleave', () => { if (!isMobile()) hideMenu(); });
        toggle.addEventListener('focus', () => { if (!isMobile()) showMenu(); });
        menu.addEventListener('focusin', () => { if (!isMobile()) showMenu(); });
        parent.addEventListener('focusout', () => { if (!isMobile()) hideMenu(); });

        toggle.addEventListener('click', (e) => {
            if (isMobile()) { e.preventDefault(); e.stopPropagation(); const isOpen = parent.classList.toggle('open'); toggle.setAttribute('aria-expanded', isOpen); }
        });

        menu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                if (isMobile()) { parent.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
            });
        });
    });

    window.addEventListener('resize', () => {
        if (!isMobile()) {
            document.querySelectorAll('.has-dropdown.open').forEach(el => el.classList.remove('open'));
            dropdownToggles.forEach(toggle => toggle.setAttribute('aria-expanded', 'false'));
        }
    });

    // Scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(10, 10, 26, 0.95)';
            } else {
                navbar.style.background = 'rgba(10, 10, 26, 0.95)';
            }
        }
    });
}


// ===== COMMUNITY LOGIC =====
let currentSearchQuery = '';
let currentTagFilter = '';

function initCommunityFeed() {
    renderPosts();
    renderTrendingTags();

    const form = document.getElementById('createPostForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            createNewPost();
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.toLowerCase();
            renderPosts();
        });
    }
}

function setTagFilter(tag) {
    currentTagFilter = tag.toLowerCase();
    const btn = document.getElementById('clearFilterBtn');
    if (btn) btn.style.display = 'inline-block';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    currentSearchQuery = '';
    renderPosts();
}

function clearTagFilter() {
    currentTagFilter = '';
    const btn = document.getElementById('clearFilterBtn');
    if (btn) btn.style.display = 'none';
    renderPosts();
}

function renderTrendingTags() {
    const container = document.getElementById('trendingTagsContainer');
    if (!container) return;
    
    const posts = getPosts();
    const tagCounts = {};
    
    posts.forEach(p => {
        if (p.tags) {
            p.tags.forEach(tag => {
                const t = tag.toLowerCase().trim();
                if (t) tagCounts[t] = (tagCounts[t] || 0) + 1;
            });
        }
    });
    
    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
        
    container.innerHTML = '';
    if (sortedTags.length > 0) {
        sortedTags.forEach(([tag]) => {
            const span = document.createElement('span');
            span.className = 'cm-tag';
            span.textContent = `#${tag}`;
            span.addEventListener('click', () => setTagFilter(tag));
            container.appendChild(span);
        });
    } else {
        const p = document.createElement('p');
        p.style.color = 'var(--cm-text-tertiary, #6b6762)';
        p.style.fontSize = '0.85rem';
        p.textContent = 'No tags yet';
        container.appendChild(p);
    }
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderPosts() {
    const container = document.getElementById('postsContainer');
    if (!container) return;

    let posts = getPosts();
    
    // Apply Filters
    if (currentTagFilter) {
        posts = posts.filter(p => p.tags && p.tags.some(t => t.toLowerCase().trim() === currentTagFilter));
    }
    if (currentSearchQuery) {
        posts = posts.filter(p => 
            p.title.toLowerCase().includes(currentSearchQuery) || 
            p.content.toLowerCase().includes(currentSearchQuery) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(currentSearchQuery)))
        );
    }
    
    container.innerHTML = '';

    if (posts.length === 0) {
        const p = document.createElement('p');
        p.className = 'cm-empty';
        p.textContent = 'No posts found.';
        container.appendChild(p);
        return;
    }

    // Sort by newest first
    posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'cm-post';
        
        // Post Header
        const postHeader = document.createElement('div');
        postHeader.className = 'cm-post-header';
        
        const postTitle = document.createElement('h4');
        postTitle.className = 'cm-post-title';
        postTitle.textContent = post.title;
        
        const postMeta = document.createElement('span');
        postMeta.className = 'cm-post-meta';
        postMeta.textContent = formatDate(post.timestamp);
        
        postHeader.appendChild(postTitle);
        postHeader.appendChild(postMeta);
        card.appendChild(postHeader);
        
        // Post Content
        const postContent = document.createElement('div');
        postContent.className = 'cm-post-content markdown-body';
        
        let safePostHtml = '';
        if (typeof MarkdownParser !== 'undefined') {
            const parsedHtml = MarkdownParser.parse(post.content);
            if (typeof window !== 'undefined' && window.DOMSanitizer) {
                safePostHtml = window.DOMSanitizer.sanitizeHTML(parsedHtml);
            } else if (typeof DOMPurify !== 'undefined') {
                safePostHtml = DOMPurify.sanitize(parsedHtml, {
                    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr'],
                    ALLOWED_ATTR: ['href', 'target', 'rel']
                });
            } else {
                safePostHtml = escapeHtml(post.content);
            }
        } else if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
            safePostHtml = DOMPurify.sanitize(marked.parse(post.content, { breaks: true }), {
                ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr'],
                ALLOWED_ATTR: ['href', 'target', 'rel']
            });
        } else {
            safePostHtml = escapeHtml(post.content);
        }
        postContent.innerHTML = safePostHtml;
        card.appendChild(postContent);
        
        // Post Tags
        if (post.tags && post.tags.length > 0) {
            const postTags = document.createElement('div');
            postTags.className = 'cm-post-tags';
            post.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'cm-tag';
                tagSpan.textContent = `#${tag.trim()}`;
                tagSpan.addEventListener('click', () => setTagFilter(tag));
                postTags.appendChild(tagSpan);
            });
            card.appendChild(postTags);
        }

        // Post Actions
        const postActions = document.createElement('div');
        postActions.className = 'cm-post-actions';
        
        const voteActions = document.createElement('div');
        voteActions.className = 'cm-vote-group';
        
        const upvoteBtn = document.createElement('button');
        upvoteBtn.className = `cm-vote-btn${post.userVote === 1 ? ' cm-voted-up' : ''}`;
        upvoteBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        upvoteBtn.addEventListener('click', () => handleVote(post.id, 1));
        upvoteBtn.setAttribute('aria-label', 'Upvote');
        
        const voteCount = document.createElement('span');
        voteCount.className = 'cm-vote-count';
        voteCount.textContent = post.votes !== undefined ? post.votes : 0;
        
        const downvoteBtn = document.createElement('button');
        downvoteBtn.className = `cm-vote-btn${post.userVote === -1 ? ' cm-voted-down' : ''}`;
        downvoteBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
        downvoteBtn.addEventListener('click', () => handleVote(post.id, -1));
        downvoteBtn.setAttribute('aria-label', 'Downvote');
        
        voteActions.appendChild(upvoteBtn);
        voteActions.appendChild(voteCount);
        voteActions.appendChild(downvoteBtn);
        
        const commentBtn = document.createElement('button');
        commentBtn.className = 'cm-comment-btn';
        commentBtn.innerHTML = '<i class="far fa-comment"></i> ';
        
        const commentCount = document.createElement('span');
        commentCount.textContent = post.comments ? post.comments.length : 0;
        commentBtn.appendChild(commentCount);
        commentBtn.addEventListener('click', () => toggleComments(post.id));
        
        postActions.appendChild(voteActions);
        postActions.appendChild(commentBtn);
        card.appendChild(postActions);

        // Comments Section
        const commentsSection = document.createElement('div');
        commentsSection.className = 'cm-comments-section';
        commentsSection.id = `comments-${post.id}`;
        
        const commentsList = document.createElement('div');
        commentsList.className = 'cm-comments-list';
        
        if (post.comments) {
            post.comments = sortCommentsByTimestamp(post.comments);
            post.comments.forEach(c => {
                const commentDiv = document.createElement('div');
                commentDiv.className = 'cm-comment';
                
                const commentMeta = document.createElement('div');
                commentMeta.className = 'cm-comment-meta';
                commentMeta.textContent = formatDate(c.timestamp);
                
                const commentText = document.createElement('div');
                commentText.className = 'cm-comment-text markdown-body';
                
                let safeCommentHtml = '';
                if (typeof MarkdownParser !== 'undefined') {
                    const parsedHtml = MarkdownParser.parse(c.text);
                    if (typeof window !== 'undefined' && window.DOMSanitizer) {
                        safeCommentHtml = window.DOMSanitizer.sanitizeHTML(parsedHtml);
                    } else if (typeof DOMPurify !== 'undefined') {
                        safeCommentHtml = DOMPurify.sanitize(parsedHtml, {
                            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr'],
                            ALLOWED_ATTR: ['href', 'target', 'rel']
                        });
                    } else {
                        safeCommentHtml = escapeHtml(c.text);
                    }
                } else if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
                    safeCommentHtml = DOMPurify.sanitize(marked.parse(c.text, { breaks: true }), {
                        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr'],
                        ALLOWED_ATTR: ['href', 'target', 'rel']
                    });
                } else {
                    safeCommentHtml = escapeHtml(c.text);
                }
                commentText.innerHTML = safeCommentHtml;
                
                commentDiv.appendChild(commentMeta);
                commentDiv.appendChild(commentText);
                commentsList.appendChild(commentDiv);
            });
        }
        commentsSection.appendChild(commentsList);

        // Add Comment Form
        const addCommentForm = document.createElement('form');
        addCommentForm.className = 'cm-add-comment';
        addCommentForm.addEventListener('submit', (e) => addComment(e, post.id));
        
        const commentInput = document.createElement('textarea');
        commentInput.placeholder = 'Write a comment... (Markdown supported)';
        commentInput.required = true;
        commentInput.className = 'cm-input';
        commentInput.style.fontFamily = 'inherit';
        commentInput.rows = 2;
        commentInput.style.resize = 'vertical';
        
        const commentSubmitBtn = document.createElement('button');
        commentSubmitBtn.type = 'submit';
        commentSubmitBtn.className = 'cm-btn cm-btn-primary cm-btn-sm';
        commentSubmitBtn.innerHTML = '<i class="fas fa-reply"></i>';
        
        addCommentForm.appendChild(commentInput);
        addCommentForm.appendChild(commentSubmitBtn);
        commentsSection.appendChild(addCommentForm);
        
        card.appendChild(commentsSection);
        container.appendChild(card);
    });
}

function createNewPost() {
    const titleInput = document.getElementById('postTitle');
    const contentInput = document.getElementById('postContent');
    const tagsInput = document.getElementById('postTags');

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title || !content) return;

    let tags = [];
    if (tagsInput.value.trim()) {
        tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
    }

    let posts = getPosts();
    posts = reconcilePosts(posts);
    const newPost = {
        id: generateUniquePostId(posts), // simple unique id
        title,
        content,
        tags,
        timestamp: new Date().toISOString(),
        votes: 0,
        userVote: 0,
        comments: []
    };

    posts.push(newPost);
    savePosts(posts);

    // Reset form
    titleInput.value = '';
    contentInput.value = '';
    tagsInput.value = '';

    // Re-render
    renderPosts();
    renderTrendingTags();
}

function handleVote(postId, voteValue) {
    let posts = getPosts();
    posts = reconcilePosts(posts);
    const post = posts.find(p => p.id === postId);
    if (post) {
        if (post.userVote === voteValue) {
            // Un-vote
            post.votes -= voteValue;
            post.userVote = 0;
        } else {
            // Change vote or new vote
            post.votes += (voteValue - post.userVote);
            post.userVote = voteValue;
        }
        savePosts(posts);
        renderPosts();
    }
}

function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    if (section) {
        section.classList.toggle('cm-active');
    }
}

function addComment(event, postId) {
    event.preventDefault();
    const form = event.target;
    const input = form.querySelector('textarea') || form.querySelector('input');
    const text = input.value.trim();

    if (!text) return;

    let posts = getPosts();
    posts = reconcilePosts(posts);
    const post = posts.find(p => p.id === postId);
    
    if (post) {
        if (!post.comments) post.comments = [];
        post.comments.push({
            text,
            timestamp: new Date().toISOString()
        });
        savePosts(posts);
        
        // Re-render and keep comments open
        renderPosts();
        setTimeout(() => {
            const section = document.getElementById(`comments-${postId}`);
            if (section) section.classList.add('cm-active');
        }, 50);
    }
}

// Utility to prevent XSS in user input (delegating to centralized DOMSanitizer if available)
function escapeHtml(unsafe) {
    if (typeof window !== 'undefined' && window.DOMSanitizer) {
        return window.DOMSanitizer.escapeHtml(unsafe);
    }
    return String(unsafe || '')
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
// ===== COMMUNITY STATS =====
function updateCommunityStats() {
    const posts = getPosts();
    const totalPosts = posts.length;
    const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);
    const totalVotes = posts.reduce((sum, p) => sum + (p.votes || 0), 0);

    const totalPostsEl = document.getElementById('totalPostsCount');
    const totalCommentsEl = document.getElementById('totalCommentsCount');
    const totalVotesEl = document.getElementById('totalVotesCount');

    if (totalPostsEl) totalPostsEl.textContent = totalPosts;
    if (totalCommentsEl) totalCommentsEl.textContent = totalComments;
    if (totalVotesEl) totalVotesEl.textContent = totalVotes;
}

// ===== TOP CONTRIBUTORS =====
function updateTopContributors() {
    const posts = getPosts();
    const container = document.getElementById('contributorsList');
    if (!container) return;

    // Calculate contributor scores
    const contributors = {};
    posts.forEach(post => {
        const author = post.author || 'Anonymous';
        if (!contributors[author]) {
            contributors[author] = { posts: 0, votes: 0 };
        }
        contributors[author].posts++;
        contributors[author].votes += post.votes || 0;
    });

    // Sort by votes
    const sorted = Object.entries(contributors)
        .sort((a, b) => b[1].votes - a[1].votes)
        .slice(0, 5);

    const medals = ['1', '2', '3', '4', '5'];
    const avatarColors = ['#c4b09a', '#9cb4a0', '#d4a0a0', '#a9b8d4', '#c4b5a0'];

    if (sorted.length === 0) {
        container.innerHTML = `<p style="color:var(--cm-text-secondary, #96928c); font-size:0.85rem;">No contributors yet. Be the first!</p>`;
        return;
    }

    container.innerHTML = sorted.map(([name, data], i) => {
        const initial = name.charAt(0).toUpperCase();
        return `
        <div class="cm-contributor">
            <span class="cm-contributor-rank">${medals[i] || i + 1}</span>
            <div class="cm-contributor-avatar" style="background: ${avatarColors[i] || '#c4b09a'}">${initial}</div>
            <div class="cm-contributor-info">
                <div class="cm-contributor-name">${escapeHtml(name)}</div>
                <div class="cm-contributor-posts">${data.posts} ${data.posts === 1 ? 'post' : 'posts'}</div>
            </div>
            <span class="cm-contributor-votes">+${data.votes}</span>
        </div>
    `}).join('');
}

// ===== TOPIC FILTERS =====
function initTopicFilters() {
    const filterBtns = document.querySelectorAll('.cm-topic-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const topic = btn.dataset.topic;
            filterPostsByTopic(topic);
        });
    });
}

function filterPostsByTopic(topic) {
    if (topic === 'all') {
        currentTagFilter = '';
    } else {
        currentTagFilter = topic.toLowerCase();
    }
    const btn = document.getElementById('clearFilterBtn');
    if (btn) btn.style.display = currentTagFilter ? 'inline-block' : 'none';
    renderPosts();
}

// Initialize new features
document.addEventListener('DOMContentLoaded', () => {
    updateCommunityStats();
    updateTopContributors();
    initTopicFilters();
});