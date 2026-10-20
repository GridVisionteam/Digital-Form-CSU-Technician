// CsuTestingChecklist3.js - JSON saves only FT_R_{1-8} keys (INPUTS ENABLED)

// Initialize with empty data structures
if (!window.csuTestingChecklist3Results) window.csuTestingChecklist3Results = {};

// Data definitions for Checklist 3
const CHECKLIST_ITEMS = [
    { No: "1", Description: "Panel Light & Door Switch" },
    { No: "2", Description: "Switch Socket" },
    { No: "3", Description: "Heater" },
    { No: "4", Description: "Batery Charge Cover" },
    { No: "5", Description: "Battery Charge Sticker" },
    { No: "6", Description: "Battery Charger Reset <b>*Reset alarm and MCU processor only</b>" },
    { No: "7", Description: "AC Reading", inputType: "number" },
    { No: "8", Description: "DC Voltage Reading <b>*Without AC Input, Acceptance Criteria: 25.4 VDC and Above</b>", inputType: "number" }
];

// Main initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load saved test results if available
    const savedResults = localStorage.getItem('csuTestingChecklist3Results');
    if (savedResults) {
        try {
            window.csuTestingChecklist3Results = JSON.parse(savedResults);
        } catch (e) {
            console.error('Error parsing saved data:', e);
        }
    }

    // Generate rows for the table
    generateTableRows('CHECKLIST', CHECKLIST_ITEMS, 'checklist3');

    // Load any saved data - THIS POPULATES THE FIELDS
    loadCSU3Data();

    // Attach event listeners to navigation buttons
    attachNavigationEvents3();

    // Enable all inputs (since we want them editable)
    enableAllChecklist3Inputs();

    // Setup real-time input restriction
    setupInputRestrictions();
});

// Function to generate table rows
function generateTableRows(tbodyId, items, dataKey) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    tbody.innerHTML = '';

    items.forEach((item, index) => {
        const row = document.createElement('tr');
        
        const descriptionContent = item.Description;
        const inputType = item.inputType || 'text';
        const isNumberInput = inputType === 'number';
        
        // JSON key format: FT_R_1, FT_R_2, ... FT_R_8
        const jsonKey = `FT_R_${index + 1}`;
        
        // Get saved value from JSON using FT_R_{n} key
        let savedValue = window.csuTestingChecklist3Results[jsonKey] || '';
        
        let testResultValue = savedValue;
        
        let testResultHTML = '';
        
        if (isNumberInput) {
            // Number input for items 7 & 8 - positive numbers only (ENABLED)
            testResultHTML = `<input type="number" name="${jsonKey}" value="${testResultValue}" 
                               style="width: 80px; text-align: center; border: 2px solid #ccc; font-weight: bold;" 
                               min="0" step="any" />`;
        } else {
            // Text input for items 1-6 - only "/" (ENABLED)
            testResultHTML = `<input type="text" name="${jsonKey}" value="${testResultValue}" 
                               style="width: 60px; text-align: center; border: 2px solid #ccc; font-weight: bold;" />`;
        }
        
        row.innerHTML = `
            <td style="text-align: center;">${item.No}</td>
            <td style="text-align: center;">${descriptionContent}</td>
            <td style="text-align: center;">${testResultHTML}</td>
        `;
        tbody.appendChild(row);
    });
}

// Enable all inputs inside #CHECKLIST
function enableAllChecklist3Inputs() {
    const inputs = document.querySelectorAll('#CHECKLIST input');
    inputs.forEach(input => {
        input.disabled = false;
        input.readOnly = false;
        input.style.backgroundColor = '';
        input.style.cursor = '';
    });
}

