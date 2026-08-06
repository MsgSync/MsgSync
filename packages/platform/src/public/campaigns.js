// Campaign Management JavaScript
const API_KEY = 'demo-api-key';
const API_BASE = '/api/bulk';

let campaigns = [];
let contactLists = [];
let currentCampaign = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadContactLists();
    loadCampaigns();
    setupEventListeners();
});

function setupEventListeners() {
    // Template preview
    const templateInput = document.getElementById('message-template');
    if (templateInput) {
        templateInput.addEventListener('input', updateTemplatePreview);
    }

    // Contact list selection
    const contactListSelect = document.getElementById('contact-list');
    if (contactListSelect) {
        contactListSelect.addEventListener('change', updateListCount);
    }

    // Close modals on background click
    document.querySelectorAll('.modal').forEach((modal) => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
}

// Data Loading
async function loadCampaigns() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/campaigns`, {
            headers: { 'X-API-Key': API_KEY }
        });

        if (response.ok) {
            const data = await response.json();
            campaigns = data.data || [];
            renderCampaigns();
            updateStats();
        } else {
            showError('Failed to load campaigns');
        }
    } catch (error) {
        console.error('Error loading campaigns:', error);
        showError('Failed to load campaigns');
    } finally {
        showLoading(false);
    }
}

async function loadContactLists() {
    try {
        const response = await fetch(`${API_BASE}/lists`, {
            headers: { 'X-API-Key': API_KEY }
        });

        if (response.ok) {
            const data = await response.json();
            contactLists = data.data || [];
            populateContactListDropdown();
        }
    } catch (error) {
        console.error('Error loading contact lists:', error);
    }
}

// Rendering
function renderCampaigns() {
    const grid = document.getElementById('campaigns-grid');
    const emptyState = document.getElementById('empty-state');

    if (campaigns.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = campaigns
        .map((campaign) => createCampaignCard(campaign))
        .join('');
    lucide.createIcons();
}

function createCampaignCard(campaign) {
    const statusClass = `status-${campaign.status}`;
    const scheduledDate = campaign.scheduledAt
        ? new Date(campaign.scheduledAt).toLocaleString()
        : 'Not scheduled';
    const messageCount = campaign.messages?.length || 0;
    const sentCount =
    campaign.messages?.filter(
        (m) => m.status === 'sent' || m.status === 'delivered'
    ).length || 0;
    const failedCount =
    campaign.messages?.filter((m) => m.status === 'failed').length || 0;

    return `
        <div class="campaign-card" onclick="viewCampaignDetails('${campaign.id}')">
            <div class="campaign-header">
                <div>
                    <div class="campaign-title">${escapeHtml(campaign.name)}</div>
                    <div class="meta-item">
                        <i data-lucide="calendar"></i>
                        <span>${new Date(campaign.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <span class="campaign-status ${statusClass}">${campaign.status}</span>
            </div>
            
            <div class="campaign-meta">
                ${
    campaign.senderId
        ? `
                    <div class="meta-item">
                        <i data-lucide="phone"></i>
                        <span>Sender: ${escapeHtml(campaign.senderId)}</span>
                    </div>
                `
        : ''
}
                ${
    campaign.scheduledAt
        ? `
                    <div class="meta-item">
                        <i data-lucide="clock"></i>
                        <span>${scheduledDate}</span>
                    </div>
                `
        : ''
}
                <div class="meta-item">
                    <i data-lucide="users"></i>
                    <span>${campaign.contactList?.contacts?.length || 0} recipients</span>
                </div>
            </div>
            
            <div class="campaign-template">
                ${escapeHtml(campaign.template)}
            </div>
            
            <div class="campaign-stats">
                <div class="stat-item">
                    <span class="stat-value">${messageCount}</span>
                    <span class="stat-label">Total</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" style="color: var(--success)">${sentCount}</span>
                    <span class="stat-label">Sent</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" style="color: var(--error)">${failedCount}</span>
                    <span class="stat-label">Failed</span>
                </div>
            </div>
            
            <div class="campaign-actions" onclick="event.stopPropagation()">
                ${
    campaign.status === 'draft'
        ? `
                    <button class="icon-btn" onclick="editCampaign('${campaign.id}')" title="Edit">
                        <i data-lucide="edit"></i>
                    </button>
                    <button class="icon-btn" onclick="launchCampaign('${campaign.id}')" title="Launch">
                        <i data-lucide="play"></i>
                    </button>
                `
        : ''
}
                ${
    campaign.status === 'scheduled'
        ? `
                    <button class="icon-btn" onclick="pauseCampaign('${campaign.id}')" title="Pause">
                        <i data-lucide="pause"></i>
                    </button>
                `
        : ''
}
                ${
    campaign.status === 'paused'
        ? `
                    <button class="icon-btn" onclick="resumeCampaign('${campaign.id}')" title="Resume">
                        <i data-lucide="play"></i>
                    </button>
                `
        : ''
}
                <button class="icon-btn" onclick="duplicateCampaign('${campaign.id}')" title="Duplicate">
                    <i data-lucide="copy"></i>
                </button>
                <button class="icon-btn" onclick="deleteCampaign('${campaign.id}')" title="Delete">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </div>
    `;
}

function updateStats() {
    const total = campaigns.length;
    const active = campaigns.filter((c) => c.status === 'running').length;
    const scheduled = campaigns.filter((c) => c.status === 'scheduled').length;
    const totalReach = campaigns.reduce(
        (sum, c) => sum + (c.contactList?.contacts?.length || 0),
        0
    );

    document.getElementById('total-campaigns').textContent = total;
    document.getElementById('active-campaigns').textContent = active;
    document.getElementById('scheduled-campaigns').textContent = scheduled;
    document.getElementById('total-reach').textContent =
    totalReach.toLocaleString();
}

function populateContactListDropdown() {
    const select = document.getElementById('contact-list');
    if (!select) return;

    select.innerHTML =
    '<option value="">Select a contact list</option>' +
    contactLists
        .map(
            (list) =>
                `<option value="${list.id}">${escapeHtml(list.name)} (${list.contacts?.length || 0} contacts)</option>`
        )
        .join('');
}

// Modal Management
function openCampaignModal() {
    currentCampaign = null;
    document.getElementById('modal-title').textContent = 'Create New Campaign';
    document.getElementById('campaign-form').reset();
    document.getElementById('campaign-modal').classList.add('active');
    updateTemplatePreview();
}

function closeCampaignModal() {
    document.getElementById('campaign-modal').classList.remove('active');
}

function openContactListModal() {
    document.getElementById('contact-list-modal').classList.add('active');
}

function closeContactListModal() {
    document.getElementById('contact-list-modal').classList.remove('active');
}

function openCampaignDetailsModal() {
    document.getElementById('campaign-details-modal').classList.add('active');
}

function closeCampaignDetailsModal() {
    document.getElementById('campaign-details-modal').classList.remove('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach((modal) => {
        modal.classList.remove('active');
    });
}

// Campaign Actions
async function createCampaign() {
    const form = document.getElementById('campaign-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const scheduleType = document.querySelector(
        'input[name="schedule-type"]:checked'
    ).value;
    const scheduledAt =
    scheduleType === 'scheduled'
        ? document.getElementById('scheduled-time').value
        : null;

    const campaignData = {
        name: document.getElementById('campaign-name').value,
        template: document.getElementById('message-template').value,
        contactListId: document.getElementById('contact-list').value,
        senderId: document.getElementById('sender-id').value || null,
        scheduledAt: scheduledAt,
        enableTracking: document.getElementById('enable-tracking').checked,
        enableWebhooks: document.getElementById('enable-webhooks').checked
    };

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/campaigns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(campaignData)
        });

        if (response.ok) {
            const result = await response.json();
            showSuccess('Campaign created successfully!');
            closeCampaignModal();

            // Auto-launch if immediate
            if (scheduleType === 'immediate') {
                await launchCampaign(result.data.id);
            } else {
                await loadCampaigns();
            }
        } else {
            const error = await response.json();
            showError(error.message || 'Failed to create campaign');
        }
    } catch (error) {
        console.error('Error creating campaign:', error);
        showError('Failed to create campaign');
    } finally {
        showLoading(false);
    }
}

async function saveDraft() {
    // Similar to createCampaign but with status 'draft'
    const campaignData = {
        name: document.getElementById('campaign-name').value,
        template: document.getElementById('message-template').value,
        contactListId: document.getElementById('contact-list').value,
        senderId: document.getElementById('sender-id').value || null,
        status: 'draft'
    };

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/campaigns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(campaignData)
        });

        if (response.ok) {
            showSuccess('Draft saved successfully!');
            closeCampaignModal();
            await loadCampaigns();
        } else {
            showError('Failed to save draft');
        }
    } catch (error) {
        console.error('Error saving draft:', error);
        showError('Failed to save draft');
    } finally {
        showLoading(false);
    }
}

async function launchCampaign(campaignId) {
    if (
        !confirm(
            'Are you sure you want to launch this campaign? Messages will be sent to all recipients.'
        )
    ) {
        return;
    }

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/campaigns/${campaignId}/start`, {
            method: 'POST',
            headers: { 'X-API-Key': API_KEY }
        });

        if (response.ok) {
            showSuccess('Campaign launched successfully!');
            await loadCampaigns();
        } else {
            showError('Failed to launch campaign');
        }
    } catch (error) {
        console.error('Error launching campaign:', error);
        showError('Failed to launch campaign');
    } finally {
        showLoading(false);
    }
}

