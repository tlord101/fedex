/**
 * UI Service
 * Handles UI notifications, loading states, and modal management
 */

class UIService {
    constructor() {
        this.toastContainer = null;
        this.modalContainer = null;
        this.loadingOverlay = null;
        this.init();
    }

    /**
     * Initialize UI service
     */
    init() {
        this.createToastContainer();
        this.createModalContainer();
        this.createLoadingOverlay();
    }

    /**
     * Create toast notification container
     */
    createToastContainer() {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toast-container';
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;

        this.toastContainer.appendChild(toast);
        toast.offsetHeight; // Force reflow
        toast.classList.add('show');

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));

        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }
    }

    /**
     * Remove toast
     */
    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Create modal container
     */
    createModalContainer() {
        if (!this.modalContainer) {
            this.modalContainer = document.createElement('div');
            this.modalContainer.id = 'modal-container';
            document.body.appendChild(this.modalContainer);
        }
    }

    /**
     * Show modal
     */
    showModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${typeof content === 'string' ? content : ''}
                </div>
                <div class="modal-footer">
                    ${buttons.map(btn => 
                        `<button class="btn btn-${btn.type || 'primary'}" data-action="${btn.action}">${btn.label}</button>`
                    ).join('')}
                </div>
            </div>
        `;

        this.modalContainer.appendChild(modal);
        modal.offsetHeight; // Force reflow
        modal.classList.add('show');

        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.closeModal(modal));

        // Add button event listeners
        modal.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const button = buttons.find(b => b.action === action);
                if (button && button.onClick) {
                    button.onClick();
                }
                this.closeModal(modal);
            });
        });

        return modal;
    }

    /**
     * Close modal
     */
    closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    /**
     * Create loading overlay
     */
    createLoadingOverlay() {
        if (!this.loadingOverlay) {
            this.loadingOverlay = document.createElement('div');
            this.loadingOverlay.id = 'loading-overlay';
            this.loadingOverlay.className = 'loading-overlay';
            this.loadingOverlay.innerHTML = `
                <div class="spinner">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <p>Loading...</p>
            `;
            document.body.appendChild(this.loadingOverlay);
        }
    }

    /**
     * Show loading
     */
    showLoading(message = 'Loading...') {
        this.loadingOverlay.querySelector('p').textContent = message;
        this.loadingOverlay.classList.add('show');
    }

    /**
     * Hide loading
     */
    hideLoading() {
        this.loadingOverlay.classList.remove('show');
    }

    /**
     * Format currency
     */
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    /**
     * Format date
     */
    formatDate(date, format = 'short') {
        const d = new Date(date);
        if (format === 'short') {
            return d.toLocaleDateString();
        } else if (format === 'long') {
            return d.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } else if (format === 'time') {
            return d.toLocaleTimeString();
        }
    }
}

// Create singleton instance
const uiService = new UIService();
window.uiService = uiService;
