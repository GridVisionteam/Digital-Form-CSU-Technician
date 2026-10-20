// CsuTestingChecklist_SPARE.js - Save only Remote/RCB and Supervisory/ASE fields
// Data keys format: SPARE6_R_1, SPARE6_S_1, SPARE7_R_1, SPARE7_S_1, etc.

// Initialize with empty data structures
if (!window.csuTestingChecklistSpareResults) window.csuTestingChecklistSpareResults = {
    spare6: {},
    spare7: {}
};

// Data definitions for Spare6
const SPARE6_ITEMS = [
    { No: "1", IOModuleCard: "XZ1D:9", Description: "DI DB SPARE 1", IOA: "5", Status: "Open" },
    { No: "2", IOModuleCard: "XZ1D:10", Description: "DI DB SPARE 1", IOA: "5", Status: "Close" },
    { No: "3", IOModuleCard: "XZ1D:11", Description: "DI DB SPARE 2", IOA: "6", Status: "Open" },
    { No: "4", IOModuleCard: "XZ1D:12", Description: "DI DB SPARE 2", IOA: "6", Status: "Close" },
    { No: "5", IOModuleCard: "XZ1D:13", Description: "DI DB SPARE 3", IOA: "7", Status: "Open" },
    { No: "6", IOModuleCard: "XZ1D:14", Description: "DI DB SPARE 3", IOA: "7", Status: "Close" },
    { No: "7", IOModuleCard: "XZ1D:15", Description: "DI DB SPARE 4", IOA: "8", Status: "Open" },
    { No: "8", IOModuleCard: "XZ1D:16", Description: "DI DB SPARE 4", IOA: "8", Status: "Close" },
];

// Data definitions for Spare7
const SPARE7_ITEMS = [
    { No: "1", IOModuleCard: "XZ1D:31", Description: "DI SB SPARE 2", IOA: "115", Status: "ON" },
    { No: "2", IOModuleCard: "XZ1D:32", Description: "DI SB SPARE 3", IOA: "116", Status: "ON" },
    { No: "3", IOModuleCard: "XZ1K:10", Description: "CO CB SPARE 1", IOA: "1502", Status: "ON" },
    { No: "4", IOModuleCard: "XZ1K:11", Description: "CO DB SPARE 1", IOA: "1005", Status: "Open" },
    { No: "5", IOModuleCard: "XZ1K:12", Description: "CO DB SPARE 1", IOA: "1005", Status: "Close" },
    { No: "6", IOModuleCard: "XZ1K:13", Description: "CO DB SPARE 2", IOA: "1006", Status: "Open" },
    { No: "7", IOModuleCard: "XZ1K:14", Description: "CO DB SPARE 2", IOA: "1006", Status: "Close" },
    { No: "8", IOModuleCard: "XZ1K:15", Description: "CO DB SPARE 3", IOA: "1007", Status: "Open" },
    { No: "9", IOModuleCard: "XZ1K:16", Description: "CO DB SPARE 3", IOA: "1007", Status: "Close" },
];

// Main initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load saved test results if available
    const savedResults = localStorage.getItem('csuTestingChecklistSpareResults');
    if (savedResults) {
        try {
            const parsed = JSON.parse(savedResults);
            window.csuTestingChecklistSpareResults = {
                spare6: parsed.spare6 || {},
                spare7: parsed.spare7 || {}
            };
        } catch (e) {
            console.error('Error parsing saved data:', e);
            window.csuTestingChecklistSpareResults = { spare6: {}, spare7: {} };
        }
    }

    // Generate rows for each table
    generateTableRowsSpare('Spare6Tbody', SPARE6_ITEMS, 'spare6', 6);
    generateTableRowsSpare('Spare7Tbody', SPARE7_ITEMS, 'spare7', 7);

    // Load any saved data - THIS POPULATES THE FIELDS
    loadSpareData();

    // Attach event listeners to navigation buttons
    attachNavigationEventsSpare();

    // Setup input validation for Remote/Supervisory fields
    setupInputValidationSpare();
});