// ============================================================
// REAL-TIME INPUT RESTRICTIONS
// ============================================================
function setupInputRestrictions() {
    // Items 1-6 (text inputs) - only "/" allowed
    const textInputs = document.querySelectorAll('#CHECKLIST input[type="text"]');
    textInputs.forEach(input => {
        if (!input.name || !input.name.startsWith('FT_R_')) return;
        
        // Store previous value
        input.dataset.previousValue = input.value;
        
        // Remove existing listener to avoid duplicates
        input.removeEventListener('input', input._restrictionHandler);
        
        const handler = function() {
            const value = this.value;
            
            // If empty, allow it (user can clear)
            if (value === '') {
                this.dataset.previousValue = '';
                this.style.borderColor = '#ccc';
                return;
            }
            
            // Only allow "/"
            if (value !== '/') {
                // Revert to previous valid value
                this.value = this.dataset.previousValue || '';
                // Visual feedback
                this.style.borderColor = 'red';
                setTimeout(() => {
                    this.style.borderColor = '#ccc';
                }, 500);
                return;
            }
            
            // Valid "/"
            this.dataset.previousValue = '/';
            this.style.borderColor = 'green';
            setTimeout(() => {
                this.style.borderColor = '#ccc';
            }, 300);
        };
        
        input._restrictionHandler = handler;
        input.addEventListener('input', handler);
    });
    
    // Items 7-8 (number inputs) - positive numbers only
    const numberInputs = document.querySelectorAll('#CHECKLIST input[type="number"]');
    numberInputs.forEach(input => {
        if (!input.name || !input.name.startsWith('FT_R_')) return;
        
        // Store previous value
        input.dataset.lastValidValue = input.value;
        
        // Remove existing listener to avoid duplicates
        input.removeEventListener('input', input._restrictionHandler);
        
        const handler = function() {
            const value = this.value;
            
            // If empty, allow it
            if (value === '') {
                this.dataset.lastValidValue = '';
                this.style.borderColor = '#ccc';
                return;
            }
            
            // Check if it's a valid positive number
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue < 0) {
                // Invalid - revert to last valid value
                this.value = this.dataset.lastValidValue || '';
                this.style.borderColor = 'red';
                setTimeout(() => {
                    this.style.borderColor = '#ccc';
                }, 500);
                return;
            }
            
            // Valid positive number
            this.dataset.lastValidValue = value;
            
            // Special real-time feedback for item 8 (DC Voltage >= 25.4)
            if (this.name === 'FT_R_8' && numValue < 25.4) {
                this.style.borderColor = 'orange';
            } else {
                this.style.borderColor = 'green';
                setTimeout(() => {
                    this.style.borderColor = '#ccc';
                }, 300);
            }
        };
        
        input._restrictionHandler = handler;
        input.addEventListener('input', handler);
    });
}

// ============================================================
// LOAD DATA - POPULATES THE FIELDS FROM SAVED DATA
// ============================================================
function loadCSU3Data() {
    console.log('Loading CSU3 data from window.csuTestingChecklist3Results...');
    
    if (window.csuTestingChecklist3Results && Object.keys(window.csuTestingChecklist3Results).length > 0) {
        console.log('Loading Checklist3 data from FT_R_{1-8} keys');
        populateTableFromData3('CHECKLIST', window.csuTestingChecklist3Results);
    } else {
        console.log('No Checklist3 data found');
    }
}

function populateTableFromData3(tbodyId, dataObject) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) {
        console.error('Table body not found:', tbodyId);
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
        const jsonKey = `FT_R_${index + 1}`;
        const savedValue = dataObject[jsonKey];
        
        if (savedValue === undefined || savedValue === null) return;
        
        const numberInput = row.querySelector(`input[type="number"][name="${jsonKey}"]`);
        const textInput = row.querySelector(`input[type="text"][name="${jsonKey}"]`);
        const targetInput = numberInput || textInput;
        
        if (targetInput) {
            let value = savedValue;
            
            targetInput.value = value;
            
            if (numberInput) {
                targetInput.dataset.lastValidValue = value;
            } else {
                targetInput.dataset.previousValue = value;
            }
        }
    });
}

