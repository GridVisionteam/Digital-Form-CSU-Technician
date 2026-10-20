// Initialize with empty data structures using the new storage name
if (!window.csuTestingChecklistResults) window.csuTestingChecklistResults = {
    lbs1: [],
    lbs2: [],
    lbs3: []
};

// Data definitions
const LBS1_ITEMS = [
    { No: "1", IOModuleCard: "XZ1D:3", Description: "LBS 1 Breaker Indication", IOA: "2", Status: "Open" },
    { No: "2", IOModuleCard: "XZ1D:4", Description: "LBS 1 Breaker Indication", IOA: "2", Status: "Close" },
    { No: "3", IOModuleCard: "XZ1D:18", Description: "LBS 1 Supervisory", IOA: "102", Status: "On" },
    { No: "4", IOModuleCard: "XZ1D:19", Description: "LBS 1 Earth Switch", IOA: "103", Status: "On" },
    { No: "5", IOModuleCard: "XZ1K:3", Description: "LBS 1 Breaker Control", IOA: "1002", Status: "Open" },
    { No: "6", IOModuleCard: "XZ1K:4", Description: "LBS 1 Breaker Control", IOA: "1002", Status: "Close" },
    { No: "7", IOModuleCard: "XZ1D:20", Description: "EFI 1", IOA: "104", Status: "On" }
];

const LBS2_ITEMS = [
    { No: "1", IOModuleCard: "XZ1D:5", Description: "LBS 2 Breaker Indication", IOA: "3", Status: "Open" },
    { No: "2", IOModuleCard: "XZ1D:6", Description: "LBS 2 Breaker Indication", IOA: "3", Status: "Close" },
    { No: "3", IOModuleCard: "XZ1D:21", Description: "LBS 2 Supervisory", IOA: "105", Status: "On" },
    { No: "4", IOModuleCard: "XZ1D:22", Description: "LBS 2 Earth Switch", IOA: "106", Status: "On" },
    { No: "5", IOModuleCard: "XZ1K:5", Description: "LBS 2 Breaker Control", IOA: "1003", Status: "Open" },
    { No: "6", IOModuleCard: "XZ1K:6", Description: "LBS 2 Breaker Control", IOA: "1003", Status: "Close" },
    { No: "7", IOModuleCard: "XZ1D:23", Description: "EFI 2", IOA: "107", Status: "On" }
];

const LBS3_ITEMS = [
    { No: "1", IOModuleCard: "XZ1D:7", Description: "LBS 3 Breaker Indication", IOA: "4", Status: "Open" },
    { No: "2", IOModuleCard: "XZ1D:8", Description: "LBS 3 Breaker Indication", IOA: "4", Status: "Close" },
    { No: "3", IOModuleCard: "XZ1D:24", Description: "LBS 3 Supervisory", IOA: "108", Status: "On" },
    { No: "4", IOModuleCard: "XZ1D:25", Description: "LBS 3 Earth Switch", IOA: "109", Status: "On" },
    { No: "5", IOModuleCard: "XZ1K:7", Description: "LBS 3 Breaker Control", IOA: "1004", Status: "Open" },
    { No: "6", IOModuleCard: "XZ1K:8", Description: "LBS 3 Breaker Control", IOA: "1004", Status: "Close" },
    { No: "7", IOModuleCard: "XZ1D:26", Description: "EFI 2 (SPARE)", IOA: "110", Status: "On" }
];

// ============================================================
// SCADA MODE HELPER
// ============================================================
function isScadaReadyMode() {
    return localStorage.getItem('scadaMode') === 'ready';
}