async function pauseCampaign(campaignId) {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/campaigns/${campaignId}/pause`, {
            method: 'POST',
            headers: { 'X-API-Key': API_KEY }
        });

        if (response.ok) {
            showSuccess('Campaign paused');
            await loadCampaigns();
        } else {
            showError('Failed to pause campaign');
        }
    } catch (error) {
        console.error('Error pausing campaign:', error);
        showError('Failed to pause campaign');
    } finally {
        showLoading(false);
    }
}

async function resumeCampaign(campaignId) {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/campaigns/${campaignId}/resume`, {
            method: 'POST',
            headers: { 'X-API-Key': API_KEY }
        });

        if (response.ok) {
            showSuccess('Campaign resumed');
            await loadCampaigns();
        } else {
            showError('Failed to resume campaign');
        }
    } catch (error) {
        console.error('Error resuming campaign:', error);
        showError('Failed to resume campaign');
    } finally {
        showLoading(false);
    }
}

async function deleteCampaign(campaignId) {
    if (
        !confirm(
            'Are you sure you want to delete this campaign? This action cannot be undone.'
        )
    ) {
        return;
    }

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/campaigns/${campaignId}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': API_KEY }
        });

        if (response.ok) {
            showSuccess('Campaign deleted');
            await loadCampaigns();
        } else {
            showError('Failed to delete campaign');
        }
    } catch (error) {
        console.error('Error deleting campaign:', error);
        showError('Failed to delete campaign');
    } finally {
        showLoading(false);
    }
}

