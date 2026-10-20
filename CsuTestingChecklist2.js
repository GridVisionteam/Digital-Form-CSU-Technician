// CsuTestingChecklist2.js - Same structure as CsuTestingChecklist.js with all features

// Initialize with empty data structures
if (!window.csuTestingChecklist2Results) window.csuTestingChecklist2Results = {
    dummyBreaker: [],
    others: []
};

// Data definitions for Dummy Breaker
const DUMMY_BREAKER_ITEMS = [
    { No: "1", IOModuleCard: "XZ1D:1", Description: "Dummy Breaker Indication", IOA: "1", Status: "Open" },
    { No: "2", IOModuleCard: "XZ1D:2", Description: "Dummy Breaker Indication", IOA: "1", Status: "Close" },
    { No: "3", IOModuleCard: "XZ1K:1", Description: "Dummy Breaker Control", IOA: "1001", Status: "Open" },
    { No: "4", IOModuleCard: "XZ1K:2", Description: "Dummy Breaker Control", IOA: "1001", Status: "Close" }
];

// Data definitions for Others
const OTHERS_ITEMS = [
    { No: "1", IOModuleCard: "XZ1D:17", Description: "CES", IOA: "101", Status: "ON" },
    { No: "2", IOModuleCard: "XZ1D:27", Description: "CHARGER SUMMARY ALARM", IOA: "111", Status: "ON" },
    { No: "3", IOModuleCard: "XZ1D:28", Description: "RMU AC TRIP", IOA: "112", Status: "ON" },
    { No: "4", IOModuleCard: "XZ1D:29", Description: "DIGITAL INPUT CIRCUIT FAIL", IOA: "113", Status: "ON" },
    { No: "5", IOModuleCard: "XZ1D:30", Description: "DIGITAL OUTPUT CIRCUIT FAIL", IOA: "114", Status: "ON" },
    { No: "6", IOModuleCard: "XZ1K:9", Description: "EFI MASTER RESET", IOA: "1501", Status: "ON" },
    { No: "7", IOModuleCard: "N/A", Description: "BUFFER FULL", IOA: "950", Status: "ON" },
    { No: "8", IOModuleCard: "N/A", Description: "TIME SYNC", IOA: "951", Status: "ON" },
    { No: "9", IOModuleCard: "N/A", Description: "VIRTUAL POINT FOR COMMUNICATION TO NCC FAIL", IOA: "953", Status: "ON" },
    { No: "10", IOModuleCard: "N/A", Description: "VIRTUAL POINT FOR DI1 CARD/MODULE FAIL", IOA: "954", Status: "ON" },
    { No: "11", IOModuleCard: "N/A", Description: "VIRTUAL POINT FOR DO1 CARD/MODULE FAIL", IOA: "955", Status: "ON" }
];

// Main initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load saved test results if available
    const savedResults = localStorage.getItem('csuTestingChecklist2Results');
    if (savedResults) {
        try {
            window.csuTestingChecklist2Results = JSON.parse(savedResults);
            if (!window.csuTestingChecklist2Results.dummyBreaker) {
                window.csuTestingChecklist2Results.dummyBreaker = [];
            }
            if (!window.csuTestingChecklist2Results.others) {
                window.csuTestingChecklist2Results.others = [];
            }
        } catch (e) {
            console.error('Error parsing saved data:', e);
        }
    }

    // Generate rows for each table
    generateTableRows2('DummyBreakerTbody', DUMMY_BREAKER_ITEMS, 'dummyBreaker');
    generateTableRows2('OthersTbody', OTHERS_ITEMS, 'others');

    // Load any saved data - THIS POPULATES THE FIELDS
    loadCSU2Data();

    // Attach event listeners to navigation buttons
    attachNavigationEvents2();

    // Setup input validation for Remote/Supervisory fields
    setupInputValidation2();
});

