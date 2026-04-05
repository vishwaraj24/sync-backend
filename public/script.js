document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Global UI Behaviors ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (navbar && window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else if (navbar) {
            navbar.classList.remove('scrolled');
        }
    });

    const revealElements = document.querySelectorAll('.reveal');
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    };
    const revealObserver = new IntersectionObserver(revealCallback, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    revealElements.forEach(el => revealObserver.observe(el));


    // --- 2. Dynamic Reviews Logic (MongoDB via Fetch) ---
    const reviewForm = document.getElementById('review-form');
    const reviewsContainer = document.getElementById('reviews-container');

    const loadReviews = async () => {
        if (!reviewsContainer) return;
        try {
            const res = await fetch('/reviews');
            const reviews = await res.json();
            
            reviewsContainer.innerHTML = '';
            if (reviews.length === 0) {
                reviewsContainer.innerHTML = '<p style="color: var(--text-muted); padding-left: 1rem;">Be the first to leave a review!</p>';
                return;
            }

            reviews.forEach(review => {
                const div = document.createElement('div');
                div.className = 'clean-card review-card reveal active';
                div.innerHTML = `
                    <div class="review-header">
                        <i class="fa-solid fa-circle-user"></i> ${escapeHTML(review.name)}
                    </div>
                    <div class="review-text">"${escapeHTML(review.message)}"</div>
                `;
                reviewsContainer.appendChild(div);
            });
        } catch (err) {
            console.error("Failed to load reviews", err);
        }
    };

    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = reviewForm.querySelector('button[type="submit"]');
            btn.innerHTML = 'Submitting...';
            btn.disabled = true;

            const name = document.getElementById('reviewer-name').value;
            const message = document.getElementById('reviewer-msg').value;

            try {
                await fetch('/add-review', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, message })
                });

                reviewForm.reset();
                btn.innerHTML = 'Submit Review <i class="fa-solid fa-paper-plane" style="margin-left: 8px;"></i>';
                btn.disabled = false;
                loadReviews();
            } catch(err) {
                console.error(err);
                btn.innerHTML = 'Submit Review <i class="fa-solid fa-paper-plane" style="margin-left: 8px;"></i>';
                btn.disabled = false;
            }
        });
        loadReviews();
    }


    // --- 3. Dynamic Portfolio Logic (MongoDB via Fetch) ---
    const portfolioContainer = document.getElementById('dynamic-portfolio-grid');
    const loadProjects = async () => {
        if (!portfolioContainer) return;
        try {
            const res = await fetch('/projects');
            const projects = await res.json();
            
            portfolioContainer.innerHTML = '';

            if (projects.length === 0) {
                portfolioContainer.innerHTML = '<p class="text-center" style="grid-column: 1/-1; color: var(--text-muted);">No projects uploaded yet. Check back later!</p>';
                return;
            }

            projects.forEach((proj) => {
                const card = document.createElement('div');
                card.className = 'portfolio-card reveal active';
                const defaultImg = proj.thumbnail || 'https://via.placeholder.com/800x600?text=No+Image';
                
                card.innerHTML = `
                    <div class="portfolio-img-wrapper">
                        <img src="${defaultImg}" alt="${escapeHTML(proj.title)}">
                    </div>
                    <div class="portfolio-info">
                        <h3>${escapeHTML(proj.title)}</h3>
                    </div>
                `;

                // On click, open Modal Gallery
                card.addEventListener('click', () => {
                    openPortfolioModal(proj);
                });
                portfolioContainer.appendChild(card);
            });
        } catch (err) {
            console.error("Failed to load projects", err);
        }
    };

    if (portfolioContainer) {
        loadProjects();
    }


    // --- 4. Modal Gallery Logic ---
    const modal = document.getElementById('portfolio-modal');
    let currentModalImageIndex = 0;
    let currentModalImages = [];

    const openPortfolioModal = (proj) => {
        if (!modal) return;
        currentModalImages = [];
        if (proj.thumbnail) currentModalImages.push(proj.thumbnail);
        if (proj.galleryImages && proj.galleryImages.length > 0) {
            currentModalImages = currentModalImages.concat(proj.galleryImages);
        }
        
        if (currentModalImages.length === 0) return;

        currentModalImageIndex = 0;
        document.getElementById('modal-title-text').textContent = proj.title;
        renderModalImage();
        modal.classList.add('active');
    };

    const renderModalImage = () => {
        const sliderContainer = document.getElementById('modal-slider');
        if (!sliderContainer) return;

        const imgs = sliderContainer.querySelectorAll('.slider-img');
        imgs.forEach(img => img.remove());

        const img = document.createElement('img');
        img.src = currentModalImages[currentModalImageIndex];
        img.className = 'slider-img active';
        sliderContainer.appendChild(img);
    };

    if (modal) {
        document.getElementById('modal-close').addEventListener('click', () => modal.classList.remove('active'));
        document.getElementById('slider-prev').addEventListener('click', () => {
            if (currentModalImages.length <= 1) return;
            currentModalImageIndex = (currentModalImageIndex - 1 + currentModalImages.length) % currentModalImages.length;
            renderModalImage();
        });
        document.getElementById('slider-next').addEventListener('click', () => {
            if (currentModalImages.length <= 1) return;
            currentModalImageIndex = (currentModalImageIndex + 1) % currentModalImages.length;
            renderModalImage();
        });
        modal.addEventListener('click', (e) => {
            if(e.target === modal) modal.classList.remove('active');
        });
    }

    // --- 5. Admin Upload Logic (Multer Form Data) ---
    const uploadForm = document.getElementById('admin-upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = uploadForm.querySelector('button[type="submit"]');
            btn.innerHTML = 'Uploading...';
            btn.disabled = true;

            try {
                const title = document.getElementById('proj-title').value;
                const password = document.getElementById('admin-pass').value;
                const frontInput = document.getElementById('proj-front');
                const extraInput = document.getElementById('proj-extra');

                const formData = new FormData();
                formData.append('title', title);
                formData.append('password', password);
                
                if (frontInput.files[0]) {
                    formData.append('thumbnail', frontInput.files[0]);
                }
                
                if (extraInput.files) {
                    for(let i=0; i < extraInput.files.length; i++) {
                        formData.append('gallery', extraInput.files[i]);
                    }
                }

                const res = await fetch('/add-project', {
                    method: 'POST',
                    body: formData // Note: no headers set for FormData, browser handles it!
                });

                if (res.ok) {
                    alert('Project Uploaded Successfully to Database!');
                    uploadForm.reset();
                } else {
                    const data = await res.json();
                    alert("Error: " + (data.error || "Failed to upload project"));
                }

            } catch (err) {
                alert("Upload failed. Make sure server is running.");
                console.error(err);
            } finally {
                btn.innerHTML = 'Upload Project <i class="fa-solid fa-cloud-arrow-up" style="margin-left: 8px;"></i>';
                btn.disabled = false;
            }
        });
    }

    // Escape Helper to prevent XSS
    function escapeHTML(str) {
        if (!str) return "";
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
