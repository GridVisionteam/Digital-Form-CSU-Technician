// CsuTestingChecklist3.js - JSON saves only FT_R_{1-9} keys

// Initialize with empty data structures
if (!window.csuTestingChecklist3Results) window.csuTestingChecklist3Results = {};

// Data definitions for Checklist 3
const CHECKLIST_ITEMS = [
    { No: "1", Description: "IEC101 Communication (ASE2000)" },
    { No: "2", Description: "Panel Light & Door Switch" },
    { No: "3", Description: "Switch Socket" },
    { No: "4", Description: "Heater" },
    { No: "5", Description: "Batery Charge Cover" },
    { No: "6", Description: "Battery Charge Sticker" },
    { No: "7", Description: "Battery Charger Reset <b>*Reset alarm and MCU processor only</b>" },
    { No: "8", Description: "AC Reading", inputType: "number" },
    { No: "9", Description: "DC Voltage Reading <b>*Without AC Input, Acceptance Criteria: 25.4 VDC and Above</b>", inputType: "number" }
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

    // Setup input validation for Test Result fields
    setupInputValidation3();

    // Setup validation for number inputs (items 8 & 9)
    setupPositiveNumberValidation3();
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
        
        // JSON key format: FT_R_1, FT_R_2, ... FT_R_9
        const jsonKey = `FT_R_${index + 1}`;
        
        // Get saved value from JSON using FT_R_{n} key
        let savedValue = window.csuTestingChecklist3Results[jsonKey] || '';
        
        // For text inputs, use the saved value directly (no N/A conversion)
        let testResultValue = isNumberInput ? savedValue : savedValue;
        
        let testResultHTML = '';
        
        if (isNumberInput) {
            // Number input for items 8 & 9 - positive numbers only
            testResultHTML = `<input type="number" name="${jsonKey}" value="${testResultValue}" 
                               style="width: 80px; text-align: center; border: 2px solid #ccc; font-weight: bold;" 
                               min="0" step="any" />`;
        } else {
            // Text input for items 1-7 - only "/"
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

    // Setup validation after rows are generated
    setupInputValidation3();
    setupPositiveNumberValidation3();
}

// Function to setup input validation for Test Result text fields (items 1-7)
function setupInputValidation3() {
    const allInputs = document.querySelectorAll('input[type="text"]');
    allInputs.forEach(function(input) {
        if (input.name && input.name.startsWith('FT_R_')) {
            input.removeEventListener('input', input._validationHandler);
            input.dataset.previousValue = input.value;
            
            const handler = function() {
                const value = this.value;
                
                if (value === '') {
                    this.dataset.previousValue = '';
                    return;
                }
                
                // Only allow "/"
                if (value !== '/') {
                    const previousValue = this.dataset.previousValue || '';
                    this.value = previousValue;
                    this.style.borderColor = 'red';
                    setTimeout(() => {
                        this.style.borderColor = '';
                    }, 500);
                    return;
                }
                
                this.dataset.previousValue = value;
                this.style.borderColor = 'green';
                setTimeout(() => {
                    this.style.borderColor = '';
                }, 300);
            };
            
            input._validationHandler = handler;
            input.addEventListener('input', handler);
        }
    });
}

// Function to setup validation for number inputs (items 8 & 9) - positive numbers only
function setupPositiveNumberValidation3() {
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(function(input) {
        if (input.name && input.name.startsWith('FT_R_')) {
            input.removeEventListener('input', input._numberValidationHandler);
            input.removeEventListener('blur', input._numberBlurHandler);
            
            input.dataset.lastValidValue = input.value;
            
            const handler = function() {
                const value = this.value;
                
                if (value === '') {
                    this.dataset.lastValidValue = '';
                    return;
                }
                
                const numValue = parseFloat(value);
                if (isNaN(numValue) || numValue < 0) {
                    this.value = this.dataset.lastValidValue || '';
                    this.style.borderColor = 'red';
                    setTimeout(() => {
                        this.style.borderColor = '';
                    }, 500);
                    return;
                }
                
                this.dataset.lastValidValue = value;
                this.style.borderColor = 'green';
                setTimeout(() => {
                    this.style.borderColor = '';
                }, 300);
            };
            
            input._numberValidationHandler = handler;
            input.addEventListener('input', handler);
            
            const blurHandler = function() {
                const value = this.value;
                if (value !== '') {
                    const numValue = parseFloat(value);
                    if (isNaN(numValue) || numValue < 0) {
                        this.value = this.dataset.lastValidValue || '';
                        this.style.borderColor = 'red';
                        setTimeout(() => {
                            this.style.borderColor = '';
                        }, 500);
                    }
                }
            };
            
            input._numberBlurHandler = blurHandler;
            input.addEventListener('blur', blurHandler);
        }
    });
}

// ============================================================
// LOAD DATA - POPULATES THE FIELDS FROM SAVED DATA
// ============================================================
function loadCSU3Data() {
    console.log('Loading CSU3 data from window.csuTestingChecklist3Results...');
    
    if (window.csuTestingChecklist3Results && Object.keys(window.csuTestingChecklist3Results).length > 0) {
        console.log('Loading Checklist3 data from FT_R_{1-9} keys');
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
    const missingFields = [];
    
    // Check all text Test Result fields (items 1-7)
    const textInputs = document.querySelectorAll('#CHECKLIST input[type="text"]');
    textInputs.forEach(input => {
        if (input.name && input.name.startsWith('FT_R_')) {
            const value = input.value.trim();
            if (value === '' || value === null) {
                const row = input.closest('tr');
                const cells = row ? row.querySelectorAll('td') : [];
                const description = cells[1] ? cells[1].textContent.trim() : 'Unknown';
                missingFields.push(`Test Result for ${description}`);
            } else if (value !== '/') {
                const row = input.closest('tr');
                const cells = row ? row.querySelectorAll('td') : [];
                const description = cells[1] ? cells[1].textContent.trim() : 'Unknown';
                missingFields.push(`Invalid value "${value}" for ${description} (must be "/")`);
            }
        }
    });
    
// Check all number Test Result fields (items 8 & 9)
const numberInputs = document.querySelectorAll('#CHECKLIST input[type="number"]');
numberInputs.forEach(input => {
    if (input.name && input.name.startsWith('FT_R_')) {
        const value = input.value.trim();
        if (value === '' || value === null) {
            const row = input.closest('tr');
            const cells = row ? row.querySelectorAll('td') : [];
            const description = cells[1] ? cells[1].textContent.trim() : 'Unknown';
            missingFields.push(`Test Result for ${description}`);
        } else {
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue < 0) {
                const row = input.closest('tr');
                const cells = row ? row.querySelectorAll('td') : [];
                const description = cells[1] ? cells[1].textContent.trim() : 'Unknown';
                missingFields.push(`Invalid value "${value}" for ${description} (must be a positive number)`);
            }
            
            // Special validation for item 9 (DC Voltage Reading)
            if (input.name === 'FT_R_9') {
                if (numValue < 25.4) {
                    const row = input.closest('tr');
                    const cells = row ? row.querySelectorAll('td') : [];
                    const description = cells[1] ? cells[1].textContent.trim() : 'Unknown';
                    missingFields.push(`DC Voltage Reading must be 25.4 VDC or above (current: ${value} VDC)`);
                }
            }
        }
    }
});
    
    return {
        isValid: missingFields.length === 0,
        missingFields: missingFields
    };
}

// ============================================================
// NAVIGATION FUNCTIONS WITH VALIDATION
// ============================================================

function goToPreviousPage3() {
    console.log('Going to previous page from Checklist 3...');
    
    if (saveCSU3Data()) {
        console.log('Data saved successfully, navigating to CsuTestingChecklist_SPARE.html');
        window.location.href = 'CsuTestingChecklist_SPARE.html';
    } else {
        alert('Error saving data. Please try again.');
    }
}

function goToNext3() {
    console.log('Validating data before going to next page...');
    
    const validation = validateCSU3Data();
    
    if (!validation.isValid) {
        let message = '⚠️ Cannot proceed to next page.\n\n';
        message += 'The following fields are empty or invalid:\n\n';
        validation.missingFields.forEach((field, index) => {
            message += `${index + 1}. ${field}\n`;
        });
        message += '\nPlease fill in all required fields before continuing.';
        
        alert(message);
        highlightMissingFields3();
        return;
    }
    
    console.log('All fields validated successfully!');
    
    if (saveCSU3Data()) {
        console.log('Data saved successfully, navigating to DIP Switch Setting.html');
        if (typeof navigationGuard !== 'undefined') {
            navigationGuard.markPageAsCompleted();
        }
        window.location.href = 'DIP Switch Setting.html';
    } else {
        alert('Error saving data. Please try again.');
    }
}

// ============================================================
// HIGHLIGHT MISSING FIELDS
// ============================================================
function highlightMissingFields3() {
    document.querySelectorAll('input').forEach(input => {
        input.style.borderColor = '';
        input.style.borderWidth = '';
        input.style.backgroundColor = '';
    });
    
    document.querySelectorAll('#CHECKLIST input[type="text"]').forEach(input => {
        if (input.name && input.name.startsWith('FT_R_')) {
            const value = input.value.trim();
            if (value === '' || value === null || value !== '/') {
                input.style.borderColor = 'red';
                input.style.borderWidth = '3px';
                input.style.backgroundColor = '#ffe6e6';
            }
        }
    });
    
document.querySelectorAll('#CHECKLIST input[type="number"]').forEach(input => {
    if (input.name && input.name.startsWith('FT_R_')) {
        const value = input.value.trim();
        if (value === '' || value === null) {
            input.style.borderColor = 'red';
            input.style.borderWidth = '3px';
            input.style.backgroundColor = '#ffe6e6';
        } else {
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue < 0) {
                input.style.borderColor = 'red';
                input.style.borderWidth = '3px';
                input.style.backgroundColor = '#ffe6e6';
            }
            // Highlight item 9 if below 25.4
            else if (input.name === 'FT_R_9' && numValue < 25.4) {
                input.style.borderColor = 'red';
                input.style.borderWidth = '3px';
                input.style.backgroundColor = '#ffe6e6';
            }
        }
    }
});
}