// Function to setup validation for EFI AC/DC inputs (only positive numbers)
function setupEfiValidation2() {
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(function(input) {
        // Remove existing listeners to avoid duplicates
        input.removeEventListener('input', input._efiValidationHandler);
        input.removeEventListener('blur', input._efiBlurHandler);
        
        // Store the last valid value
        input.dataset.lastValidValue = input.value;
        
        // Create and store the input handler
        const handler = function() {
            const value = this.value;
            
            // If empty, allow it
            if (value === '') {
                this.dataset.lastValidValue = '';
                return;
            }
            
            // Check if it's a valid positive number
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue < 0) {
                // Invalid - revert to last valid value
                this.value = this.dataset.lastValidValue || '';
                // Show visual feedback
                this.style.borderColor = 'red';
                setTimeout(() => {
                    this.style.borderColor = '';
                }, 500);
                return;
            }
            
            // Valid positive number
            this.dataset.lastValidValue = value;
            this.style.borderColor = 'green';
            setTimeout(() => {
                this.style.borderColor = '';
            }, 300);
        };
        
        input._efiValidationHandler = handler;
        input.addEventListener('input', handler);
        
        // Also validate on blur
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
        
        input._efiBlurHandler = blurHandler;
        input.addEventListener('blur', blurHandler);
    });
}