async function duplicateCampaign(campaignId) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    const newCampaign = {
        name: `${campaign.name} (Copy)`,
        template: campaign.template,
        contactListId: campaign.contactListId,
        senderId: campaign.senderId,
        status: 'draft'
    };

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/campaigns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(newCampaign)
        });

        if (response.ok) {
            showSuccess('Campaign duplicated');
            await loadCampaigns();
        } else {
            showError('Failed to duplicate campaign');
        }
    } catch (error) {
        console.error('Error duplicating campaign:', error);
        showError('Failed to duplicate campaign');
    } finally {
        showLoading(false);
    }
}

function editCampaign(campaignId) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    currentCampaign = campaign;
    document.getElementById('modal-title').textContent = 'Edit Campaign';
    document.getElementById('campaign-name').value = campaign.name;
    document.getElementById('message-template').value = campaign.template;
    document.getElementById('contact-list').value = campaign.contactListId;
    document.getElementById('sender-id').value = campaign.senderId || '';

    if (campaign.scheduledAt) {
        document.querySelector(
            'input[name="schedule-type"][value="scheduled"]'
        ).checked = true;
        document.getElementById('scheduled-time').value = new Date(
            campaign.scheduledAt
        )
            .toISOString()
            .slice(0, 16);
        toggleSchedule();
    }

    document.getElementById('campaign-modal').classList.add('active');
    updateTemplatePreview();
}

async function viewCampaignDetails(campaignId) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    document.getElementById('details-campaign-name').textContent = campaign.name;

    const detailsContent = document.getElementById('campaign-details-content');
    detailsContent.innerHTML = `
        <div class="form-section">
            <h3>Campaign Information</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                <div>
                    <strong>Status:</strong>
                    <span class="campaign-status status-${campaign.status}">${campaign.status}</span>
                </div>
                <div>
                    <strong>Created:</strong> ${new Date(campaign.createdAt).toLocaleString()}
                </div>
                ${
    campaign.senderId
        ? `
                    <div>
                        <strong>Sender ID:</strong> ${escapeHtml(campaign.senderId)}
                    </div>
                `
        : ''
}
                ${
    campaign.scheduledAt
        ? `
                    <div>
                        <strong>Scheduled:</strong> ${new Date(campaign.scheduledAt).toLocaleString()}
                    </div>
                `
        : ''
}
            </div>
        </div>
        
        <div class="form-section">
            <h3>Message Template</h3>
            <div class="campaign-template" style="max-height: none;">
                ${escapeHtml(campaign.template)}
            </div>
        </div>
        
        <div class="form-section">
            <h3>Recipients</h3>
            <p>Contact List: <strong>${campaign.contactList?.name || 'Unknown'}</strong></p>
            <p>Total Recipients: <strong>${campaign.contactList?.contacts?.length || 0}</strong></p>
        </div>
        
        <div class="form-section">
            <h3>Performance</h3>
            <div class="campaign-stats" style="grid-template-columns: repeat(4, 1fr);">
                <div class="stat-item">
                    <span class="stat-value">${campaign.messages?.length || 0}</span>
                    <span class="stat-label">Total Messages</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" style="color: var(--success)">
                        ${campaign.messages?.filter((m) => m.status === 'sent' || m.status === 'delivered').length || 0}
                    </span>
                    <span class="stat-label">Delivered</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" style="color: var(--warning)">
                        ${campaign.messages?.filter((m) => m.status === 'queued' || m.status === 'sending').length || 0}
                    </span>
                    <span class="stat-label">Pending</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" style="color: var(--error)">
                        ${campaign.messages?.filter((m) => m.status === 'failed').length || 0}
                    </span>
                    <span class="stat-label">Failed</span>
                </div>
            </div>
        </div>
    `;

    openCampaignDetailsModal();
    lucide.createIcons();
}