// Function to generate table rows for any table
function generateTableRowsSpare(tbodyId, items, dataKey, sectionNum) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const savedObj = window.csuTestingChecklistSpareResults[dataKey] || {};

    tbody.innerHTML = '';

    items.forEach((item, index) => {
        const rowNum = index + 1; // 1-based row number
        const remoteKey = `SPARE${sectionNum}_R_${rowNum}`;
        const supervisoryKey = `SPARE${sectionNum}_S_${rowNum}`;

        // Convert stored "N/A" back to "-" for display
        const rawRemote = savedObj[remoteKey];
        const rawSupervisory = savedObj[supervisoryKey];

        const isRemoteNA = rawRemote === 'N/A';
        const isSupervisoryNA = rawSupervisory === 'N/A';

        const remoteValue = isRemoteNA ? '-' : (rawRemote || '');
        const supervisoryValue = isSupervisoryNA ? '-' : (rawSupervisory || '');

        // Only disable if it came from loaded data with value "N/A" (displayed as "-")
        const isRemoteDisabled = isRemoteNA;
        const isSupervisoryDisabled = isSupervisoryNA;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;">${item.No}</td>
            <td style="text-align: center;">${item.IOModuleCard}</td>
            <td style="text-align: center;">${item.Description}</td>
            <td style="text-align: center;">${item.IOA}</td>
            <td style="text-align: center;">${item.Status}</td>
            <td style="text-align: center;">
                <input type="text" 
                       name="${remoteKey}" 
                       id="${remoteKey}"
                       value="${remoteValue}" 
                       data-key="${remoteKey}"
                       data-section="${dataKey}"
                       data-from-loaded-data="${isRemoteNA ? 'true' : 'false'}"
                       style="width: 60px; text-align: center; border: 2px solid #ccc; font-weight: bold;" 
                       maxlength="1"
                       ${isRemoteDisabled ? 'disabled' : ''} />
            </td>
            <td style="text-align: center;">
                <input type="text" 
                       name="${supervisoryKey}" 
                       id="${supervisoryKey}"
                       value="${supervisoryValue}" 
                       data-key="${supervisoryKey}"
                       data-section="${dataKey}"
                       data-from-loaded-data="${isSupervisoryNA ? 'true' : 'false'}"
                       style="width: 60px; text-align: center; border: 2px solid #ccc; font-weight: bold;" 
                       maxlength="1"
                       ${isSupervisoryDisabled ? 'disabled' : ''} />
            </td>
        `;
        tbody.appendChild(row);

        // Apply grey styling if disabled
        if (isRemoteDisabled) {
            const input = row.querySelector(`input[name="${remoteKey}"]`);
            if (input) {
                input.style.backgroundColor = '#f0f0f0';
                input.style.color = '#999';
            }
        }
        if (isSupervisoryDisabled) {
            const input = row.querySelector(`input[name="${supervisoryKey}"]`);
            if (input) {
                input.style.backgroundColor = '#f0f0f0';
                input.style.color = '#999';
            }
        }
    });

    // Setup validation after rows are generated
    setupInputValidationSpare();
}

// Function to setup input validation for Remote/Supervisory fields
// Only allow "/" for user input (dash is reserved for loaded N/A data)
function setupInputValidationSpare() {
    const allInputs = document.querySelectorAll('#Spare6Tbody input[type="text"], #Spare7Tbody input[type="text"]');
    allInputs.forEach(function(input) {
        // Remove existing listeners to avoid duplicates
        input.removeEventListener('input', input._validationHandler);

        // Store initial value
        input.dataset.previousValue = input.value;

        // IMPORTANT: Only disable if it came from loaded data
        if (input.value === '-' && input.dataset.fromLoadedData === 'true') {
            input.disabled = true;
            input.style.backgroundColor = '#f0f0f0';
            input.style.color = '#999';
        } else {
            // Always enable for user input
            input.disabled = false;
            input.style.backgroundColor = '';
            input.style.color = '';
        }

        // Input handler - only allow "/"
        const handler = function() {
            const value = this.value;

            // If empty, allow it
            if (value === '') {
                this.dataset.previousValue = '';
                this.disabled = false;
                this.style.backgroundColor = '';
                this.style.color = '';
                this.style.borderColor = '';
                return;
            }

            // Only allow "/" for user input (dash is reserved for loaded N/A data)
            if (value !== '/') {
                const previousValue = this.dataset.previousValue || '';
                this.value = previousValue;
                this.style.borderColor = 'red';
                setTimeout(() => {
                    this.style.borderColor = '';
                }, 500);
                return;
            }

            // Store the valid value
            this.dataset.previousValue = value;

            // Always keep enabled for user input
            this.disabled = false;
            this.style.backgroundColor = '';
            this.style.color = '';

            this.style.borderColor = 'green';
            setTimeout(() => {
                this.style.borderColor = '';
            }, 300);
        };

        input._validationHandler = handler;
        input.addEventListener('input', handler);
    });
}

// ============================================================
// LOAD DATA - Populates the fields from saved data
// ============================================================
function loadSpareData() {
    console.log('Loading SPARE data...');

    // Spare6
    const spare6Data = window.csuTestingChecklistSpareResults.spare6 || {};
    populateTableFromDataSpare('Spare6Tbody', spare6Data, 6);

    // Spare7
    const spare7Data = window.csuTestingChecklistSpareResults.spare7 || {};
    populateTableFromDataSpare('Spare7Tbody', spare7Data, 7);
}

function populateTableFromDataSpare(tbodyId, dataObj, sectionNum) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) {
        console.error('Table body not found:', tbodyId);
        return;
    }

    const rows = tbody.querySelectorAll('tr');

    rows.forEach((row, index) => {
        const rowNum = index + 1;
        const remoteKey = `SPARE${sectionNum}_R_${rowNum}`;
        const supervisoryKey = `SPARE${sectionNum}_S_${rowNum}`;

        // ---- Remote field ----
        const remoteInput = row.querySelector(`input[name="${remoteKey}"]`);
        if (remoteInput && dataObj[remoteKey] !== undefined) {
            let value = dataObj[remoteKey] || '';
            // Convert "N/A" from JSON to "-" for display
            const isNotApplicable = value === 'N/A';
            if (isNotApplicable) {
                value = '-';
            }
            remoteInput.value = value;
            remoteInput.dataset.previousValue = value;
            remoteInput.dataset.fromLoadedData = isNotApplicable ? 'true' : 'false';

            // If value is "-" from loaded data (N/A), disable it
            if (value === '-' && isNotApplicable) {
                remoteInput.disabled = true;
                remoteInput.style.backgroundColor = '#f0f0f0';
                remoteInput.style.color = '#999';
            } else {
                remoteInput.disabled = false;
                remoteInput.style.backgroundColor = '';
                remoteInput.style.color = '';
            }
        }

        // ---- Supervisory field ----
        const supervisoryInput = row.querySelector(`input[name="${supervisoryKey}"]`);
        if (supervisoryInput && dataObj[supervisoryKey] !== undefined) {
            let value = dataObj[supervisoryKey] || '';
            // Convert "N/A" from JSON to "-" for display
            const isNotApplicable = value === 'N/A';
            if (isNotApplicable) {
                value = '-';
            }
            supervisoryInput.value = value;
            supervisoryInput.dataset.previousValue = value;
            supervisoryInput.dataset.fromLoadedData = isNotApplicable ? 'true' : 'false';

            // If value is "-" from loaded data (N/A), disable it
            if (value === '-' && isNotApplicable) {
                supervisoryInput.disabled = true;
                supervisoryInput.style.backgroundColor = '#f0f0f0';
                supervisoryInput.style.color = '#999';
            } else {
                supervisoryInput.disabled = false;
                supervisoryInput.style.backgroundColor = '';
                supervisoryInput.style.color = '';
            }
        }
    });
}

// ============================================================
// VALIDATION FUNCTION - Check if all required fields are filled
// ============================================================
function validateSpareData() {
    let missingFields = [];

    const textInputs = document.querySelectorAll('#Spare6Tbody input[type="text"], #Spare7Tbody input[type="text"]');

    textInputs.forEach(input => {
        // Skip if disabled (value is "-" meaning N/A from loaded data)
        if (input.disabled) return;

        const value = input.value.trim();
        if (value === '' || value === null) {
            const row = input.closest('tr');
            const cells = row ? row.querySelectorAll('td') : [];
            const description = cells[2] ? cells[2].textContent.trim() : 'Unknown';
            const ioa = cells[3] ? cells[3].textContent.trim() : '';
            const isRemote = input.name.includes('_R_');
            const fieldType = isRemote ? 'Remote/RCB' : 'Supervisory/ASE';
            missingFields.push(`${fieldType} for ${description} (IOA: ${ioa})`);
        } else if (value !== '/') {
            const row = input.closest('tr');
            const cells = row ? row.querySelectorAll('td') : [];
            const description = cells[2] ? cells[2].textContent.trim() : 'Unknown';
            missingFields.push(`Invalid value "${value}" for ${description} (must be "/")`);
        }
    });

    return {
        isValid: missingFields.length === 0,
        missingFields: missingFields
    };
}

// ============================================================
// HIGHLIGHT MISSING FIELDS
// ============================================================
function highlightMissingFieldsSpare() {
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach(input => {
        input.style.borderColor = '';
        input.style.borderWidth = '';
        input.style.backgroundColor = '';
    });

    const textInputs = document.querySelectorAll('#Spare6Tbody input[type="text"], #Spare7Tbody input[type="text"]');
    textInputs.forEach(input => {
        if (input.disabled) return; // Skip disabled fields (value is "-")
        const value = input.value.trim();
        if (value === '' || value === null) {
            input.style.borderColor = 'red';
            input.style.borderWidth = '3px';
            input.style.backgroundColor = '#ffe6e6';
        }
    });
}

// ============================================================
// CLEAR ALL FUNCTION - Only clears user-entered data, preserves loaded disabled data
// ============================================================
function clearAllSpare() {
    const textInputs = document.querySelectorAll('#Spare6Tbody input[type="text"], #Spare7Tbody input[type="text"]');
    textInputs.forEach(input => {
        // IMPORTANT: Only clear if NOT disabled (user-entered data)
        // Disabled inputs are the loaded "-" values from JSON and should be preserved
        if (!input.disabled) {
            input.value = '';
            input.dataset.previousValue = '';
            // Keep the fromLoadedData flag as is
            input.style.backgroundColor = '';
            input.style.color = '';
            input.style.borderColor = '';
        }
    });
}

// ============================================================
// CONFIRMATION WRAPPER
// ============================================================
function clearAllCSU2WithConfirm() {
    // Count how many disabled (loaded) fields exist
    const disabledInputs = document.querySelectorAll('#Spare6Tbody input[type="text"]:disabled, #Spare7Tbody input[type="text"]:disabled');
    const disabledCount = disabledInputs.length;

    let confirmMessage = "⚠️ WARNING: This will clear ALL user-entered test data for the CSU Testing Checklist - Spare.\n\n";
    confirmMessage += "This includes:\n";
    confirmMessage += "- All user-entered Remote/RCB and Supervisory/ASE text fields for Spare 6 & Spare 7\n\n";
    confirmMessage += "This action CANNOT be undone.\n\nAre you sure you want to continue?";

    if (confirm(confirmMessage)) {
        clearAllSpare();
        alert("All user-entered data has been cleared. Loaded data has been preserved.");
    }
}

// Save Spare test data - ONLY Remote/RCB and Supervisory/ASE
// Convert "-" to "N/A" for storage
function saveSpareData() {
    console.log('Saving SPARE test data (Remote/RCB and Supervisory/ASE only)...');

    const results = {
        spare6: {},
        spare7: {}
    };

    // Save Spare6
    saveTableDataSpare('Spare6Tbody', results.spare6, 6);

    // Save Spare7
    saveTableDataSpare('Spare7Tbody', results.spare7, 7);

    window.csuTestingChecklistSpareResults = results;

    try {
        localStorage.setItem('csuTestingChecklistSpareResults', JSON.stringify(results));
        console.log('Data saved successfully:', results);
        return true;
    } catch (e) {
        console.error('Error saving data to localStorage:', e);
        return false;
    }
}

// Helper: save Remote/RCB and Supervisory/ASE only
// Converts "-" (displayed N/A) to "N/A" for storage
function saveTableDataSpare(tbodyId, targetObj, sectionNum) {
    const rows = document.querySelectorAll(`#${tbodyId} tr`);
    rows.forEach((row, index) => {
        const rowNum = index + 1;
        const remoteKey = `SPARE${sectionNum}_R_${rowNum}`;
        const supervisoryKey = `SPARE${sectionNum}_S_${rowNum}`;

        const remoteInput = row.querySelector(`input[name="${remoteKey}"]`);
        if (remoteInput) {
            let remoteValue = remoteInput.value.trim();
            // Convert "-" to "N/A" for storage
            if (remoteValue === '-') {
                remoteValue = 'N/A';
            }
            targetObj[remoteKey] = remoteValue;
        }

        const supervisoryInput = row.querySelector(`input[name="${supervisoryKey}"]`);
        if (supervisoryInput) {
            let supervisoryValue = supervisoryInput.value.trim();
            // Convert "-" to "N/A" for storage
            if (supervisoryValue === '-') {
                supervisoryValue = 'N/A';
            }
            targetObj[supervisoryKey] = supervisoryValue;
        }
    });
}

// Navigation functions
function goToPreviousPage2() {
    console.log('Going to previous page...');

    if (saveSpareData()) {
        window.location.href = 'CsuTestingChecklist2.html';
    } else {
        alert('Error saving data. Please try again.');
    }
}

function goToNext2() {
    console.log('Validating data before going to next page...');

    const validation = validateSpareData();

    if (!validation.isValid) {
        let message = '⚠️ Cannot proceed to next page.\n\n';
        message += 'The following fields are empty or invalid:\n\n';
        validation.missingFields.forEach((field, index) => {
            message += `${index + 1}. ${field}\n`;
        });
        message += '\nPlease fill in all required fields before continuing.';
        message += '\nNote: Remote/RCB and Supervisory/ASE fields must be "/".';

        alert(message);
        highlightMissingFieldsSpare();
        return;
    }

    console.log('All fields validated successfully!');

    if (saveSpareData()) {
        if (typeof navigationGuard !== 'undefined') {
            navigationGuard.markPageAsCompleted();
        }
        window.location.href = 'CsuTestingChecklist3.html';
    } else {
        alert('Error saving data. Please try again.');
    }
}

function clearAll() {
    clearAllSpare();
}

// Attach navigation event listeners
function attachNavigationEventsSpare() {
    const prevBtn = document.querySelector('button[onclick*="previous"], button[onclick*="Previous"], #prevBtn, .prev-btn');
    if (prevBtn) {
        prevBtn.onclick = null;
        prevBtn.addEventListener('click', goToPreviousPage2);
    } else {
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.toLowerCase().includes('previous') || 
                btn.textContent.toLowerCase().includes('back')) {
                btn.onclick = null;
                btn.addEventListener('click', goToPreviousPage2);
            }
        });
    }

    const nextBtn = document.querySelector('button[onclick*="next"], button[onclick*="Next"], #nextBtn, .next-btn');
    if (nextBtn) {
        nextBtn.onclick = null;
        nextBtn.addEventListener('click', goToNext2);
    } else {
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.toLowerCase().includes('next') || 
                btn.textContent.toLowerCase().includes('continue')) {
                btn.onclick = null;
                btn.addEventListener('click', goToNext2);
            }
        });
    }

    document.body.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
            const onclickAttr = e.target.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes('goToPreviousPage2')) {
                e.preventDefault();
                e.target.onclick = null;
                goToPreviousPage2();
            } else if (onclickAttr && onclickAttr.includes('goToNext2')) {
                e.preventDefault();
                e.target.onclick = null;
                goToNext2();
            }
        }
    });
}