// Function to generate table rows for any table
function generateTableRows2(tbodyId, items, dataKey) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const savedArray = dataKey === 'dummyBreaker' 
        ? (window.csuTestingChecklist2Results.dummyBreaker || [])
        : (window.csuTestingChecklist2Results.others || []);

    tbody.innerHTML = '';

    items.forEach((item, index) => {
        const saved = (savedArray && savedArray[index]) ? savedArray[index] : {};
        const row = document.createElement('tr');
        
        // Check if this is an EFI row (has AC/DC inputs) - for Others table
        const isEfi = item.Description && item.Description.includes('EFI');
        let descriptionContent;
        
        if (isEfi) {
            const acValue = saved.acValue || '';
            const dcValue = saved.dcValue || '';
            descriptionContent = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 2px;">
                    <span style="font-size: 16px;">${item.Description}</span>
                    <div style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap; justify-content: center;">
                        <span style="font-size: 14px;">AC:</span>
                        <input type="number" name="${dataKey}_ac_${index}" value="${acValue}" 
                               style="width: 50px; padding: 2px 4px; border: 2px solid #000; font-weight: bold; text-align: center;" 
                               placeholder="0" min="0" step="any" />
                        <span style="font-size: 14px;">DC:</span>
                        <input type="number" name="${dataKey}_dc_${index}" value="${dcValue}" 
                               style="width: 50px; padding: 2px 4px; border: 2px solid #000; font-weight: bold; text-align: center;" 
                               placeholder="0" min="0" step="any" />
                    </div>
                </div>
            `;
        } else {
            descriptionContent = item.Description;
        }
        
        // Get saved remote and supervisory values, convert "N/A" back to "-" for display
        const remoteValue = saved.remote === 'N/A' ? '-' : (saved.remote || '');
        const supervisoryValue = saved.supervisory === 'N/A' ? '-' : (saved.supervisory || '');
        
        // Check if the value is "-" and it came from saved data (not user typed)
        const hasSavedData = savedArray && savedArray[index] && savedArray[index].remote !== undefined;
        const isFromLoadedData = hasSavedData && (saved.remote === 'N/A' || saved.supervisory === 'N/A');
        
        // Only disable if it came from loaded data with value "N/A" (displayed as "-")
        const isRemoteDisabled = remoteValue === '-' && isFromLoadedData;
        const isSupervisoryDisabled = supervisoryValue === '-' && isFromLoadedData;
        
        row.innerHTML = `
            <td style="text-align: center;">${item.No}</td>
            <td style="text-align: center;">${item.IOModuleCard}</td>
            <td style="text-align: center;">${descriptionContent}</td>
            <td style="text-align: center;">${item.IOA}</td>
            <td style="text-align: center;">${item.Status}</td>
            <td style="text-align: center;">
                <input type="text" name="${dataKey}_remote_${index}" value="${remoteValue}" 
                       style="width: 60px; text-align: center; border: 2px solid #ccc; font-weight: bold;" 
                       ${isRemoteDisabled ? 'disabled' : ''} 
                       data-from-loaded-data="${isFromLoadedData ? 'true' : 'false'}" />
            </td>
            <td style="text-align: center;">
                <input type="text" name="${dataKey}_supervisory_${index}" value="${supervisoryValue}" 
                       style="width: 60px; text-align: center; border: 2px solid #ccc; font-weight: bold;" 
                       ${isSupervisoryDisabled ? 'disabled' : ''} 
                       data-from-loaded-data="${isFromLoadedData ? 'true' : 'false'}" />
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Setup validation after rows are generated
    setupInputValidation2();
    setupEfiValidation2();
}

// Function to setup input validation for Remote/Supervisory fields
function setupInputValidation2() {
    // Find all Remote and Supervisory inputs
    const allInputs = document.querySelectorAll('input[type="text"]');
    allInputs.forEach(function(input) {
        if (input.name && (input.name.includes('remote') || input.name.includes('supervisory'))) {
            // Remove existing listeners to avoid duplicates
            input.removeEventListener('input', input._validationHandler);
            
            // Store initial value
            input.dataset.previousValue = input.value;
            
            // IMPORTANT: Only disable if it came from loaded data
            // The data-from-loaded-data attribute is set in generateTableRows2 and populateTableFromData2
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
            
            // Create and store the input handler
            const handler = function() {
                const value = this.value;
                
                // If empty, allow it
                if (value === '') {
                    this.dataset.previousValue = '';
                    this.disabled = false;
                    this.style.backgroundColor = '';
                    this.style.color = '';
                    return;
                }
                
                // Only allow "/" for user input (dash is reserved for loaded N/A data)
                if (value !== '/') {
                    const previousValue = this.dataset.previousValue || '';
                    this.value = previousValue;
                    // Show visual feedback
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
        }
    });
}

// ============================================================
// LOAD DATA - THIS POPULATES THE FIELDS FROM SAVED DATA
// ============================================================
function loadCSU2Data() {
    console.log('Loading CSU2 data from window.csuTestingChecklist2Results...');
    
    // Populate Dummy Breaker
    if (window.csuTestingChecklist2Results && window.csuTestingChecklist2Results.dummyBreaker && 
        window.csuTestingChecklist2Results.dummyBreaker.length > 0) {
        console.log('Loading Dummy Breaker data:', window.csuTestingChecklist2Results.dummyBreaker.length, 'items');
        populateTableFromData2('DummyBreakerTbody', window.csuTestingChecklist2Results.dummyBreaker, 'dummyBreaker');
    } else {
        console.log('No Dummy Breaker data found in window.csuTestingChecklist2Results.dummyBreaker');
    }
    
    // Populate Others
    if (window.csuTestingChecklist2Results && window.csuTestingChecklist2Results.others && 
        window.csuTestingChecklist2Results.others.length > 0) {
        console.log('Loading Others data:', window.csuTestingChecklist2Results.others.length, 'items');
        populateTableFromData2('OthersTbody', window.csuTestingChecklist2Results.others, 'others');
    } else {
        console.log('No Others data found in window.csuTestingChecklist2Results.others');
    }
}

function populateTableFromData2(tbodyId, dataArray, dataKey) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) {
        console.error('Table body not found:', tbodyId);
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    console.log(`Populating ${tbodyId} with ${dataArray.length} items, found ${rows.length} rows`);
    
    rows.forEach((row, index) => {
        if (index < dataArray.length) {
            const data = dataArray[index];
            
            // Set remote value
            const remoteInput = row.querySelector(`input[name="${dataKey}_remote_${index}"]`);
            if (remoteInput) {
                let value = data.remote || '';
                // Convert "N/A" from JSON to "-" for display
                const isNotApplicable = value === 'N/A';
                if (isNotApplicable) {
                    value = '-';
                }
                remoteInput.value = value;
                remoteInput.dataset.previousValue = value;
                
                // Set flag ONLY if this came from loaded data with "N/A"
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
            } else {
                console.warn(`Remote input not found for ${dataKey}_remote_${index}`);
            }
            
            // Set supervisory value
            const supervisoryInput = row.querySelector(`input[name="${dataKey}_supervisory_${index}"]`);
            if (supervisoryInput) {
                let value = data.supervisory || '';
                // Convert "N/A" from JSON to "-" for display
                const isNotApplicable = value === 'N/A';
                if (isNotApplicable) {
                    value = '-';
                }
                supervisoryInput.value = value;
                supervisoryInput.dataset.previousValue = value;
                
                // Set flag ONLY if this came from loaded data with "N/A"
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
            } else {
                console.warn(`Supervisory input not found for ${dataKey}_supervisory_${index}`);
            }
            
            // Set AC value for EFI rows
            const acInput = row.querySelector(`input[name="${dataKey}_ac_${index}"]`);
            if (acInput && data.acValue !== undefined && data.acValue !== null) {
                acInput.value = data.acValue;
                acInput.dataset.lastValidValue = data.acValue;
            }
            
            // Set DC value for EFI rows
            const dcInput = row.querySelector(`input[name="${dataKey}_dc_${index}"]`);
            if (dcInput && data.dcValue !== undefined && data.dcValue !== null) {
                dcInput.value = data.dcValue;
                dcInput.dataset.lastValidValue = data.dcValue;
            }
        }
    });
}

// ============================================================
// VALIDATION FUNCTION - Check if all required fields are filled
// ============================================================
function validateCSU2Data() {
    let missingFields = [];
    let missingEfiFields = [];
    let invalidEfiFields = [];
    
    // Check all Remote and Supervisory fields
    const textInputs = document.querySelectorAll('#DummyBreakerTbody input[type="text"], #OthersTbody input[type="text"]');
    
    textInputs.forEach(input => {
        if (input.name && (input.name.includes('remote') || input.name.includes('supervisory'))) {
            // Skip if disabled (value is "-" meaning N/A from loaded data)
            if (input.disabled) return;
            
            const value = input.value.trim();
            // Check if empty or only whitespace
            if (value === '' || value === null) {
                // Get the row and identify which field
                const row = input.closest('tr');
                const cells = row ? row.querySelectorAll('td') : [];
                const description = cells[2] ? cells[2].textContent.trim() : 'Unknown';
                const ioa = cells[3] ? cells[3].textContent.trim() : '';
                const fieldType = input.name.includes('remote') ? 'Remote' : 'Supervisory';
                missingFields.push(`${fieldType} for ${description} (IOA: ${ioa})`);
            } else if (value !== '/') {
                // Invalid value - should not happen with validation, but just in case
                const row = input.closest('tr');
                const cells = row ? row.querySelectorAll('td') : [];
                const description = cells[2] ? cells[2].textContent.trim() : 'Unknown';
                missingFields.push(`Invalid value "${value}" for ${description} (must be "/")`);
            }
        }
    });
    
    // Check all EFI AC/DC fields
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        const value = input.value.trim();
        if (value === '' || value === null) {
            // Get the row and identify which field
            const row = input.closest('tr');
            const cells = row ? row.querySelectorAll('td') : [];
            const description = cells[2] ? cells[2].textContent.trim() : 'Unknown EFI';
            const fieldType = input.name.includes('ac') ? 'AC' : 'DC';
            missingEfiFields.push(`${fieldType} value for ${description}`);
        } else {
            // Check if it's a valid positive number
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue < 0) {
                const row = input.closest('tr');
                const cells = row ? row.querySelectorAll('td') : [];
                const description = cells[2] ? cells[2].textContent.trim() : 'Unknown EFI';
                const fieldType = input.name.includes('ac') ? 'AC' : 'DC';
                invalidEfiFields.push(`${fieldType} value for ${description} (must be a positive number)`);
            }
        }
    });
    
    // Combine missing fields
    const allMissing = [...missingFields, ...missingEfiFields, ...invalidEfiFields];
    
    return {
        isValid: allMissing.length === 0,
        missingFields: allMissing
    };
}