// Contact List Management
async function createContactList() {
    const form = document.getElementById('contact-list-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const listName = document.getElementById('list-name').value;
    const contactsDataRaw = document.getElementById('contacts-data').value;

    let contacts;
    try {
    // Try parsing as JSON first
        contacts = JSON.parse(contactsDataRaw);
    } catch {
    // Try parsing as CSV
        contacts = parseCSV(contactsDataRaw);
    }

    if (!Array.isArray(contacts) || contacts.length === 0) {
        showError('Invalid contact data format');
        return;
    }

    showLoading(true);
    try {
    // Create list
        const listResponse = await fetch(`${API_BASE}/lists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify({ name: listName })
        });

        if (!listResponse.ok) {
            throw new Error('Failed to create list');
        }

        const listResult = await listResponse.json();
        const listId = listResult.data.id;

        // Add contacts
        const contactsResponse = await fetch(
            `${API_BASE}/lists/${listId}/contacts`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY
                },
                body: JSON.stringify({ contacts })
            }
        );

        if (contactsResponse.ok) {
            showSuccess(`Contact list created with ${contacts.length} contacts`);
            closeContactListModal();
            await loadContactLists();
        } else {
            showError('Failed to add contacts to list');
        }
    } catch (error) {
        console.error('Error creating contact list:', error);
        showError('Failed to create contact list');
    } finally {
        showLoading(false);
    }
}

// Utility Functions
function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const contacts = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const contact = {};

        headers.forEach((header, index) => {
            if (values[index]) {
                contact[header] = values[index];
            }
        });

        if (contact.phone) {
            contacts.push(contact);
        }
    }

    return contacts;
}

function toggleSchedule() {
    const scheduleType = document.querySelector(
        'input[name="schedule-type"]:checked'
    ).value;
    const datetimeInput = document.getElementById('schedule-datetime');

    if (scheduleType === 'scheduled') {
        datetimeInput.style.display = 'block';
        document.getElementById('scheduled-time').required = true;
    } else {
        datetimeInput.style.display = 'none';
        document.getElementById('scheduled-time').required = false;
    }
}

function updateTemplatePreview() {
    const template = document.getElementById('message-template').value;
    const preview = document.getElementById('template-preview-text');

    // Replace variables with sample data
    let previewText = template
        .replace(/\{\{firstName\}\}/g, 'John')
        .replace(/\{\{lastName\}\}/g, 'Doe')
        .replace(/\{\{phone\}\}/g, '+1234567890')
        .replace(/\{\{code\}\}/g, 'SAVE20')
        .replace(/\{\{discount\}\}/g, '20')
        .replace(/\{\{expiryDate\}\}/g, 'Dec 31');

    preview.textContent =
    previewText || 'Enter a message template to see preview...';
}

function updateListCount() {
    const listId = document.getElementById('contact-list').value;
    const list = contactLists.find((l) => l.id === listId);
    const count = list?.contacts?.length || 0;

    document.getElementById('list-count').textContent =
    `${count} contacts selected`;
}

function filterCampaigns() {
    const statusFilter = document.getElementById('status-filter').value;
    const searchQuery = document
        .getElementById('search-input')
        .value.toLowerCase();

    let filtered = campaigns;

    if (statusFilter !== 'all') {
        filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (searchQuery) {
        filtered = filtered.filter(
            (c) =>
                c.name.toLowerCase().includes(searchQuery) ||
        c.template.toLowerCase().includes(searchQuery)
        );
    }

    const grid = document.getElementById('campaigns-grid');
    grid.innerHTML = filtered
        .map((campaign) => createCampaignCard(campaign))
        .join('');
    lucide.createIcons();
}

function refreshData() {
    loadCampaigns();
    loadContactLists();
}

function showLoading(show) {
    const bar = document.getElementById('loading-bar');
    bar.style.width = show ? '70%' : '0';
}

function showSuccess(message) {
    // Simple alert for now - can be replaced with toast notification
    alert(message);
}

function showError(message) {
    // Simple alert for now - can be replaced with toast notification
    alert('Error: ' + message);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
