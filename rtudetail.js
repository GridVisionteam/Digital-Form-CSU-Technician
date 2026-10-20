// JavaScript specific to rtudetail.html
document.getElementById("logo").addEventListener("click", () => {
    // Clear all session data for a fresh start
    localStorage.clear();
    window.location.href = 'index.html';
});

function saveCurrentRTUDetails() {
    const rtuSerialInput = document.getElementById('rtuSerial');
    const contractNoInput = document.getElementById('contractNo');
    const projectNameInput = document.getElementById('projectName');
    const bcSerialInput = document.getElementById('BCSerial');
    const batchNoInput = document.getElementById('batchNo');

    if (rtuSerialInput) localStorage.setItem('session_rtuSerial', rtuSerialInput.value.trim());
    if (contractNoInput) localStorage.setItem('session_contractNo', contractNoInput.value.trim());
    if (projectNameInput) localStorage.setItem('session_projectName', projectNameInput.value.trim());
    if (bcSerialInput) localStorage.setItem('session_bcSerial', bcSerialInput.value.trim());
    if (batchNoInput) localStorage.setItem('session_Batch_No', batchNoInput.value.trim());
}

// --- Utility Functions ---
function showCustomAlert(message) {
    const existingAlert = document.getElementById('customAlertBox');
    if (existingAlert) existingAlert.remove();
    const messageBox = document.createElement('div');
    messageBox.id = 'customAlertBox';
    messageBox.textContent = message;
    messageBox.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index:1001; text-align: center;";
    document.body.appendChild(messageBox);
    setTimeout(() => messageBox.remove(), 3000);
}

// --- Battery Charger Serial Number Validation ---
function isValidBCSerial(serial) {
    // Pattern: exactly 5 digits, hyphen, exactly 4 digits
    const pattern = /^\d{5}-\d{4}$/;
    return pattern.test(serial);
}

document.addEventListener('DOMContentLoaded', () => {
    // Helper function to remove extra quotes from stored values
    const getStoredValue = (key) => {
        let value = localStorage.getItem(key) || '';
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        return value;
    };

    // Load RTU data from localStorage and remove extra quotes if present
    const rtuSerialInput = document.getElementById('rtuSerial');
    const contractNoInput = document.getElementById('contractNo');
    const projectNameInput = document.getElementById('projectName');
    const bcSerialInput = document.getElementById('BCSerial');
    const batchNoInput = document.getElementById('batchNo');

    if (rtuSerialInput) rtuSerialInput.value = getStoredValue('session_rtuSerial');
    if (contractNoInput) contractNoInput.value = getStoredValue('session_contractNo');
    if (projectNameInput) projectNameInput.value = getStoredValue('session_projectName');
    if (bcSerialInput) bcSerialInput.value = getStoredValue('session_bcSerial');
    if (batchNoInput) batchNoInput.value = getStoredValue('session_Batch_No');

    // --- Real-time input masking/formatting for BC Serial ---
    if (bcSerialInput) {
        bcSerialInput.addEventListener('input', function(e) {
            // Remove any non-digit characters except hyphen
            let value = this.value.replace(/[^\d-]/g, '');
            
            // Auto-insert hyphen after 5 digits
            if (value.length === 5 && !value.includes('-')) {
                value = value + '-';
            }
            
            // Limit to 10 characters (5 digits + hyphen + 4 digits)
            if (value.length > 10) {
                value = value.slice(0, 10);
            }
            
            this.value = value;
        });
        
        // Also validate on blur (when user leaves the field)
        bcSerialInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value && !isValidBCSerial(value)) {
                showCustomAlert("Battery Charger Serial No. must be in format: XXXXX-XXXX");
                this.focus();
            }
        });
    }
});

function goToBack() {
    saveCurrentRTUDetails(); // Save current RTU details
    window.location.href = 'index.html'; 
}

function goToBQPage() {
    const rtuSerialInput = document.getElementById("rtuSerial");
    const contractNoInput = document.getElementById("contractNo");
    const projectNameInput = document.getElementById("projectName");
    const bcSerialInput = document.getElementById("BCSerial");
    const batchNoInput = document.getElementById("batchNo");

    const rtuSerial = rtuSerialInput ? rtuSerialInput.value.trim() : "";
    const contractNo = contractNoInput ? contractNoInput.value.trim() : "";
    const projectName = projectNameInput ? projectNameInput.value.trim() : "";
    const bcSerial = bcSerialInput ? bcSerialInput.value.trim() : "";
    const batchNo = batchNoInput ? batchNoInput.value.trim() : "";

    // Validate all required fields including BC Serial and Batch No.
    if (!rtuSerial || !contractNo || !projectName || !bcSerial || !batchNo) {
        showCustomAlert("Please fill in all fields (RTU Serial No., Contract No., Batch No., Project Name, and Battery Charger Serial No.)");
        return;
    }

    // Validate Battery Charger Serial Number format
    if (!isValidBCSerial(bcSerial)) {
        showCustomAlert("Battery Charger Serial No. must be in format: XXXXX-XXXX (5 digits, hyphen, 4 digits)");
        return;
    }

    saveCurrentRTUDetails();
    navigationGuard.markPageAsCompleted();

    // Route based on active SCADA mode.
    // rtudetail.html is not part of either PAGE_SEQUENCE, so we pick the
    // first page of the active sequence manually.
    const mode = (window.navigationGuard && typeof navigationGuard.getScadaMode === 'function')
        ? navigationGuard.getScadaMode()
        : (localStorage.getItem('scadaMode') === 'ready' ? 'ready' : 'equipped');

    if (mode === 'ready') {
        window.location.href = './PanelInformation.html';
    } else {
        window.location.href = './BQ.html';
    }
}