// ============================================================
// VALIDATION FUNCTION - Check if all required fields are filled
// ============================================================
function validateCSU3Data() {
    let missingFields = [];
    
    // Check items 1-6 (text inputs) - must be "/"
    const textInputs = document.querySelectorAll('#CHECKLIST input[type="text"]');
    textInputs.forEach(input => {
        if (!input.name || !input.name.startsWith('FT_R_')) return;
        
        const value = input.value.trim();
        const row = input.closest('tr');
        const cells = row ? row.querySelectorAll('td') : [];
        const itemNo = cells[0] ? cells[0].textContent.trim() : '?';
        const description = cells[1] ? cells[1].textContent.trim() : 'Unknown';
        
        if (value === '') {
            missingFields.push({
                input: input,
                message: `Item ${itemNo} (${description}) is empty.`
            });
        } else if (value !== '/') {
            missingFields.push({
                input: input,
                message: `Item ${itemNo} (${description}).`
            });
        }
    });
    
    // Check items 7-8 (number inputs) - must be positive values
    const numberInputs = document.querySelectorAll('#CHECKLIST input[type="number"]');
    numberInputs.forEach(input => {
        if (!input.name || !input.name.startsWith('FT_R_')) return;
        
        const value = input.value.trim();
        const row = input.closest('tr');
        const cells = row ? row.querySelectorAll('td') : [];
        const itemNo = cells[0] ? cells[0].textContent.trim() : '?';
        const description = cells[1] ? cells[1].textContent.trim() : 'Unknown';
        
        if (value === '') {
            missingFields.push({
                input: input,
                message: `Item ${itemNo} (${description}) is empty.`
            });
            return;
        }
        
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
            missingFields.push({
                input: input,
                message: `Item ${itemNo} (${description}).`
            });
            return;
        }
        
        // Special check for item 8 (DC Voltage Reading) - must be >= 25.4
        if (input.name === 'FT_R_8') {
            if (numValue < 25.4) {
                missingFields.push({
                    input: input,
                    message: `Item 8 (DC Voltage Reading) must be 25.4 VDC or above.`
                });
            }
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
function highlightMissingFields3(missingFields) {
    // Reset all borders and backgrounds first
    const allInputs = document.querySelectorAll('#CHECKLIST input');
    allInputs.forEach(input => {
        input.style.borderColor = '#ccc';
        input.style.borderWidth = '2px';
        input.style.backgroundColor = '';
        input.style.boxShadow = '';
    });
    
    // Highlight the specific invalid inputs
    missingFields.forEach(field => {
        if (field.input) {
            field.input.style.borderColor = 'red';
            field.input.style.borderWidth = '3px';
            field.input.style.backgroundColor = '#ffcccc';
            field.input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
        }
    });
}

// ============================================================
// NAVIGATION FUNCTIONS WITH MODE-AWARE ROUTING
// ============================================================

function goToPreviousPage3() {
    console.log('Going to previous page from Checklist...');

    if (!saveCSU3Data()) {
        alert('Error saving data. Please try again.');
        return;
    }

    const mode = (window.navigationGuard && typeof navigationGuard.getScadaMode === 'function')
        ? navigationGuard.getScadaMode()
        : (localStorage.getItem('scadaMode') === 'ready' ? 'ready' : 'equipped');

    if (mode === 'ready') {
        // SCADA READY: previous page is CsuTestingChecklist.html.
        // Only clear forward marks (current + later pages), NOT earlier ones.
        const sequence = (window.navigationGuard && typeof navigationGuard.getActiveSequence === 'function')
            ? navigationGuard.getActiveSequence()
            : [];
        const currentPage = window.location.pathname.split('/').pop();
        const currentIndex = sequence.indexOf(currentPage);
        if (currentIndex !== -1) {
            for (let i = currentIndex; i < sequence.length; i++) {
                localStorage.removeItem(`${sequence[i]}_completed`);
            }
        }
        console.log('Data saved successfully, navigating to CsuTestingChecklist.html');
        window.location.href = 'CsuTestingChecklist.html';
    } else {
        // EQUIPPED mode fallback
        console.log('Data saved successfully, navigating to CsuTestingChecklist_SPARE.html');
        window.location.href = 'CsuTestingChecklist_SPARE.html';
    }
}

function goToNext3() {
    console.log('Validating data before going to next page...');
    
    // Run validation
    const validation = validateCSU3Data();
    
    if (!validation.isValid) {
        // Show alert with all missing/invalid fields
        let message = '⚠️ Cannot proceed to next page.\n\n';
        message += 'The following fields are empty or invalid:\n\n';
        validation.missingFields.forEach((field, index) => {
            message += `${index + 1}. ${field.message}\n`;
        });
        message += '\nPlease fill in all required fields before continuing.\n';
        
        alert(message);
        
        // Highlight missing fields with RED border
        highlightMissingFields3(validation.missingFields);
        
        return; // Stop navigation
    }
    
    // All fields are valid, proceed with save and navigation
    console.log('All fields validated successfully!');

    if (!saveCSU3Data()) {
        alert('Error saving data. Please try again.');
        return;
    }

    if (typeof navigationGuard !== 'undefined') {
        navigationGuard.markPageAsCompleted();
    }

    const mode = (window.navigationGuard && typeof navigationGuard.getScadaMode === 'function')
        ? navigationGuard.getScadaMode()
        : (localStorage.getItem('scadaMode') === 'ready' ? 'ready' : 'equipped');

    if (mode === 'ready') {
        console.log('Data saved successfully, navigating to DIP Switch Setting.html');
        window.location.href = 'DIP Switch Setting.html';
    } else {
        // EQUIPPED mode fallback
        console.log('Data saved successfully, navigating to DIP Switch Setting.html');
        window.location.href = 'DIP Switch Setting.html';
    }
}

// ============================================================
// CLEAR ALL FUNCTION (now works since inputs are enabled)
// ============================================================
function clearAllCSU3() {
    document.querySelectorAll('#CHECKLIST input[type="text"]').forEach(input => {
        if (input.name && input.name.startsWith('FT_R_')) {
            input.value = '';
            input.dataset.previousValue = '';
        }
    });
    
    document.querySelectorAll('#CHECKLIST input[type="number"]').forEach(input => {
        if (input.name && input.name.startsWith('FT_R_')) {
            input.value = '';
            input.dataset.lastValidValue = '';
        }
    });
    
    // Reset borders after clearing
    const allInputs = document.querySelectorAll('#CHECKLIST input');
    allInputs.forEach(input => {
        input.style.borderColor = '#ccc';
        input.style.borderWidth = '2px';
        input.style.backgroundColor = '';
        input.style.boxShadow = '';
    });
}

function clearAllCSU3WithConfirm() {
    if (confirm("Are you sure you want to clear all data on this page?")) {
        clearAllCSU3();
    }
}

// ============================================================
// SELECT ALL FUNCTION (sets all text inputs to "/")
// ============================================================
function selectAllCSU3() {
    document.querySelectorAll('#CHECKLIST input[type="text"]').forEach(input => {
        if (input.name && input.name.startsWith('FT_R_')) {
            input.value = '/';
            input.dataset.previousValue = '/';
            input.style.borderColor = '#ccc';
        }
    });
    
    // For number inputs, we cannot automatically set a value, so we leave them
    // or you could set a default like 0, but that might not be desired.
    // We'll just alert the user.
    const numberInputs = document.querySelectorAll('#CHECKLIST input[type="number"]');
    if (numberInputs.length > 0) {
        alert("Number fields (AC Reading, DC Voltage Reading) must be filled manually.");
    }
}

// ============================================================
// SAVE DATA - Only FT_R_{1-8} keys
// ============================================================
function saveCSU3Data() {
    console.log('Saving CSU Testing Checklist 3 data...');
    
    // Reset object - only FT_R_1 to FT_R_8 keys
    window.csuTestingChecklist3Results = {};
    
    // Collect values from all inputs
    document.querySelectorAll('#CHECKLIST input').forEach(input => {
        if (input.name && input.name.startsWith('FT_R_')) {
            let value = input.value;
            window.csuTestingChecklist3Results[input.name] = value || null;
        }
    });

    // Save to localStorage
    try {
        localStorage.setItem('csuTestingChecklist3Results', JSON.stringify(window.csuTestingChecklist3Results));
        console.log('Data saved successfully:', window.csuTestingChecklist3Results);
        return true;
    } catch (e) {
        console.error('Error saving data to localStorage:', e);
        return false;
    }
}

// Function to attach navigation event listeners
function attachNavigationEvents3() {
    const prevBtn = document.querySelector('button[onclick*="previous"], button[onclick*="Previous"], #prevBtn, .prev-btn');
    if (prevBtn) {
        prevBtn.onclick = null;
        prevBtn.addEventListener('click', goToPreviousPage3);
    } else {
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.toLowerCase().includes('previous') || 
                btn.textContent.toLowerCase().includes('back')) {
                btn.onclick = null;
                btn.addEventListener('click', goToPreviousPage3);
            }
        });
    }

    const nextBtn = document.querySelector('button[onclick*="next"], button[onclick*="Next"], #nextBtn, .next-btn');
    if (nextBtn) {
        nextBtn.onclick = null;
        nextBtn.addEventListener('click', goToNext3);
    } else {
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.toLowerCase().includes('next') || 
                btn.textContent.toLowerCase().includes('continue')) {
                btn.onclick = null;
                btn.addEventListener('click', goToNext3);
            }
        });
    }

    document.body.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
            const onclickAttr = e.target.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes('goToPreviousPage3')) {
                e.preventDefault();
                e.target.onclick = null;
                goToPreviousPage3();
            } else if (onclickAttr && onclickAttr.includes('goToNext3')) {
                e.preventDefault();
                e.target.onclick = null;
                goToNext3();
            }
        }
    });
}

// Utility functions for backward compatibility
function SelectAll3() {
    selectAllCSU3();
}

function clearAll3() {
    clearAllCSU3();
}