// Main initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load saved test results if available
    const savedResults = localStorage.getItem('csuTestingChecklistResults');
    if (savedResults) {
        try {
            window.csuTestingChecklistResults = JSON.parse(savedResults);
            if (!window.csuTestingChecklistResults.lbs2) {
                window.csuTestingChecklistResults.lbs2 = [];
            }
            if (!window.csuTestingChecklistResults.lbs3) {
                window.csuTestingChecklistResults.lbs3 = [];
            }
            if (!window.csuTestingChecklistResults.lbs1) {
                window.csuTestingChecklistResults.lbs1 = [];
            }
        } catch (e) {
            console.error('Error parsing saved data:', e);
        }
    }

    // Generate rows for each table
    generateTableRows('LBS1Tbody', LBS1_ITEMS, 'lbs1', false);
    generateTableRows('LBS2Tbody', LBS2_ITEMS, 'lbs2', true);
    generateTableRows('LBS3Tbody', LBS3_ITEMS, 'lbs3', true);

    // Load any saved data - THIS POPULATES THE FIELDS
    loadPreRequisiteTestData();

    // Hide I/O Module Card, IOA and Supervisory columns if in SCADA ready mode
    applyScadaReadyColumnVisibility();

    // Attach event listeners to navigation buttons
    attachNavigationEvents();

    // Setup input validation for Remote/Supervisory fields
    setupInputValidation();

    // Setup validation for EFI AC/DC inputs (only positive numbers or "-")
    setupEfiValidation();
});

// ============================================================
// SCADA READY MODE - HIDE COLUMNS
// ============================================================
// Column indexes (0-based) in the restored table:
//   0 = No.
//   1 = I/O Module Card   <-- hide in SCADA ready
//   2 = Description
//   3 = IOA               <-- hide in SCADA ready
//   4 = Status
//   5 = Remote
//   6 = Supervisory       <-- hide in SCADA ready
function applyScadaReadyColumnVisibility() {
    if (!isScadaReadyMode()) return;

    const HIDDEN_COLUMN_INDEXES = [1, 3, 6]; // IOModuleCard, IOA, Supervisory
    const tbodyIds = ['LBS1Tbody', 'LBS2Tbody', 'LBS3Tbody'];

    tbodyIds.forEach(function(tbodyId) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;

        const table = tbody.closest('table');
        if (!table) return;

        // Hide header cells
        const headerCells = table.querySelectorAll('thead tr th');
        headerCells.forEach(function(th, idx) {
            if (HIDDEN_COLUMN_INDEXES.includes(idx)) {
                th.style.display = 'none';
            }
        });

        // Hide body cells AND disable inputs inside them so validation skips them
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(function(row) {
            const cells = row.querySelectorAll('td');
            cells.forEach(function(td, idx) {
                if (HIDDEN_COLUMN_INDEXES.includes(idx)) {
                    td.style.display = 'none';
                    // Disable any inputs inside hidden cells (e.g. Supervisory inputs).
                    // Disabled inputs are automatically skipped by validateCSUData()
                    // and highlightMissingFields().
                    td.querySelectorAll('input, select, textarea').forEach(function(el) {
                        el.disabled = true;
                        el.style.backgroundColor = '#f0f0f0';
                        el.style.color = '#999';
                    });
                }
            });
        });
    });

    console.log('SCADA ready mode: I/O Module Card, IOA and Supervisory columns hidden and disabled.');
}

