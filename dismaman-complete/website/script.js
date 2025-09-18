// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Navbar background change on scroll
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
        
        lastScrollTop = scrollTop;
    });
    
    // App Store link handler
    const appStoreLink = document.getElementById('app-store-link');
    if (appStoreLink) {
        appStoreLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Replace with actual App Store URL when available
            const appStoreUrl = 'https://apps.apple.com/app/dis-maman/id-to-be-added';
            window.open(appStoreUrl, '_blank');
        });
    }
    
    // Pricing CTA buttons
    document.querySelectorAll('.pricing-cta').forEach(button => {
        button.addEventListener('click', function() {
            // Redirect to download section or App Store
            document.getElementById('download').scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // Feature cards animation
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Animate feature cards and screenshots on scroll
    document.querySelectorAll('.feature-card, .screenshot-item, .testimonial-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Contact form handling (if added later)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Handle form submission
            alert('Merci pour votre message ! Nous vous répondrons bientôt.');
        });
    }
    
    // FAQ toggle (if added later)
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const isOpen = answer.style.maxHeight;
            
            // Close all answers
            document.querySelectorAll('.faq-answer').forEach(ans => {
                ans.style.maxHeight = null;
                ans.previousElementSibling.classList.remove('active');
            });
            
            // Open clicked answer if it wasn't open
            if (!isOpen) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
                this.classList.add('active');
            }
        });
    });
    
    // Newsletter signup (if added later)
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            // Handle newsletter signup
            alert('Merci ! Vous recevrez nos actualités sur ' + email);
            this.reset();
        });
    }
    
    // Screenshot carousel/modal (if added later)
    document.querySelectorAll('.screenshot-item img').forEach(img => {
        img.addEventListener('click', function() {
            // Create modal for full-size screenshot view
            const modal = document.createElement('div');
            modal.className = 'screenshot-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="modal-close">&times;</span>
                    <img src="${this.src}" alt="${this.alt}">
                </div>
            `;
            document.body.appendChild(modal);
            
            // Close modal
            const closeBtn = modal.querySelector('.modal-close');
            [closeBtn, modal].forEach(el => {
                el.addEventListener('click', function(e) {
                    if (e.target === modal || e.target === closeBtn) {
                        document.body.removeChild(modal);
                    }
                });
            });
        });
    });
    
    // Add loading states for external links
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        link.addEventListener('click', function() {
            // Add loading state if needed
            this.style.opacity = '0.7';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 1000);
        });
    });
    
    // Performance optimization: Lazy load images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Simple analytics (replace with actual analytics)
    function trackEvent(action, label) {
        console.log('Event:', action, label);
        // Replace with actual analytics code (Google Analytics, etc.)
    }
    
    // Track important interactions
    document.querySelectorAll('.btn-primary, .cta-nav, .pricing-cta, .app-store-btn').forEach(button => {
        button.addEventListener('click', function() {
            trackEvent('click', this.textContent || 'Download button');
        });
    });
    
    // Page visibility handling
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Pause animations or videos if needed
        } else {
            // Resume animations or videos
        }
    });
});

// Utility functions
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

// Optimized scroll handler
const handleScroll = debounce(function() {
    const scrollTop = window.pageYOffset;
    
    // Add parallax effects or other scroll-based animations here
    document.querySelectorAll('.parallax').forEach(el => {
        const speed = el.dataset.speed || 0.5;
        el.style.transform = `translateY(${scrollTop * speed}px)`;
    });
}, 10);

window.addEventListener('scroll', handleScroll);

// Error handling for images
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
        this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Image non disponible</text></svg>';
    });
});