// ============================================================
// CLEAR ALL FUNCTION
// ============================================================
function clearAllCSU3() {
    document.querySelectorAll('#CHECKLIST input[type="text"]').forEach(input => {
        if (input.name && input.name.startsWith('FT_R_')) {
            input.value = '';
            input.dataset.previousValue = '';
            input.style.backgroundColor = '';
            input.style.color = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    
    document.querySelectorAll('#CHECKLIST input[type="number"]').forEach(input => {
        if (input.name && input.name.startsWith('FT_R_')) {
            input.value = '';
            input.dataset.lastValidValue = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
        }
    });
}

// ============================================================
// CONFIRMATION WRAPPER
// ============================================================
function clearAllCSU3WithConfirm() {
    let confirmMessage = "⚠️ WARNING: This will clear ALL user-entered test data for the CSU Testing Checklist 3.\n\n";
    confirmMessage += "This includes:\n";
    confirmMessage += "- All user-entered Test Result text fields (items 1-7)\n";
    confirmMessage += "- All user-entered AC/DC number values (items 8-9)\n\n";
    confirmMessage += "This action CANNOT be undone.\n\nAre you sure you want to continue?";
    
    if (confirm(confirmMessage)) {
        clearAllCSU3();
        alert("All user-entered data has been cleared.");
    }
}

// ============================================================
// SELECT ALL FUNCTION
// ============================================================
function selectAllCSU3() {
    document.querySelectorAll('#CHECKLIST input[type="text"]').forEach(input => {
        if (input.name && input.name.startsWith('FT_R_')) {
            input.value = '/';
            input.dataset.previousValue = '/';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    
    document.querySelectorAll('#CHECKLIST input[type="number"]').forEach(input => {
        if (input.name && input.name.startsWith('FT_R_')) {
            input.value = '0';
            input.dataset.lastValidValue = '0';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
        }
    });
}

// ============================================================
// SAVE DATA - Only FT_R_{1-9} keys
// ============================================================
function saveCSU3Data() {
    console.log('Saving CSU Testing Checklist 3 data...');
    
    // Reset object - only FT_R_1 to FT_R_9 keys
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