// Function to setup validation for EFI AC/DC inputs
function setupEfiValidation() {
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

            // Check if it's a valid positive number or "-"
            if (value === '-') {
                // Allow "-" as N/A indicator
                this.dataset.lastValidValue = '-';
                this.style.borderColor = 'green';
                setTimeout(() => {
                    this.style.borderColor = '';
                }, 300);
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
            if (value !== '' && value !== '-') {
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

    // Also handle SPARE EFI text inputs - restrict to positive number or "-"
    const textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(function(input) {
        if (input.name && (input.name.includes('_ac_') || input.name.includes('_dc_'))) {
            // Remove existing listeners to avoid duplicates
            input.removeEventListener('input', input._spareEfiValidationHandler);
            input.removeEventListener('blur', input._spareEfiBlurHandler);

            input.dataset.lastValidValue = input.value;

            const handler = function() {
                const value = this.value;

                // If empty, allow it (will be caught by validation on submit)
                if (value === '') {
                    this.dataset.lastValidValue = '';
                    return;
                }

                // Allow "-" as N/A indicator
                if (value === '-') {
                    this.dataset.lastValidValue = '-';
                    this.style.borderColor = 'green';
                    setTimeout(() => {
                        this.style.borderColor = '';
                    }, 300);
                    return;
                }

                // Check if it's a valid positive number
                const numValue = parseFloat(value);
                if (isNaN(numValue) || numValue < 0) {
                    // Invalid - revert to last valid value
                    this.value = this.dataset.lastValidValue || '';
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

            input._spareEfiValidationHandler = handler;
            input.addEventListener('input', handler);

            const blurHandler = function() {
                const value = this.value;
                if (value !== '' && value !== '-') {
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

            input._spareEfiBlurHandler = blurHandler;
            input.addEventListener('blur', blurHandler);
        }
    });
}

// Function to generate table rows for any table
function generateTableRows(tbodyId, items, dataKey, isLbs2Or3 = false) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const savedArray = dataKey === 'lbs3'
        ? (window.csuTestingChecklistResults.lbs3 || [])
        : dataKey === 'lbs2'
            ? (window.csuTestingChecklistResults.lbs2 || [])
            : (window.csuTestingChecklistResults.lbs1 || []);

    tbody.innerHTML = '';

    items.forEach((item, index) => {
        const saved = (savedArray && savedArray[index]) ? savedArray[index] : {};
        const row = document.createElement('tr');

        // Check if this is an EFI row (has AC/DC inputs)
        const isEfi = item.Description && item.Description.includes('EFI');

        // Check if this is the SPARE EFI (LBS3 item 7)
        const isSpareEfi = item.Description && item.Description.includes('SPARE');

        let descriptionContent;

        if (isEfi) {
            // For SPARE EFI, we use text input to allow "-"
            if (isSpareEfi) {
                const acValue = saved.acValue || '';
                const dcValue = saved.dcValue || '';
                descriptionContent = `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 2px;">
                        <span style="font-size: 16px;">${item.Description}</span>
                        <div style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap; justify-content: center;">
                            <span style="font-size: 14px;">AC:</span>
                            <input type="text" name="${dataKey}_ac_${index}" value="${acValue}"
                                   style="width: 50px; padding: 2px 4px; border: 2px solid #000; font-weight: bold; text-align: center;"
                                   placeholder="0 or -" />
                            <span style="font-size: 14px;">DC:</span>
                            <input type="text" name="${dataKey}_dc_${index}" value="${dcValue}"
                                   style="width: 50px; padding: 2px 4px; border: 2px solid #000; font-weight: bold; text-align: center;"
                                   placeholder="0 or -" />
                        </div>
                    </div>
                `;
            } else {
                // Regular EFI - number inputs
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
            }
        } else {
            descriptionContent = item.Description;
        }

        // Get saved remote value, convert "N/A" back to "-" for display
        const remoteValue = saved.remote === 'N/A' ? '-' : (saved.remote || '');

        // Get saved supervisory value, convert "N/A" back to "-" for display
        const supervisoryValue = saved.supervisory === 'N/A' ? '-' : (saved.supervisory || '');

        // Check if the value is "-" and it came from saved data (not user typed)
        const hasSavedData = savedArray && savedArray[index] && savedArray[index].remote !== undefined;
        const isFromLoadedData = hasSavedData && saved.remote === 'N/A';

        // Only disable if it came from loaded data with value "N/A" (displayed as "-")
        const isRemoteDisabled = remoteValue === '-' && isFromLoadedData;

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
                       style="width: 60px; text-align: center; border: 2px solid #ccc; font-weight: bold;" />
            </td>
        `;
        tbody.appendChild(row);
    });

    // Setup validation after rows are generated
    setupInputValidation();
    setupEfiValidation();
}

// ============================================================
// SETUP INPUT VALIDATION FOR REMOTE/SUPERVISORY FIELDS
// User can ONLY type "/" (dash is reserved for loaded N/A data)
// ============================================================
function setupInputValidation() {
    // Find all Remote and Supervisory inputs
    const allInputs = document.querySelectorAll('input[type="text"]');
    allInputs.forEach(function(input) {
        if (input.name && (input.name.includes('remote') || input.name.includes('supervisory'))) {
            // Remove existing listeners to avoid duplicates
            input.removeEventListener('input', input._validationHandler);

            // Store initial value
            input.dataset.previousValue = input.value;

            // IMPORTANT: Only disable if it came from loaded data
            // The data-from-loaded-data attribute is set in generateTableRows and populateTableFromData
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
// LOAD DATA
// ============================================================
function loadPreRequisiteTestData() {
    console.log('Loading CSU Testing Checklist data from window.csuTestingChecklistResults...');

    // Populate LBS1 (lbs1)
    if (window.csuTestingChecklistResults && window.csuTestingChecklistResults.lbs1 &&
        window.csuTestingChecklistResults.lbs1.length > 0) {
        console.log('Loading LBS1 data (lbs1):', window.csuTestingChecklistResults.lbs1.length, 'items');
        populateTableFromData('LBS1Tbody', window.csuTestingChecklistResults.lbs1, 'lbs1');
    } else {
        console.log('No LBS1 data found in window.csuTestingChecklistResults.lbs1');
    }

    // Populate LBS2
    if (window.csuTestingChecklistResults && window.csuTestingChecklistResults.lbs2 &&
        window.csuTestingChecklistResults.lbs2.length > 0) {
        console.log('Loading LBS2 data (lbs2):', window.csuTestingChecklistResults.lbs2.length, 'items');
        populateTableFromData('LBS2Tbody', window.csuTestingChecklistResults.lbs2, 'lbs2');
    } else {
        console.log('No LBS2 data found in window.csuTestingChecklistResults.lbs2');
    }

    // Populate LBS3
    if (window.csuTestingChecklistResults && window.csuTestingChecklistResults.lbs3 &&
        window.csuTestingChecklistResults.lbs3.length > 0) {
        console.log('Loading LBS3 data (lbs3):', window.csuTestingChecklistResults.lbs3.length, 'items');
        populateTableFromData('LBS3Tbody', window.csuTestingChecklistResults.lbs3, 'lbs3');
    } else {
        console.log('No LBS3 data found in window.csuTestingChecklistResults.lbs3');
    }
}

function populateTableFromData(tbodyId, dataArray, dataKey) {
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
                const isNotApplicable = value === 'N/A';
                if (isNotApplicable) {
                    value = '-';
                }
                remoteInput.value = value;
                remoteInput.dataset.previousValue = value;
                remoteInput.dataset.fromLoadedData = isNotApplicable ? 'true' : 'false';

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

            // Set supervisory value (user-typed, only "/" allowed)
            const supervisoryInput = row.querySelector(`input[name="${dataKey}_supervisory_${index}"]`);
            if (supervisoryInput) {
                let value = data.supervisory || '';
                const isNotApplicable = value === 'N/A';
                if (isNotApplicable) {
                    value = '-';
                }
                supervisoryInput.value = value;
                supervisoryInput.dataset.previousValue = value;
                supervisoryInput.dataset.fromLoadedData = isNotApplicable ? 'true' : 'false';

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

            // Set AC value for EFI rows
            const acInput = row.querySelector(`input[name="${dataKey}_ac_${index}"]`);
            if (acInput && data.acValue !== undefined && data.acValue !== null) {
                let value = data.acValue;
                // Check if this is the SPARE EFI (text input)
                const isSpareEfi = acInput.type === 'text';
                const isNotApplicable = value === 'N/A';

                if (isSpareEfi && isNotApplicable) {
                    // SPARE EFI with N/A - display as "-" and mark as loaded data
                    acInput.value = '-';
                    acInput.dataset.fromLoadedData = 'true';
                    acInput.dataset.lastValidValue = '-';
                    // Don't disable - user should be able to change it
                    acInput.disabled = false;
                } else if (isSpareEfi) {
                    // SPARE EFI with other value
                    acInput.value = value;
                    acInput.dataset.fromLoadedData = 'false';
                    acInput.dataset.lastValidValue = value;
                    acInput.disabled = false;
                } else {
                    // Regular EFI (number input)
                    acInput.value = value;
                    acInput.dataset.lastValidValue = value;
                }
            }

            // Set DC value for EFI rows
            const dcInput = row.querySelector(`input[name="${dataKey}_dc_${index}"]`);
            if (dcInput && data.dcValue !== undefined && data.dcValue !== null) {
                let value = data.dcValue;
                // Check if this is the SPARE EFI (text input)
                const isSpareEfi = dcInput.type === 'text';
                const isNotApplicable = value === 'N/A';

                if (isSpareEfi && isNotApplicable) {
                    // SPARE EFI with N/A - display as "-" and mark as loaded data
                    dcInput.value = '-';
                    dcInput.dataset.fromLoadedData = 'true';
                    dcInput.dataset.lastValidValue = '-';
                    // Don't disable - user should be able to change it
                    dcInput.disabled = false;
                } else if (isSpareEfi) {
                    // SPARE EFI with other value
                    dcInput.value = value;
                    dcInput.dataset.fromLoadedData = 'false';
                    dcInput.dataset.lastValidValue = value;
                    dcInput.disabled = false;
                } else {
                    // Regular EFI (number input)
                    dcInput.value = value;
                    dcInput.dataset.lastValidValue = value;
                }
            }
        }
    });
}

// ============================================================
// VALIDATION FUNCTION - Check if all required fields are filled
// Both Remote AND Supervisory must be filled with "/" (unless loaded N/A)
// In SCADA Ready mode, Supervisory is hidden/disabled and therefore skipped.
// ============================================================
function validateCSUData() {
    let missingFields = [];
    const scadaReady = isScadaReadyMode();

    // Check all Remote AND Supervisory fields
    const textInputs = document.querySelectorAll(
        '#LBS1Tbody input[type="text"], #LBS2Tbody input[type="text"], #LBS3Tbody input[type="text"]'
    );

    textInputs.forEach(input => {
        if (input.name && (input.name.includes('remote') || input.name.includes('supervisory'))) {
            // Skip if disabled (value is "-" meaning N/A from loaded data,
            // OR column is hidden in SCADA Ready mode)
            if (input.disabled) return;

            // Skip Supervisory validation entirely in SCADA Ready mode
            // (the column is hidden so the user cannot fill it)
            if (scadaReady && input.name.includes('supervisory')) return;

            const value = input.value.trim();

            // Get the row and identify which field
            const row = input.closest('tr');
            const cells = row ? row.querySelectorAll('td') : [];
            const description = cells[2] ? cells[2].textContent.trim() : 'Unknown';
            const ioa = cells[3] ? cells[3].textContent.trim() : '';
            const fieldType = input.name.includes('remote') ? 'Remote' : 'Supervisory';

            // Check if empty or only whitespace
            if (value === '' || value === null) {
                missingFields.push({
                    type: 'text',
                    input: input,
                    description: description,
                    fieldType: fieldType,
                    message: `${fieldType} for ${description} (IOA: ${ioa})`
                });
            } else if (value !== '/') {
                // Invalid value - must be "/"
                missingFields.push({
                    type: 'text',
                    input: input,
                    description: description,
                    fieldType: fieldType,
                    message: `Invalid value "${value}" for ${fieldType} ${description} (must be "/")`
                });
            }
        }
    });

    // Check all EFI AC/DC fields
    const efiInputs = document.querySelectorAll('input[type="number"], input[type="text"]');
    efiInputs.forEach(input => {
        // Only check EFI AC/DC fields (name contains ac or dc)
        if (input.name && (input.name.includes('_ac_') || input.name.includes('_dc_'))) {
            // Skip disabled fields
            if (input.disabled) return;

            // Check if this is the SPARE EFI (LBS3 item 7)
            const row = input.closest('tr');
            const cells = row ? row.querySelectorAll('td') : [];
            const description = cells[2] ? cells[2].textContent.trim() : '';
            const isSpareEfi = description.includes('SPARE');

            const value = input.value.trim();

            // For SPARE EFI, we REQUIRE a positive number or "-"
            if (isSpareEfi) {
                if (value === '' || value === null) {
                    // Empty is NOT allowed for SPARE EFI
                    const fieldType = input.name.includes('ac') ? 'AC' : 'DC';
                    missingFields.push({
                        type: 'efi_spare',
                        input: input,
                        description: description,
                        fieldType: fieldType,
                        message: `${fieldType} value for ${description} (must be a positive number or "-")`
                    });
                } else if (value !== '-') {
                    // Not "-", so must be a positive number
                    const numValue = parseFloat(value);
                    if (isNaN(numValue) || numValue < 0) {
                        const fieldType = input.name.includes('ac') ? 'AC' : 'DC';
                        missingFields.push({
                            type: 'efi_spare',
                            input: input,
                            description: description,
                            fieldType: fieldType,
                            message: `${fieldType} value for ${description} (must be a positive number or "-")`
                        });
                    }
                }
                // If value === '-', it's valid (N/A)
            } else {
                // Regular EFI - must be filled with a positive number
                if (value === '' || value === null) {
                    const fieldType = input.name.includes('ac') ? 'AC' : 'DC';
                    missingFields.push({
                        type: 'efi_required',
                        input: input,
                        description: description,
                        fieldType: fieldType,
                        message: `${fieldType} value for ${description}`
                    });
                } else {
                    const numValue = parseFloat(value);
                    if (isNaN(numValue) || numValue < 0) {
                        const fieldType = input.name.includes('ac') ? 'AC' : 'DC';
                        missingFields.push({
                            type: 'efi_required',
                            input: input,
                            description: description,
                            fieldType: fieldType,
                            message: `${fieldType} value for ${description} (must be a positive number)`
                        });
                    }
                }
            }
        }
    });

    return {
        isValid: missingFields.length === 0,
        missingFields: missingFields.map(f => f.message),
        missingFieldObjects: missingFields
    };
}

// ============================================================
// NAVIGATION FUNCTIONS WITH VALIDATION
// ============================================================

function goToPreviousPage() {
    console.log('Going to previous page...');

    if (!savePreRequisiteTestData()) {
        alert('Error saving data. Please try again.');
        return;
    }

    const mode = (window.navigationGuard && typeof navigationGuard.getScadaMode === 'function')
        ? navigationGuard.getScadaMode()
        : (localStorage.getItem('scadaMode') === 'ready' ? 'ready' : 'equipped');

    if (mode === 'ready') {
        // SCADA READY: previous page is RTUPowerUp.html.
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
        console.log('Data saved successfully, navigating to RTUPowerUp.html');
        window.location.href = 'RTUPowerUp.html';
    } else {
        // EQUIPPED mode: previous page is Dummy&CESFunctionalTest.html
        console.log('Data saved successfully, navigating to Dummy&CESFunctionalTest.html');
        window.location.href = 'Dummy&CESFunctionalTest.html';
    }
}

function goToNext() {
    console.log('Validating data before going to next page...');

    // Run validation
    const validation = validateCSUData();

    if (!validation.isValid) {
        // Show alert with all missing fields
        let message = '⚠️ Cannot proceed to next page.\n\n';
        message += 'The following fields are empty or invalid:\n\n';
        validation.missingFields.forEach((field, index) => {
            message += `${index + 1}. ${field}\n`;
        });
        message += '\nPlease fill in all required fields before continuing.\n';
        message += 'Note: Remote fields must all be "/" and "EFI 2 (SPARE)" fields must be filled with a positive number or "-" for N/A.';

        alert(message);

        // Highlight missing fields with RED border - ONLY the specific invalid fields
        highlightMissingFields(validation.missingFieldObjects);

        return; // Stop navigation
    }

    // All fields are valid, proceed with save and navigation
    console.log('All fields validated successfully!');

    if (!savePreRequisiteTestData()) {
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
        console.log('Data saved successfully, navigating to CsuTestingChecklist_SCADA_READY.html');
        window.location.href = 'CsuTestingChecklist_SCADA_READY.html';
    } else {
        console.log('Data saved successfully, navigating to CsuTestingChecklist2.html');
        window.location.href = 'CsuTestingChecklist2.html';
    }
}

// ============================================================
// HIGHLIGHT MISSING FIELDS - ONLY highlight the specific invalid fields
// Skips hidden columns (e.g. Supervisory in SCADA Ready mode).
// ============================================================
function highlightMissingFields(missingFieldObjects) {
    // Reset all borders and backgrounds first
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach(input => {
        input.style.borderColor = '';
        input.style.borderWidth = '';
        input.style.backgroundColor = '';
        input.style.boxShadow = '';
    });

    // If we have specific missing field objects, highlight ONLY those inputs
    if (missingFieldObjects && missingFieldObjects.length > 0) {
        missingFieldObjects.forEach(fieldObj => {
            // Highlight the specific input that has the error
            if (fieldObj.input) {
                const input = fieldObj.input;
                // Don't highlight disabled fields (loaded N/A data or hidden columns)
                if (!input.disabled) {
                    // Don't highlight fields inside hidden cells/rows
                    const cell = input.closest('td');
                    if (cell && cell.style.display === 'none') return;
                    const row = input.closest('tr');
                    if (row && row.style.display === 'none') return;

                    input.style.borderColor = 'red';
                    input.style.borderWidth = '3px';
                    input.style.backgroundColor = '#ffcccc';
                    input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
                }
            }
        });
    }
}

// Save pre-requisite test data
function savePreRequisiteTestData() {
    console.log('Saving CSU Testing Checklist data...');

    if (!window.csuTestingChecklistResults) {
        window.csuTestingChecklistResults = {
            lbs1: [],
            lbs2: [],
            lbs3: []
        };
    }

    // Clear arrays before saving new data
    window.csuTestingChecklistResults.lbs1 = [];
    window.csuTestingChecklistResults.lbs2 = [];
    window.csuTestingChecklistResults.lbs3 = [];

    // Save LBS 1 data
    saveTableData('LBS1Tbody', 'lbs1', window.csuTestingChecklistResults.lbs1);

    // Save LBS 2 data
    saveTableData('LBS2Tbody', 'lbs2', window.csuTestingChecklistResults.lbs2);

    // Save LBS 3 data
    saveTableData('LBS3Tbody', 'lbs3', window.csuTestingChecklistResults.lbs3);

    // Save to localStorage
    try {
        localStorage.setItem('csuTestingChecklistResults', JSON.stringify(window.csuTestingChecklistResults));
        console.log('Data saved successfully:', window.csuTestingChecklistResults);
        return true;
    } catch (e) {
        console.error('Error saving data to localStorage:', e);
        return false;
    }
}

// Helper function to save data from a specific table
// Note: reads .value directly, so it still saves hidden/disabled Supervisory values
// correctly (they simply stay empty in SCADA Ready mode, which is expected).
function saveTableData(tbodyId, dataKey, targetArray) {
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

            // If value is "-", store as "N/A"
            if (acValue === '-') {
                acValue = 'N/A';
            }
            if (dcValue === '-') {
                dcValue = 'N/A';
            }
        }

        const ioa = cells[3] ? cells[3].textContent.trim() : '';
        const status = cells[4] ? cells[4].textContent.trim() : '';

        // Get remote value - convert "-" to "N/A" for storage
        const remoteInput = row.querySelector(`input[name="${dataKey}_remote_${index}"]`);
        let remoteValue = remoteInput ? remoteInput.value : '';
        if (remoteValue === '-') {
            remoteValue = 'N/A';
        }

        // Get supervisory value - convert "-" to "N/A" for storage
        const supervisoryInput = row.querySelector(`input[name="${dataKey}_supervisory_${index}"]`);
        let supervisoryValue = supervisoryInput ? supervisoryInput.value : '';
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

// ============================================================
// CLEAR ALL FUNCTION - Only clears user-entered data, preserves loaded disabled data
// ============================================================
function clearAllCSU() {
    // Clear only the enabled Remote and Supervisory text inputs (user-entered data)
    const textInputs = document.querySelectorAll('#LBS1Tbody input[type="text"], #LBS2Tbody input[type="text"], #LBS3Tbody input[type="text"]');
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

    // Clear EFI AC/DC inputs (both number and text)
    const efiInputs = document.querySelectorAll('input[type="number"], input[type="text"]');
    efiInputs.forEach(input => {
        if (input.name && (input.name.includes('_ac_') || input.name.includes('_dc_'))) {
            // For SPARE EFI (text inputs), clear only if not from loaded data
            if (input.type === 'text') {
                // Check if this is the SPARE EFI
                const row = input.closest('tr');
                const cells = row ? row.querySelectorAll('td') : [];
                const description = cells[2] ? cells[2].textContent.trim() : '';
                const isSpareEfi = description.includes('SPARE');

                if (isSpareEfi && input.dataset.fromLoadedData !== 'true') {
                    input.value = '';
                    input.dataset.lastValidValue = '';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                } else if (!isSpareEfi) {
                    // Regular number inputs
                    if (input.dataset.fromLoadedData !== 'true') {
                        input.value = '';
                        input.dataset.lastValidValue = '';
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            } else if (input.type === 'number') {
                // Regular number inputs
                if (input.dataset.fromLoadedData !== 'true') {
                    input.value = '';
                    input.dataset.lastValidValue = '';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }
    });
}

// ============================================================
// CONFIRMATION WRAPPER
// ============================================================
function clearAllCSUWithConfirm() {
    let confirmMessage = "⚠️ WARNING: This will clear ALL user-entered test data for the CSU Testing Checklist.\n\n";
    confirmMessage += "This includes:\n";
    confirmMessage += "- All user-entered Remote and Supervisory text fields for LBS 1, LBS 2 & LBS 3\n";
    confirmMessage += "- All user-entered AC/DC input values (EFI rows)\n\n";
    confirmMessage += "Note: 'EFI 2 (SPARE)' fields will also be cleared if they were user-entered.\n\n";
    confirmMessage += "This action CANNOT be undone.\n\nAre you sure you want to continue?";

    if (confirm(confirmMessage)) {
        clearAllCSU();
        alert("All user-entered data has been cleared. Loaded data has been preserved.");
    }
}

function clearAll() {
    clearAllCSU();
}

// Function to attach navigation event listeners
function attachNavigationEvents() {
    // Attach to Previous button
    const prevBtn = document.querySelector('button[onclick*="previous"], button[onclick*="Previous"], #prevBtn, .prev-btn');
    if (prevBtn) {
        prevBtn.onclick = null;
        prevBtn.addEventListener('click', goToPreviousPage);
    } else {
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.toLowerCase().includes('previous') ||
                btn.textContent.toLowerCase().includes('back')) {
                btn.onclick = null;
                btn.addEventListener('click', goToPreviousPage);
            }
        });
    }

    // Attach to Next button
    const nextBtn = document.querySelector('button[onclick*="next"], button[onclick*="Next"], #nextBtn, .next-btn');
    if (nextBtn) {
        nextBtn.onclick = null;
        nextBtn.addEventListener('click', goToNext);
    } else {
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.toLowerCase().includes('next') ||
                btn.textContent.toLowerCase().includes('continue')) {
                btn.onclick = null;
                btn.addEventListener('click', goToNext);
            }
        });
    }

    document.body.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
            const onclickAttr = e.target.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes('goToPreviousPage')) {
                e.preventDefault();
                e.target.onclick = null;
                goToPreviousPage();
            } else if (onclickAttr && onclickAttr.includes('goToNext')) {
                e.preventDefault();
                e.target.onclick = null;
                goToNext();
            }
        }
    });
}