// ============================================================
// HIGHLIGHT MISSING FIELDS
// ============================================================
function highlightMissingFields2() {
    // Reset all borders first
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach(input => {
        input.style.borderColor = '';
        input.style.borderWidth = '';
        input.style.backgroundColor = '';
    });
    
    // Check Remote and Supervisory fields
    const textInputs = document.querySelectorAll('#DummyBreakerTbody input[type="text"], #OthersTbody input[type="text"]');
    textInputs.forEach(input => {
        if (input.name && (input.name.includes('remote') || input.name.includes('supervisory'))) {
            if (input.disabled) return; // Skip disabled fields (value is "-")
            const value = input.value.trim();
            if (value === '' || value === null) {
                input.style.borderColor = 'red';
                input.style.borderWidth = '3px';
                input.style.backgroundColor = '#ffe6e6';
            }
        }
    });
    
    // Check EFI AC/DC fields
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
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
        }
    });
}

// ============================================================
// CLEAR ALL FUNCTION - Only clears user-entered data, preserves loaded disabled data
// ============================================================
function clearAllCSU2() {
    // Clear only the enabled Remote and Supervisory text inputs (user-entered data)
    const textInputs = document.querySelectorAll('#DummyBreakerTbody input[type="text"], #OthersTbody input[type="text"]');
    textInputs.forEach(input => {
        if (input.name && (input.name.includes('remote') || input.name.includes('supervisory'))) {
            // IMPORTANT: Only clear if NOT disabled (user-entered data)
            // Disabled inputs are the loaded "-" values from JSON and should be preserved
            if (!input.disabled) {
                input.value = '';
                input.dataset.previousValue = '';
                // Keep the fromLoadedData flag as is
                input.style.backgroundColor = '';
                input.style.color = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    });
    
    // Clear only the EFI AC/DC inputs that have user-entered data (not the loaded ones)
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        // Only clear if it's NOT from loaded data
        if (input.dataset.fromLoadedData !== 'true') {
            input.value = '';
            input.dataset.lastValidValue = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
}

// ============================================================
// CONFIRMATION WRAPPER
// ============================================================
function clearAllCSU2WithConfirm() {
    // Count how many disabled (loaded) fields exist
    const disabledInputs = document.querySelectorAll('#DummyBreakerTbody input[type="text"]:disabled, #OthersTbody input[type="text"]:disabled');
    const disabledCount = disabledInputs.length;
    
    let confirmMessage = "⚠️ WARNING: This will clear ALL user-entered test data for the CSU Testing Checklist 2.\n\n";
    confirmMessage += "This includes:\n";
    confirmMessage += "- All user-entered Remote and Supervisory text fields for Dummy Breaker & Others\n";
    confirmMessage += "- All user-entered AC/DC input values (EFI rows)\n\n";
    confirmMessage += "This action CANNOT be undone.\n\nAre you sure you want to continue?";
    
    if (confirm(confirmMessage)) {
        clearAllCSU2();
        alert("All user-entered data has been cleared. Loaded data has been preserved.");
    }
}

// Save CSU2 test data
function saveCSU2Data() {
    console.log('Saving CSU2 test data...');
    
    if (!window.csuTestingChecklist2Results) {
        window.csuTestingChecklist2Results = {
            dummyBreaker: [],
            others: []
        };
    }

    // Clear arrays before saving new data
    window.csuTestingChecklist2Results.dummyBreaker = [];
    window.csuTestingChecklist2Results.others = [];

    // Save Dummy Breaker data
    saveTableData2('DummyBreakerTbody', 'dummyBreaker', window.csuTestingChecklist2Results.dummyBreaker);
    
    // Save Others data
    saveTableData2('OthersTbody', 'others', window.csuTestingChecklist2Results.others);

    // Save to localStorage
    try {
        localStorage.setItem('csuTestingChecklist2Results', JSON.stringify(window.csuTestingChecklist2Results));
        console.log('Data saved successfully:', window.csuTestingChecklist2Results);
        return true;
    } catch (e) {
        console.error('Error saving data to localStorage:', e);
        return false;
    }
}

// Helper function to save data from a specific table
function saveTableData2(tbodyId, dataKey, targetArray) {
    const rows = document.querySelectorAll(`#${tbodyId} tr`);
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        
        // Check for AC/DC inputs (EFI rows)
        const acInput = row.querySelector(`input[name="${dataKey}_ac_${index}"]`);
        const dcInput = row.querySelector(`input[name="${dataKey}_dc_${index}"]`);
        let description = cells[2] ? cells[2].textContent.trim() : '';
        let acValue = '';
        let dcValue = '';
        
        if (acInput && dcInput) {
            acValue = acInput.value;
            dcValue = dcInput.value;
        }
        
        const ioa = cells[3] ? cells[3].textContent.trim() : '';
        const status = cells[4] ? cells[4].textContent.trim() : '';
        
        // Get remote value - convert "-" to "N/A" for storage
        const remoteInput = row.querySelector(`input[name="${dataKey}_remote_${index}"]`);
        let remoteValue = remoteInput ? remoteInput.value : '';
        // If value is "-", store as "N/A"
        if (remoteValue === '-') {
            remoteValue = 'N/A';
        }
        
        // Get supervisory value - convert "-" to "N/A" for storage
        const supervisoryInput = row.querySelector(`input[name="${dataKey}_supervisory_${index}"]`);
        let supervisoryValue = supervisoryInput ? supervisoryInput.value : '';
        // If value is "-", store as "N/A"
        if (supervisoryValue === '-') {
            supervisoryValue = 'N/A';
        }
        
        targetArray.push({
            Description: description,
            IOA: ioa,
            Status: status,
            remote: remoteValue || null,
            supervisory: supervisoryValue || null,
            acValue: acValue || null,
            dcValue: dcValue || null
        });
    });
}

// Navigation functions
function goToPreviousPage2() {
    console.log('Going to previous page...');
    
    if (saveCSU2Data()) {
        console.log('Data saved successfully, navigating to CsuTestingChecklist.html');
        window.location.href = 'CsuTestingChecklist.html';
    } else {
        alert('Error saving data. Please try again.');
    }
}

function goToNext2() {
    console.log('Validating data before going to next page...');
    
    // Run validation
    const validation = validateCSU2Data();
    
    if (!validation.isValid) {
        // Show alert with all missing fields
        let message = '⚠️ Cannot proceed to next page.\n\n';
        message += 'The following fields are empty or invalid:\n\n';
        validation.missingFields.forEach((field, index) => {
            message += `${index + 1}. ${field}\n`;
        });
        message += '\nPlease fill in all required fields before continuing.\n';
        message += 'Note: Remote and Supervisory fields must be "/".';
        
        alert(message);
        
        // Highlight missing fields by adding a red border
        highlightMissingFields2();
        
        return; // Stop navigation
    }
    
    // All fields are valid, proceed with save and navigation
    console.log('All fields validated successfully!');
    
    if (saveCSU2Data()) {
        console.log('Data saved successfully, navigating to CsuTestingChecklist_SPARE.html');
        if (typeof navigationGuard !== 'undefined') {
            navigationGuard.markPageAsCompleted();
        }
        window.location.href = 'CsuTestingChecklist_SPARE.html';
    } else {
        alert('Error saving data. Please try again.');
    }
}

function clearAll() {
    clearAllCSU2();
}

// Function to attach navigation event listeners
function attachNavigationEvents2() {
    // Attach to Previous button
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

    // Attach to Next button
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