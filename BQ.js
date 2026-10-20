let userData = {};
window.diTestResults = {};
window.diModuleTypes = {};
const serialNumberTracker = {
    usedSerials: new Map(),
    checkDuplicate: function(serial) {
        if (!serial) return false;
        return this.usedSerials.has(serial);
    },
    addSerial: function(serial, moduleType, moduleNo) {
        if (serial) this.usedSerials.set(serial, { moduleType, moduleNo });
    },
    getDuplicateLocation: function(serial) {
        const info = this.usedSerials.get(serial);
        return info ? `${info.moduleType} Module ${info.moduleNo}` : null;
    },
    clearAll: function() {
        this.usedSerials.clear();
    }
};

// ==========================================
// FILENAME HELPER — "Contract(Bbatch)" with NO space before "("
// ==========================================
function buildContractWithBatch() {
    const rawContract = localStorage.getItem('session_contractNo') || 'ContractNo';
    const rawBatch = localStorage.getItem('session_Batch_No') || 'BatchNo';
    const cleanContract = String(rawContract).replace(/"/g, '').replace(/[\s\u00A0]+$/g, '').trim() || 'ContractNo';
    const cleanBatch = String(rawBatch).replace(/"/g, '').trim() || 'BatchNo';
    return `${cleanContract}(B${cleanBatch})`;
}
window.buildContractWithBatch = buildContractWithBatch;

function updatePartNumberSummary(moduleSheet) {
    const moduleType = moduleSheet.dataset.moduleType;
    const partNoSelects = moduleSheet.querySelectorAll('select[name$="_part_no"]');
    const summaryElement = moduleSheet.querySelector('.module-type');
    
    if (!summaryElement) return;
    
    const partCounts = {};
    partNoSelects.forEach(select => {
        const partNo = select.value;
        partCounts[partNo] = (partCounts[partNo] || 0) + 1;
    });
    
    const summaryParts = [];
    for (const [partNo, count] of Object.entries(partCounts)) {
        summaryParts.push(`${count}x ${partNo}`);
    }
    
    summaryElement.textContent = summaryParts.join(', ') || 'No parts selected';
}

function autoGenerateSheetsFromData() {
    const sheetsContainer = document.getElementById('sheetsContainer');
    if (!sheetsContainer) return false;
    
    const subrackCount = parseInt(localStorage.getItem('session_subrackCount')) || 0;
    const processorCount = parseInt(localStorage.getItem('session_processorCount')) || 0;
    const powerCount = parseInt(localStorage.getItem('session_powerCount')) || 0;
    const comCount = parseInt(localStorage.getItem('session_comCount')) || 0;
    const diCount = parseInt(localStorage.getItem('session_diCount')) || 0;
    const doCount = parseInt(localStorage.getItem('session_doCount')) || 0;
    const aiCount = parseInt(localStorage.getItem('session_aiCount')) || 0;
    const aoCount = parseInt(localStorage.getItem('session_aoCount')) || 0;
    
    const totalCount = subrackCount + processorCount + powerCount + comCount + diCount + doCount + aiCount + aoCount;
    
    if (totalCount === 0) {
        console.log("No modules to generate");
        return false;
    }
    
    sheetsContainer.innerHTML = "";
    
    if (subrackCount > 0) sheetsContainer.appendChild(createSUBRACKSheet(subrackCount));
    if (processorCount > 0) sheetsContainer.appendChild(createPROCESSORSheet(processorCount));
    if (comCount > 0) sheetsContainer.appendChild(createCOMSheet(comCount));
    if (diCount > 0) sheetsContainer.appendChild(createDISheet(diCount));
    if (doCount > 0) sheetsContainer.appendChild(createDOSheet(doCount));
    if (aiCount > 0) sheetsContainer.appendChild(createAISheet(aiCount));
    if (aoCount > 0) sheetsContainer.appendChild(createAOSheet(aoCount));
    if (powerCount > 0) sheetsContainer.appendChild(createPOWERSheet(powerCount));
    
    const checkerNameSection = document.getElementById('checkerNameSection');
    if (checkerNameSection) checkerNameSection.style.display = 'block';
    
    const vendorNumberSection = document.getElementById('vendorNumberSection');
    if (vendorNumberSection) vendorNumberSection.style.display = 'block';
    
    const vendorNumberInput = document.getElementById('vendorNumber');
    if (vendorNumberInput) {
        vendorNumberInput.disabled = true;
        vendorNumberInput.style.backgroundColor = '#f0f0f0';
        vendorNumberInput.style.cursor = 'not-allowed';
    }
    
    const supplierNameInput = document.getElementById('supplierName');
    if (supplierNameInput) {
        supplierNameInput.disabled = true;
        supplierNameInput.style.backgroundColor = '#f0f0f0';
        supplierNameInput.style.cursor = 'not-allowed';
    }
    
    return true;
}

function enableFieldsForEditing() {
    document.querySelectorAll('select[name$="_part_no"], input[name$="_subrack"], input[name$="_slot"]').forEach(el => {
        el.disabled = false;
        el.style.backgroundColor = '';
        el.style.cursor = '';
    });
    
    const indicator = document.getElementById('dataLoadedIndicator');
    if (indicator) {
        indicator.classList.remove('show');
    }
    
    showCustomAlert('Module fields are now editable. Click "Generate Sheets" to update changes.');
}

function restoreModuleData() {
    const sheets = document.querySelectorAll('#sheetsContainer .module-sheet');
    let hasData = false;
    
    sheets.forEach(sheet => {
        const moduleType = sheet.dataset.moduleType;
        const rows = sheet.querySelectorAll('tbody tr');
        const savedDetails = localStorage.getItem(`${moduleType.toLowerCase()}ModulesDetails`);
        
        if (!savedDetails) return;
        
        try {
            const savedData = JSON.parse(savedDetails);
            
            rows.forEach((row, index) => {
                if (index < savedData.length) {
                    const data = savedData[index];
                    if (!data) return;
                    
                    const partNoSelect = row.querySelector('select[name$="_part_no"]');
                    if (partNoSelect && data.partNo) {
                        partNoSelect.value = data.partNo;
                        partNoSelect.disabled = true;
                    }
                    
                    const subrackInput = row.querySelector('input[name$="_subrack"]');
                    if (subrackInput && data.subrack !== undefined && data.subrack !== null) {
                        subrackInput.value = data.subrack;
                        subrackInput.disabled = true;
                    }
                    
                    const slotInput = row.querySelector('input[name$="_slot"]');
                    if (slotInput && data.slot !== undefined && data.slot !== null) {
                        slotInput.value = data.slot;
                        slotInput.disabled = true;
                    }
                    
                    const serialInput = row.querySelector('input[name$="_serial"]');
                    if (serialInput && data.serial) {
                        serialInput.value = data.serial;
                        serialInput.disabled = false;
                    }
                    
                    hasData = true;
                }
            });
            
            updatePartNumberSummary(sheet);
            
        } catch (e) {
            console.error(`Error restoring ${moduleType} data:`, e);
        }
    });
    
    const checkerNameInput = document.getElementById('checkerName');
    if (checkerNameInput) {
        const savedCheckerName = localStorage.getItem('session_checkerName');
        if (savedCheckerName) {
            checkerNameInput.value = savedCheckerName;
        }
        checkerNameInput.disabled = false;
    }
    
    const vendorNumberInput = document.getElementById('vendorNumber');
    if (vendorNumberInput) {
        const savedVendorNumber = localStorage.getItem('session_vendorNumber');
        if (savedVendorNumber) {
            vendorNumberInput.value = savedVendorNumber;
        }
        vendorNumberInput.disabled = true;
        vendorNumberInput.style.backgroundColor = '#f0f0f0';
        vendorNumberInput.style.cursor = 'not-allowed';
    }
    
    const supplierNameInput = document.getElementById('supplierName');
    if (supplierNameInput) {
        const savedSupplierName = localStorage.getItem('session_supplierName');
        if (savedSupplierName) {
            supplierNameInput.value = savedSupplierName;
        }
        supplierNameInput.disabled = true;
        supplierNameInput.style.backgroundColor = '#f0f0f0';
        supplierNameInput.style.cursor = 'not-allowed';
    }
    
    if (hasData) {
        const indicator = document.getElementById('dataLoadedIndicator');
        if (indicator) {
            indicator.classList.add('show');
        }
    }
    
    return hasData;
}

function createModuleSheetBase(count, moduleType, partNumbers) {
    const container = document.createElement('div');
    container.className = 'module-sheet';
    container.dataset.moduleType = moduleType;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'sheet-header';
    const h3 = document.createElement('h3');
    h3.textContent = `${moduleType.toUpperCase()} Modules (${count})`;
    const label = document.createElement('span');
    label.className = `module-type ${moduleType.toLowerCase()}`;
    label.textContent = moduleType.toUpperCase();
    headerDiv.appendChild(h3);
    headerDiv.appendChild(label);
    container.appendChild(headerDiv);
    
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    ['Module No.', 'Part Number', 'Subrack No.', 'Slot No.', 'Serial No.'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    for (let i = 1; i <= count; i++) {
        const row = document.createElement('tr');
        
        row.insertCell().textContent = i;
        
        const cellPartNo = row.insertCell();
        const partNoSelect = document.createElement('select');
        partNoSelect.name = `${moduleType.toLowerCase()}_${i}_part_no`;
        partNoSelect.required = true;
        partNoSelect.style.backgroundColor = '#f0f0f0';
        partNoSelect.style.cursor = 'not-allowed';
        partNoSelect.disabled = true;
        
        const placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        placeholderOption.textContent = "-- Select Part --";
        placeholderOption.disabled = true;
        partNoSelect.appendChild(placeholderOption);

        partNumbers.forEach(part => {
            const option = document.createElement('option');
            option.value = part;
            option.textContent = part;
            partNoSelect.appendChild(option);
        });
        if (partNumbers.length > 0) partNoSelect.value = partNumbers[0];
        cellPartNo.appendChild(partNoSelect);

        const subrackCell = row.insertCell();
        const subrackInput = document.createElement('input');
        subrackInput.type = 'number';
        subrackInput.name = `${moduleType.toLowerCase()}_${i}_subrack`;
        subrackInput.placeholder = 'Enter subrack';
        subrackInput.required = true;
        subrackInput.style.backgroundColor = '#f0f0f0';
        subrackInput.style.cursor = 'not-allowed';
        subrackInput.disabled = true;
        subrackCell.appendChild(subrackInput);

        const slotCell = row.insertCell();
        const slotInput = document.createElement('input');
        slotInput.type = 'number';
        slotInput.name = `${moduleType.toLowerCase()}_${i}_slot`;
        slotInput.placeholder = 'Enter slot';
        slotInput.required = true;
        slotInput.style.backgroundColor = '#f0f0f0';
        slotInput.style.cursor = 'not-allowed';
        slotInput.disabled = true;

        if (['Subrack', 'Power', 'Processor'].includes(moduleType)) {
            slotInput.value = '0';
        }
        slotCell.appendChild(slotInput);

        const serialCell = row.insertCell();
        const serialInput = document.createElement('input');
        serialInput.type = 'text';
        serialInput.name = `${moduleType.toLowerCase()}_${i}_serial`;
        serialInput.placeholder = 'Enter 12-digit serial';
        serialInput.required = true;
        serialInput.setAttribute('maxlength', '12');
        serialInput.setAttribute('pattern', '\\d{12}');
        serialInput.setAttribute('inputmode', 'numeric');
        serialInput.style.padding = '8px';
        serialInput.style.width = '140px';
        serialInput.disabled = false;
        serialCell.appendChild(serialInput);

        tbody.appendChild(row);
    }
    table.appendChild(tbody);
    container.appendChild(table);
    
    return container;
}

function createSUBRACKSheet(count) { return createModuleSheetBase(count, 'Subrack', [' Subrack 19"', 'Subrack 2/3 19"', 'Subrack 1/2 19"']); }
function createPROCESSORSheet(count) { return createModuleSheetBase(count, 'Processor', ['MCU-1-A', 'MCU-4-A']); }
function createPOWERSheet(count) { return createModuleSheetBase(count, 'Power', ['POWER-24V-A', 'POWER-110/220V']); }
function createCOMSheet(count) { return createModuleSheetBase(count, 'COM', ['COM-6-A']); }
function createDISheet(count) { return createModuleSheetBase(count, 'DI', ['DI-32-24V', 'DI-16-24V-A']); }
function createDOSheet(count) { return createModuleSheetBase(count, 'DO', ['CO-16-A', 'CO-8-A']); }
function createAISheet(count) { return createModuleSheetBase(count, 'AI', ['DCAI-8-A']); }
function createAOSheet(count) { return createModuleSheetBase(count, 'AO', ['AO-2']); }

async function goToNext(returnOnly = false) {
    if (typeof validateAllModuleFields === 'function') {
        if (!validateAllModuleFields()) {
            if (returnOnly) return null;
            return;
        }
    }

    if (!window.diModuleTypes) window.diModuleTypes = {};
    if (!window.doModuleTypes) window.doModuleTypes = {};
    
    const checkerName = document.getElementById('checkerName')?.value || '';
    const vendorNumber = document.getElementById('vendorNumber')?.value || '';
    const supplierName = document.getElementById('supplierName')?.value || '';

    localStorage.setItem('checkerName', checkerName);
    localStorage.setItem('vendorNumber', vendorNumber);
    localStorage.setItem('session_checkerName', checkerName);
    localStorage.setItem('session_vendorNumber', vendorNumber);
    localStorage.setItem('session_supplierName', supplierName);
    localStorage.setItem('supplierName', supplierName);

    const processorCount = parseInt(document.getElementById('processorCount').value) || 0;
    const powerCount = parseInt(document.getElementById('powerCount').value) || 0;
    const diCount = parseInt(document.getElementById('diCount').value) || 0;
    const doCount = parseInt(document.getElementById('doCount').value) || 0;
    const aiCount = parseInt(document.getElementById('aiCount').value) || 0;
    const comCount = parseInt(document.getElementById('comCount').value) || 0;
    const aoCount = parseInt(document.getElementById('aoCount')?.value) || 0;

    const extractRowData = (rows) => {
        const data = [];
        rows.forEach(row => {
            data.push({
                partNo: row.querySelector('select[name$="_part_no"]')?.value,
                subrack: row.querySelector('input[name$="_subrack"]')?.value,
                slot: row.querySelector('input[name$="_slot"]')?.value,
                serial: row.querySelector('input[name$="_serial"]')?.value
            });
        });
        return data;
    };

    const processorModulesData = extractRowData(document.querySelectorAll('.module-sheet[data-module-type="Processor"] tbody tr'));
    localStorage.setItem('processorModulesDetails', JSON.stringify(processorModulesData));
    
    const powerModulesData = extractRowData(document.querySelectorAll('.module-sheet[data-module-type="Power"] tbody tr'));
    localStorage.setItem('powerModulesDetails', JSON.stringify(powerModulesData));

    const subrackModulesData = extractRowData(document.querySelectorAll('.module-sheet[data-module-type="Subrack"] tbody tr'));
    localStorage.setItem('subrackModulesDetails', JSON.stringify(subrackModulesData));

    const comModulesData = extractRowData(document.querySelectorAll('.module-sheet[data-module-type="COM"] tbody tr'));
    localStorage.setItem('comModulesDetails', JSON.stringify(comModulesData));
    
    const diModulesData = [];
    document.querySelectorAll('.module-sheet[data-module-type="DI"] tbody tr').forEach((row, index) => {
        const partNo = row.querySelector('select[name$="_part_no"]')?.value;
        let moduleType = 'DI-32'; 
        if (partNo && partNo.includes('DI-16')) moduleType = 'DI-16';
        
        window.diModuleTypes[index + 1] = moduleType;
        diModulesData.push({
            partNo: partNo,
            subrack: row.querySelector('input[name$="_subrack"]')?.value,
            slot: row.querySelector('input[name$="_slot"]')?.value,
            serial: row.querySelector('input[name$="_serial"]')?.value,
            type: moduleType
        });
    });
    localStorage.setItem('diModuleTypes', JSON.stringify(window.diModuleTypes));
    
    const doModulesData = [];
    document.querySelectorAll('.module-sheet[data-module-type="DO"] tbody tr').forEach((row, index) => {
        const partNo = row.querySelector('select[name$="_part_no"]')?.value;
        let moduleType = 'CO-16-A';
        if (partNo && partNo.includes('CO-8')) moduleType = 'CO-8-A';
        
        window.doModuleTypes[index + 1] = moduleType;
        doModulesData.push({
            partNo: partNo,
            subrack: row.querySelector('input[name$="_subrack"]')?.value,
            slot: row.querySelector('input[name$="_slot"]')?.value,
            serial: row.querySelector('input[name$="_serial"]')?.value,
            type: moduleType
        });
    });
    localStorage.setItem('doModuleTypes', JSON.stringify(window.doModuleTypes));

    const aiModulesData = extractRowData(document.querySelectorAll('.module-sheet[data-module-type="AI"] tbody tr'));
    const aoModulesData = extractRowData(document.querySelectorAll('.module-sheet[data-module-type="AO"] tbody tr'));
    localStorage.setItem('aoModulesDetails', JSON.stringify(aoModulesData));

    localStorage.setItem('diModulesToTest', diCount);
    localStorage.setItem('doModulesToTest', doCount);
    localStorage.setItem('aiModulesToTest', aiCount);
    localStorage.setItem('processorCount', processorCount);
    localStorage.setItem('powerCount', powerCount);
    localStorage.setItem('diModulesDetails', JSON.stringify(diModulesData));
    localStorage.setItem('doModulesDetails', JSON.stringify(doModulesData));
    localStorage.setItem('aiModulesDetails', JSON.stringify(aiModulesData));
    localStorage.setItem('currentDIModule', 1);
    localStorage.setItem('currentDOModule', 1);
    localStorage.setItem('currentAIModule', 1);
    localStorage.setItem('comCount', comCount);
    localStorage.setItem('aoModulesToTest', aoCount);

    const exportData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
            exportData[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
            exportData[key] = localStorage.getItem(key);
        }
    }
    
    const now = new Date();
    const dateformat = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const contractWithBatch = buildContractWithBatch();
    const contractNo = localStorage.getItem('session_contractNo') || 'ContractNo';
    const rtuSerial = (localStorage.getItem('session_rtuSerial') || 'SerialNo').replace(/"/g, '').trim() || 'SerialNo';
    
    exportData.metadata = {
        generationDate: now.toISOString(),
        rtuSerial: rtuSerial,
        contractNo: contractNo,
        Batch_No: localStorage.getItem('session_Batch_No') || 'N/A',
        testerName: localStorage.getItem('session_name') || 'N/A'
    };

    if (returnOnly) {
        try {
            let txtContent = '';
            if (typeof generateTXTContent === 'function') {
                txtContent = generateTXTContent();
            }
            
            let pdfResult = null;
            if (typeof generateAndDownloadPDF === 'function') {
                pdfResult = await generateAndDownloadPDF(contractWithBatch, rtuSerial, true);
            }
            
            return {
                jsonData: JSON.stringify(exportData, null, 2),
                txtContent: txtContent,
                pdfBlob: pdfResult
            };
        } catch (error) {
            console.error('Error in returnOnly mode:', error);
            return null;
        }
    }
    
    try {
        showCustomAlert('Saving and Generating Backup Files...');

        let txtContent = '';
        if (typeof generateTXTContent === 'function') {
            txtContent = generateTXTContent();
            
            if (typeof generateAndDownloadQRCode === 'function' && txtContent) {
                await generateAndDownloadQRCode(txtContent, dateformat, contractWithBatch, rtuSerial);
            }
        }

        if (typeof generateAndDownloadPDF === 'function') {
            await generateAndDownloadPDF(contractWithBatch, rtuSerial, false);
        }

    } catch (error) {
        console.error('Export Warning:', error);
    }

    if (window.navigationGuard && typeof window.navigationGuard.markPageAsCompleted === 'function') {
        window.navigationGuard.markPageAsCompleted();
    }
    
    setTimeout(() => {
        window.location.href = './Pre-requisite.html';
    }, 1500);
}

function validateAllModuleFields() {
    const sheets = document.querySelectorAll('#sheetsContainer .module-sheet');
    if (sheets.length === 0) {
        showCustomAlert('Please generate sheets first by clicking "Generate Sheets" button.');
        return false;
    }
    
    serialNumberTracker.clearAll();
    let duplicateDetails = [];
    
    document.querySelectorAll('input[name$="_serial"], input[required]').forEach(input => {
        input.style.border = '';
        input.style.backgroundColor = '';
        input.classList.remove('duplicate-serial', 'missing-serial');
        input.title = '';
    });

    const serialMap = new Map();
    let missingSerialFound = false;
    let firstMissingSerial = null;
    
    for (const sheet of sheets) {
        const tableRows = sheet.querySelectorAll('tbody tr');
        const moduleType = sheet.dataset.moduleType;

        for (let i = 0; i < tableRows.length; i++) {
            const row = tableRows[i];
            const moduleNo = i + 1;
            
            const partNoSelect = row.querySelector('select');
            if (!partNoSelect?.value) {
                showCustomAlert(`Please select Part Number for ${moduleType} Module ${moduleNo}`);
                partNoSelect?.focus();
                return false;
            }

            const inputs = row.querySelectorAll('input[required]:not([name$="_serial"])');
            for (const input of inputs) {
                const value = input.value.trim();

                let fieldName = 'Field';
                if (input.name.includes('_subrack')) fieldName = 'Subrack No.';
                else if (input.name.includes('_slot')) fieldName = 'Slot No.';

                if (!value) {
                    showCustomAlert(`Please fill in ${fieldName} for ${moduleType} Module ${moduleNo}`);
                    input.style.border = '2px solid red';
                    input.focus();
                    return false;
                }

                if (input.name.includes('_slot')) {
                    const nonZeroModules = ['COM', 'DI', 'DO', 'AI', 'AO'];
                    if (nonZeroModules.includes(moduleType) && value === '0') {
                        showCustomAlert(`Slot No. cannot be "0" for ${moduleType} Module ${moduleNo}. Please enter a valid slot number.`);
                        input.style.border = '2px solid red';
                        input.focus();
                        return false;
                    } else {
                        input.style.border = '';
                    }
                }
            }
            
            const serialInput = row.querySelector('input[name$="_serial"]');
            const serialValue = serialInput?.value.trim();
            
            if (!serialValue) {
                serialInput.style.border = '2px solid red';
                serialInput.style.backgroundColor = '#fff0f0';
                serialInput.classList.add('missing-serial');
                serialInput.title = 'Serial number is required';
                
                missingSerialFound = true;
                if (!firstMissingSerial) {
                    firstMissingSerial = serialInput;
                }
                continue;
            }
            
            if (!/^\d{12}$/.test(serialValue)) {
                serialInput.style.border = '2px solid red';
                serialInput.style.backgroundColor = '#fff0f0';
                showCustomAlert(`Serial Number for ${moduleType} Module ${moduleNo} must be exactly 12 digits.`);
                serialInput.focus();
                return false;
            }
            
            const location = `${moduleType} Module ${moduleNo}`;
            
            if (!serialMap.has(serialValue)) {
                serialMap.set(serialValue, []);
            }
            serialMap.get(serialValue).push({
                element: serialInput,
                location: location,
                moduleType: moduleType,
                moduleNo: moduleNo
            });
        }
    }

    if (missingSerialFound) {
        showCustomAlert('Please fill in all Serial Number fields.');
        if (firstMissingSerial) {
            firstMissingSerial.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstMissingSerial.focus();
        }
        return false;
    }

    let duplicateFound = false;
    serialMap.forEach((occurrences, serial) => {
        if (occurrences.length > 1) {
            duplicateFound = true;
            
            occurrences.forEach(occ => {
                serialNumberTracker.addSerial(serial, occ.moduleType, occ.moduleNo);
            });
            
            occurrences.forEach(occ => {
                occ.element.style.border = '3px solid red';
                occ.element.style.backgroundColor = '#ffeeee';
                occ.element.classList.add('duplicate-serial');
                
                const otherLocations = occurrences
                    .filter(o => o !== occ)
                    .map(o => o.location)
                    .join(', ');
                
                occ.element.title = `⚠️ DUPLICATE! Also used in: ${otherLocations}`;
            });
            
            for (let i = 0; i < occurrences.length; i++) {
                for (let j = i + 1; j < occurrences.length; j++) {
                    duplicateDetails.push({
                        serial: serial,
                        location1: occurrences[i].location,
                        location2: occurrences[j].location
                    });
                }
            }
        } else {
            serialNumberTracker.addSerial(serial, occurrences[0].moduleType, occurrences[0].moduleNo);
            occurrences[0].element.style.border = '2px solid green';
            occurrences[0].element.style.backgroundColor = '#f0fff0';
            occurrences[0].element.title = 'Valid unique serial';
        }
    });

    if (duplicateDetails.length > 0) {
        const groupedMessages = [];
        const serialGroups = {};
        
        duplicateDetails.forEach(d => {
            if (!serialGroups[d.serial]) {
                serialGroups[d.serial] = new Set();
            }
            serialGroups[d.serial].add(d.location1);
            serialGroups[d.serial].add(d.location2);
        });
        
        Object.keys(serialGroups).forEach(serial => {
            const locations = Array.from(serialGroups[serial]);
            groupedMessages.push(`• Serial '${serial}' appears in: ${locations.join(', ')}`);
        });
        
        showCustomAlert(
            `⚠️ DUPLICATE SERIAL NUMBERS FOUND ⚠️\n\n` +
            `${groupedMessages.join('\n')}\n\n` +
            `Please correct the highlighted fields.`
        );
        
        const firstDuplicate = document.querySelector('.duplicate-serial');
        if (firstDuplicate) {
            firstDuplicate.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstDuplicate.focus();
        }
        
        return false;
    }

    const checkerNameInput = document.getElementById('checkerName');
    if (checkerNameInput && checkerNameInput.style.display !== 'none') {
        const checkerName = checkerNameInput.value.trim();
        if (!checkerName) {
            showCustomAlert('Please enter Serial Number Checker\'s Name.');
            checkerNameInput.style.border = '2px solid red';
            checkerNameInput.focus();
            return false;
        } else {
            checkerNameInput.style.border = '';
        }
    }

    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const backBtn = document.getElementById('backBtn');
    const submitBtn = document.getElementById('submitBtn');
    const sheetsContainer = document.getElementById('sheetsContainer');
    
    function saveBQDetails(diCount, diModulesData) {
        localStorage.setItem('diModulesToTest', diCount);
        localStorage.setItem('currentDIModule', 1);
        localStorage.setItem('diModulesDetails', JSON.stringify(diModulesData));
    }

    const formTiming = {
        loginTime: null,
        generationStartTime: null,
        pdfGeneratedTime: null,
        getFormFillingTime: function() {
            if (!this.loginTime || !this.generationStartTime) return null;
            return (this.generationStartTime - this.loginTime) / 1000;
        }
    };

    const logoElement = document.getElementById("logo");
    if (logoElement) {
        logoElement.addEventListener("click", () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    function loadUserData() {
        const nameInput = document.getElementById('name');
        const designationInput = document.getElementById('designation');
        const experienceInput = document.getElementById('experience');
        formTiming.loginTime = new Date();

        if (nameInput) nameInput.value = localStorage.getItem('session_name') || '';
        if (designationInput) designationInput.value = localStorage.getItem('session_designation') || '';
        if (experienceInput) experienceInput.value = localStorage.getItem('session_experience') || '';

        const sessionUsername = localStorage.getItem('session_username');
        const sessionRtuSerial = localStorage.getItem('session_rtuSerial');
        const sessionName = localStorage.getItem('session_name');
        const sessionDesignation = localStorage.getItem('session_designation');
        const sessionExperience = localStorage.getItem('session_experience');
        const sessionContractNo = localStorage.getItem('session_contractNo');

        userData = {
            username: sessionUsername,
            rtuSerial: sessionRtuSerial,
            name: sessionName || 'N/A',
            designation: sessionDesignation || 'N/A',
            experience: sessionExperience || '0',
            contractNo: sessionContractNo || 'N/A'
        };
        console.log("User data loaded:", userData);
        return true;
    }

    function showCustomAlert(message) {
        const existingAlert = document.getElementById('customAlertBox');
        if (existingAlert) existingAlert.remove();
        const messageBox = document.createElement('div');
        messageBox.id = 'customAlertBox';
        messageBox.textContent = message;
        messageBox.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index:1001; text-align: center; max-width: 90%;";
        document.body.appendChild(messageBox);
        setTimeout(() => messageBox.remove(), 4000);
    }
    window.showCustomAlert = showCustomAlert;

    function saveCurrentBQCounts() {
        const subrackCountInput = document.getElementById('subrackCount');
        const processorCountInput = document.getElementById('processorCount');
        const powerCountInput = document.getElementById('powerCount');
        const comCountInput = document.getElementById('comCount');
        const diCountInput = document.getElementById('diCount');
        const doCountInput = document.getElementById('doCount');
        const aiCountInput = document.getElementById('aiCount');
        const aoCountInput = document.getElementById('aoCount');
        
        if (subrackCountInput) localStorage.setItem('session_subrackCount', subrackCountInput.value);
        if (processorCountInput) localStorage.setItem('session_processorCount', processorCountInput.value);
        if (powerCountInput) localStorage.setItem('session_powerCount', powerCountInput.value);
        if (comCountInput) localStorage.setItem('session_comCount', comCountInput.value);
        if (diCountInput) localStorage.setItem('session_diCount', diCountInput.value);
        if (doCountInput) localStorage.setItem('session_doCount', doCountInput.value);
        if (aiCountInput) localStorage.setItem('session_aiCount', aiCountInput.value);
        if (aoCountInput) localStorage.setItem('session_aoCount', aoCountInput.value);
        
        const checkerNameInput = document.getElementById('checkerName');
        if (checkerNameInput) {
            localStorage.setItem('session_checkerName', checkerNameInput.value);
        }
        
        const vendorNumberInput = document.getElementById('vendorNumber');
        if (vendorNumberInput) {
            localStorage.setItem('session_vendorNumber', vendorNumberInput.value);
        }
        const supplierNameInput = document.getElementById('supplierName');
        if (supplierNameInput) {
            localStorage.setItem('session_supplierName', supplierNameInput.value);
        }

        const moduleData = gatherAllModuleData();
        localStorage.setItem('currentModuleData', JSON.stringify(moduleData));
    }

    function loadBQCounts() {
        const subrackCountInput = document.getElementById('subrackCount');
        const processorCountInput = document.getElementById('processorCount');
        const powerCountInput = document.getElementById('powerCount');
        const comCountInput = document.getElementById('comCount');
        const diCountInput = document.getElementById('diCount');
        const doCountInput = document.getElementById('doCount');
        const aiCountInput = document.getElementById('aiCount');
        const aoCountInput = document.getElementById('aoCount');

        const getParsedValue = (key) => {
            const value = localStorage.getItem(key);
            if (value === null) return '0';
            try {
                const parsed = JSON.parse(value);
                return String(parsed);
            } catch (e) {
                return value.replace(/"/g, '');
            }
        };

        if (subrackCountInput) subrackCountInput.value = getParsedValue('session_subrackCount');
        if (processorCountInput) processorCountInput.value = getParsedValue('session_processorCount');
        if (powerCountInput) powerCountInput.value = getParsedValue('session_powerCount');
        if (comCountInput) comCountInput.value = getParsedValue('session_comCount');
        if (diCountInput) diCountInput.value = getParsedValue('session_diCount');
        if (doCountInput) doCountInput.value = getParsedValue('session_doCount');
        if (aiCountInput) aiCountInput.value = getParsedValue('session_aiCount');
        if (aoCountInput) aoCountInput.value = getParsedValue('session_aoCount');
    }

    if (!loadUserData()) {
        return;
    }
    loadBQCounts();

    setTimeout(() => {
        const sheetsGenerated = autoGenerateSheetsFromData();
        if (sheetsGenerated) {
            const dataLoaded = restoreModuleData();
            if (dataLoaded) {
                console.log('Data loaded and fields disabled successfully');
                setTimeout(() => highlightDuplicateSerials(), 500);
            }
        }
    }, 300);

    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            serialNumberTracker.clearAll();
            
            document.querySelectorAll('input[name$="_serial"]').forEach(input => {
                input.style.border = '';
                input.style.backgroundColor = '';
                input.classList.remove('duplicate-serial');
                input.title = '';
            });
            
            saveCurrentBQCounts();
            const subrackCount = parseInt(document.getElementById('subrackCount')?.value) || 0;
            const processorCount = parseInt(document.getElementById('processorCount')?.value) || 0;
            const powerCount = parseInt(document.getElementById('powerCount')?.value) || 0;
            const comCount = parseInt(document.getElementById('comCount')?.value) || 0;
            const diCount = parseInt(document.getElementById('diCount')?.value) || 0;
            const doCount = parseInt(document.getElementById('doCount')?.value) || 0;
            const aiCount = parseInt(document.getElementById('aiCount')?.value) || 0;
            const aoCount = parseInt(document.getElementById('aoCount')?.value) || 0;
            
            const totalCount = subrackCount + processorCount + powerCount + comCount + diCount + doCount + aiCount + aoCount;
            
            if (totalCount === 0) {
                showCustomAlert('Please enter at least one module count to generate sheets.');
                return;
            }
            
            const allCurrentData = {};
            document.querySelectorAll('.module-sheet').forEach(sheet => {
                const moduleType = sheet.dataset.moduleType;
                const rows = sheet.querySelectorAll('tbody tr');
                const moduleData = [];
                
                rows.forEach((row, index) => {
                    moduleData.push({
                        partNo: row.querySelector('select[name$="_part_no"]')?.value,
                        subrack: row.querySelector('input[name$="_subrack"]')?.value,
                        slot: row.querySelector('input[name$="_slot"]')?.value,
                        serial: row.querySelector('input[name$="_serial"]')?.value
                    });
                });
                
                allCurrentData[moduleType] = moduleData;
            });
            
            if (sheetsContainer) sheetsContainer.innerHTML = "";
            
            if (subrackCount > 0 && sheetsContainer) sheetsContainer.appendChild(createSUBRACKSheet(subrackCount));
            if (processorCount > 0 && sheetsContainer) sheetsContainer.appendChild(createPROCESSORSheet(processorCount));
            if (comCount > 0 && sheetsContainer) sheetsContainer.appendChild(createCOMSheet(comCount));
            if (diCount > 0 && sheetsContainer) sheetsContainer.appendChild(createDISheet(diCount));
            if (doCount > 0 && sheetsContainer) sheetsContainer.appendChild(createDOSheet(doCount));
            if (aiCount > 0 && sheetsContainer) sheetsContainer.appendChild(createAISheet(aiCount));
            if (aoCount > 0 && sheetsContainer) sheetsContainer.appendChild(createAOSheet(aoCount));
            if (powerCount > 0 && sheetsContainer) sheetsContainer.appendChild(createPOWERSheet(powerCount));
       
            const checkerNameSection = document.getElementById('checkerNameSection');
            if (checkerNameSection) {
                checkerNameSection.style.display = 'block';
            }
            
            const vendorNumberSection = document.getElementById('vendorNumberSection');
            if (vendorNumberSection) {
                vendorNumberSection.style.display = 'block';
            }

            const vendorNumberInput = document.getElementById('vendorNumber');
            if (vendorNumberInput) {
                vendorNumberInput.disabled = true;
                vendorNumberInput.style.backgroundColor = '#f0f0f0';
                vendorNumberInput.style.cursor = 'not-allowed';
            }

            const supplierNameInput = document.getElementById('supplierName');
            if (supplierNameInput) {
                supplierNameInput.disabled = true;
                supplierNameInput.style.backgroundColor = '#f0f0f0';
                supplierNameInput.style.cursor = 'not-allowed';
            }
            
            document.querySelectorAll('.module-sheet').forEach(sheet => {
                const moduleType = sheet.dataset.moduleType;
                const rows = sheet.querySelectorAll('tbody tr');
                
                if (allCurrentData[moduleType]) {
                    rows.forEach((row, index) => {
                        if (index < allCurrentData[moduleType].length) {
                            const data = allCurrentData[moduleType][index];
                            if (!data) return;
                            
                            const partNoSelect = row.querySelector('select[name$="_part_no"]');
                            if (partNoSelect && data.partNo) {
                                partNoSelect.value = data.partNo;
                                partNoSelect.disabled = true;
                            }
                            
                            const subrackInput = row.querySelector('input[name$="_subrack"]');
                            if (subrackInput && data.subrack) {
                                subrackInput.value = data.subrack;
                                subrackInput.disabled = true;
                            }
                            
                            const slotInput = row.querySelector('input[name$="_slot"]');
                            if (slotInput && data.slot) {
                                slotInput.value = data.slot;
                                slotInput.disabled = true;
                            }
                            
                            const serialInput = row.querySelector('input[name$="_serial"]');
                            if (serialInput && data.serial) {
                                serialInput.value = data.serial;
                            }
                        }
                    });
                }
                updatePartNumberSummary(sheet);
            });
            
            setupSerialNumberHandling();
            setTimeout(() => highlightDuplicateSerials(), 200);
        });
    }

    if (sheetsContainer) {
        sheetsContainer.addEventListener('change', function(event) {
            if (event.target && event.target.matches('select[name$="_part_no"]')) {
                const moduleSheet = event.target.closest('.module-sheet');
                if (moduleSheet) {
                    updatePartNumberSummary(moduleSheet);
                }
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            serialNumberTracker.clearAll();
            
            document.querySelectorAll('input[name$="_serial"]').forEach(input => {
                input.style.border = '';
                input.style.backgroundColor = '';
                input.classList.remove('duplicate-serial');
                input.title = '';
            });
            
            if (sheetsContainer) sheetsContainer.innerHTML = "";
            ['diCount','doCount','aiCount','aoCount', 'subrackCount', 'processorCount', 'powerCount', 'comCount'].forEach(id => {
                const inputEl = document.getElementById(id);
                if (inputEl) inputEl.value = '0';
            });
            saveCurrentBQCounts();
            
            const checkerNameSection = document.getElementById('checkerNameSection');
            if (checkerNameSection) {
                checkerNameSection.style.display = 'none';
            }
            
            const vendorNumberSection = document.getElementById('vendorNumberSection');
            if (vendorNumberSection) {
                vendorNumberSection.style.display = 'none';
            }
            
            const indicator = document.getElementById('dataLoadedIndicator');
            if (indicator) {
                indicator.classList.remove('show');
            }
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', function() {
            saveCurrentBQCounts();
            window.location.href = './rtudetail.html';
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', async function() {
            saveCurrentBQCounts();
            formTiming.generationStartTime = new Date();

            const totalModules = ['diCount', 'doCount', 'aiCount', 'aoCount', 'subrackCount', 'processorCount', 'powerCount', 'comCount']
                .reduce((sum, id) => sum + (parseInt(document.getElementById(id)?.value) || 0), 0);

            if (totalModules === 0) {
                showCustomAlert("Please enter module quantities and generate sheets before submitting.");
                return;
            }
            if (!userData || !userData.rtuSerial) {
                showCustomAlert("User data is missing. Cannot generate report. Please log in again.");
                return;
            }
            if (!sheetsContainer || sheetsContainer.children.length === 0) {
                showCustomAlert("Please click 'Generate Sheets' first to create the forms for your modules.");
                return;
            }
            if (!validateAllModuleFields()) {
                return; 
            }
            
            if (typeof goToNextWithDriveUpload === 'function' && 
                typeof uploadToDrive !== 'undefined') {
                await goToNextWithDriveUpload();
            } else {
                window.goToNext();
            }
        });
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async function() {
            const serialInputs = document.querySelectorAll('input[name$="_serial"]');
            
            for (const input of serialInputs) {
                const serialValue = input.value.trim();
                if (!/^\d{12}$/.test(serialValue)) {
                    input.style.border = '2px solid red';
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    input.focus();
                    showCustomAlert('Export Blocked: Found a serial number that is not exactly 12 digits. Please correct the highlighted field.');
                    return; 
                } else {
                    input.style.border = '';
                }
            }
            
            const duplicateCheck = highlightDuplicateSerials();
            if (duplicateCheck) {
                showCustomAlert('Export Blocked: Duplicate serial numbers found. Please correct the highlighted fields.');
                return;
            }

            try {
                const exportData = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    try {
                        exportData[key] = JSON.parse(localStorage.getItem(key));
                    } catch (e) {
                        exportData[key] = localStorage.getItem(key);
                    }
                }
                
                const moduleData = gatherAllModuleData();
                exportData.currentModuleData = moduleData;
                
                exportData.metadata = {
                    generationDate: new Date().toISOString(),
                    rtuSerial: localStorage.getItem('session_rtuSerial') || 'N/A',
                    contractNo: localStorage.getItem('session_contractNo') || 'N/A',
                    Batch_No: localStorage.getItem('session_Batch_No') || 'N/A',
                    testerName: localStorage.getItem('session_name') || 'N/A'
                };
                
                const now = new Date();
                const dateformat = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
                const contractWithBatch = buildContractWithBatch();
                const rtuSerial = (localStorage.getItem('session_rtuSerial') || 'SerialNo').replace(/"/g, '').trim() || 'SerialNo';
                
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                const exportFileDefaultName = `${dateformat}_BQ_BACKUP_${contractWithBatch}_${rtuSerial}.json`;
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                document.body.appendChild(linkElement);
                linkElement.click();
                document.body.removeChild(linkElement);
                
                const txtContent = generateTXTContent();
                const txtDataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(txtContent);
                const txtFileName = `${dateformat}_QR_TXT_${contractWithBatch}_${rtuSerial}.txt`;
                
                const txtLinkElement = document.createElement('a');
                txtLinkElement.setAttribute('href', txtDataUri);
                txtLinkElement.setAttribute('download', txtFileName);
                document.body.appendChild(txtLinkElement);
                txtLinkElement.click();
                document.body.removeChild(txtLinkElement);
                
                setTimeout(async () => {
                    const qrSuccess = await generateAndDownloadQRCode(txtContent, dateformat, contractWithBatch, rtuSerial);
                    if (qrSuccess) {
                        showCustomAlert('Configuration exported successfully as JSON, TXT, and QR Code files!');
                    } else {
                        showCustomAlert('Configuration exported as JSON and TXT files, but QR code generation failed.');
                    }
                }, 500);
                
            } catch (error) {
                console.error('Error during export:', error);
                showCustomAlert('Error during export: ' + error.message);
            }
        });
    }

    setupSerialNumberHandling();
    
    window.validateAllModuleFields = validateAllModuleFields;
    window.goToNext = goToNext;
    window.enableFieldsForEditing = enableFieldsForEditing;
    
    setTimeout(() => highlightDuplicateSerials(), 500);
});

function setupSerialNumberHandling() {
    const sheetsContainer = document.getElementById('sheetsContainer');
    
    if (sheetsContainer) {
        sheetsContainer.addEventListener('input', function(event) {
            if (event.target && event.target.matches('input[name$="_serial"]')) {
                handleSerialInput(event.target);
                setTimeout(() => highlightDuplicateSerials(), 100);
            }
        });
        
        sheetsContainer.addEventListener('keyup', function(event) {
            if (event.target && event.target.matches('input[name$="_serial"]')) {
                if (event.key === 'Backspace' || event.keyCode === 8) {
                    handleSerialBackspace(event.target);
                    setTimeout(() => highlightDuplicateSerials(), 100);
                }
            }
        });
        
        sheetsContainer.addEventListener('keydown', function(event) {
            if (event.target && event.target.matches('input[name$="_serial"]')) {
                if (event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Tab' || 
                    event.key === 'Escape' || event.key === 'Enter' || event.key === 'ArrowLeft' || 
                    event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown' || 
                    event.key === 'Home' || event.key === 'End') {
                    return;
                }
                
                if (event.ctrlKey && (event.key === 'a' || event.key === 'c' || event.key === 'v' || event.key === 'x')) {
                    return;
                }
                
                if (!/^\d$/.test(event.key) && event.key !== ' ') {
                    event.preventDefault();
                }
            }
        });
        
        sheetsContainer.addEventListener('paste', function(event) {
            if (event.target && event.target.matches('input[name$="_serial"]')) {
                event.preventDefault();
                
                const pastedData = (event.clipboardData || window.clipboardData).getData('text');
                const digitsOnly = pastedData.replace(/\D/g, '');
                const limitedDigits = digitsOnly.slice(0, 12);
                
                event.target.value = limitedDigits;
                
                const inputEvent = new Event('input', { bubbles: true });
                event.target.dispatchEvent(inputEvent);
                
                setTimeout(() => highlightDuplicateSerials(), 100);
            }
        });

        sheetsContainer.addEventListener('blur', function(event) {
            if (event.target && event.target.matches('input[name$="_serial"]')) {
                setTimeout(() => highlightDuplicateSerials(), 100);
            }
        }, true);
    }
}

function handleSerialInput(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 12) {
        value = value.slice(0, 12);
    }
    
    input.value = value;
    
    const row = input.closest('tr');
    const moduleSheet = input.closest('.module-sheet');
    const moduleType = moduleSheet?.dataset.moduleType || 'Unknown';
    const moduleNo = row ? Array.from(row.parentNode.children).indexOf(row) + 1 : 0;
    
    if (value.length === 12) {
        if (/^\d{12}$/.test(value)) {
            input.dataset.validFormat = 'true';
        } else {
            input.style.border = '2px solid red';
            input.style.backgroundColor = '#fff0f0';
            input.dataset.validFormat = 'false';
        }
        
        autoAdvanceToSerial(input, 'next');
    } else if (value.length > 0) {
        input.style.border = '2px solid red';
        input.style.backgroundColor = '#fff0f0';
        input.dataset.validFormat = 'false';
    } else {
        input.style.border = '';
        input.style.backgroundColor = '';
        input.dataset.validFormat = 'false';
        input.title = '';
        input.classList.remove('duplicate-serial');
    }
}

function highlightDuplicateSerials() {
    const allSerialInputs = document.querySelectorAll('input[name$="_serial"]');
    const serialMap = new Map();
    
    allSerialInputs.forEach(input => {
        const serial = input.value.trim();
        
        if (serial && /^\d{12}$/.test(serial)) {
            if (!serialMap.has(serial)) {
                serialMap.set(serial, []);
            }
            
            const row = input.closest('tr');
            const moduleSheet = input.closest('.module-sheet');
            const moduleType = moduleSheet?.dataset.moduleType || 'Unknown';
            const moduleNo = row ? Array.from(row.parentNode.children).indexOf(row) + 1 : 0;
            
            serialMap.get(serial).push({
                element: input,
                location: `${moduleType} Module ${moduleNo}`,
                moduleType: moduleType,
                moduleNo: moduleNo
            });
        }
    });
    
    allSerialInputs.forEach(input => {
        const serial = input.value.trim();
        if (serial && !/^\d{12}$/.test(serial)) {
            input.style.border = '2px solid red';
            input.style.backgroundColor = '#fff0f0';
            input.classList.remove('duplicate-serial');
            input.title = 'Must be exactly 12 digits';
        } else if (!serial) {
            input.style.border = '';
            input.style.backgroundColor = '';
            input.classList.remove('duplicate-serial');
            input.title = '';
        }
    });
    
    let duplicateFound = false;
    serialMap.forEach((occurrences, serial) => {
        if (occurrences.length > 1) {
            duplicateFound = true;
            
            occurrences.forEach(occ => {
                occ.element.style.border = '3px solid red';
                occ.element.style.backgroundColor = '#ffeeee';
                occ.element.classList.add('duplicate-serial');
                
                const otherLocations = occurrences
                    .filter(o => o !== occ)
                    .map(o => o.location)
                    .join(', ');
                
                occ.element.title = `⚠️ DUPLICATE! Also used in: ${otherLocations}`;
            });
        } else {
            occurrences[0].element.style.border = '2px solid green';
            occurrences[0].element.style.backgroundColor = '#f0fff0';
            occurrences[0].element.classList.remove('duplicate-serial');
            occurrences[0].element.title = 'Valid unique serial';
        }
    });
    
    serialNumberTracker.clearAll();
    serialMap.forEach((occurrences, serial) => {
        occurrences.forEach(occ => {
            serialNumberTracker.addSerial(serial, occ.moduleType, occ.moduleNo);
        });
    });
    
    return duplicateFound;
}

function autoAdvanceToSerial(currentInput, direction = 'next') {
    const allSerialInputs = Array.from(document.querySelectorAll('input[name$="_serial"]'));
    const currentIndex = allSerialInputs.indexOf(currentInput);
    
    if (direction === 'next' && currentIndex !== -1 && currentIndex < allSerialInputs.length - 1) {
        const nextInput = allSerialInputs[currentIndex + 1];
        nextInput.focus();
    }
}

function handleSerialBackspace(input) {
    const value = input.value;
    
    if (value.length === 0) {
        const allSerialInputs = Array.from(document.querySelectorAll('input[name$="_serial"]'));
        const currentIndex = allSerialInputs.indexOf(input);
        
        if (currentIndex > 0) {
            const prevInput = allSerialInputs[currentIndex - 1];
            prevInput.focus();
            setTimeout(() => {
                prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
            }, 10);
        }
    }
}

async function generateAndDownloadPDF(contractNo, rtuSerial, returnBlob = false) {
    if (!window.jspdf) {
        console.error("jsPDF library not found");
        return returnBlob ? null : false;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateString = `${day}/${month}/${year}`;

    const testerName = localStorage.getItem('session_checkerName') || 'N/A';
    const vendorNum = localStorage.getItem('session_vendorNumber') || 'N/A';
    const supplierName = localStorage.getItem('session_supplierName') || 'N/A';

    doc.setFontSize(18);
    doc.text(`RTU Serial Number List for ${contractNo} | ${rtuSerial}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${dateString}`, 14, 26);
    
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(`Contract No: ${contractNo}`, 14, 35);
    doc.text(`RTU Serial No: ${rtuSerial}`, 14, 40);
    doc.text(`Vendor No: ${vendorNum}`, 14, 45);
    doc.text(`Supplier: ${supplierName}`, 14, 50);
    doc.text(`Tester: ${testerName}`, 14, 55);

    const moduleConfig = [
        { type: 'Subrack', color: '#808080' },
        { type: 'Processor', color: '#0000FF' },
        { type: 'COM', color: '#2E8B57' },
        { type: 'DI', color: '#FFA500' },
        { type: 'DO', color: '#800080' },
        { type: 'AI', color: '#008080' },
        { type: 'AO', color: '#DAA520' },
        { type: 'Power', color: '#FF0000' }
    ];

    const allData = gatherAllModuleData();
    let currentY = 55;

    moduleConfig.forEach(config => {
        const modules = allData[config.type];

        if (modules && modules.length > 0) {
            const tableBody = modules.map((m, index) => [
                index + 1,
                m.partNo || '-',
                m.subrack || '-',
                (m.slot == '0' || m.slot === 0) ? 'N/A' : (m.slot || '-'),                
                m.serial || '-'
            ]);

            doc.autoTable({
                startY: currentY + 5,
                head: [[`${config.type} Module`, 'Part Number', 'Subrack', 'Slot', 'Serial No.']],
                body: tableBody,
                theme: 'grid',
                headStyles: { 
                    fillColor: config.color, 
                    textColor: 255, 
                    fontStyle: 'bold',
                    halign: 'center' 
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 25 },
                    1: { halign: 'center', cellWidth: 50 },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center' }
                },
                didDrawPage: function (data) {
                    currentY = data.cursor.y;
                },
                margin: { top: 20 } 
            });
            
            currentY = doc.lastAutoTable.finalY;
        }
    });

    const dateformat = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `${dateformat}_RTU_SERIAL_NUMBER_LIST_${contractNo}_${rtuSerial}.pdf`;
    
    if (returnBlob) {
        const pdfBlob = doc.output('blob');
        return {
            blob: pdfBlob,
            filename: filename
        };
    } else {
        doc.save(filename);
        return true;
    }
}

function gatherAllModuleData() {
    const sheets = document.querySelectorAll('#sheetsContainer .module-sheet');
    const moduleData = {};
    
    sheets.forEach(sheet => {
        const moduleType = sheet.dataset.moduleType;
        const rows = sheet.querySelectorAll('tbody tr');
        const moduleArray = [];
        
        rows.forEach((row, index) => {
            moduleArray.push({
                partNo: row.querySelector('select[name$="_part_no"]')?.value,
                subrack: row.querySelector('input[name$="_subrack"]')?.value,
                slot: row.querySelector('input[name$="_slot"]')?.value,
                serial: row.querySelector('input[name$="_serial"]')?.value,
                type: moduleType === 'DI' || moduleType === 'DO' ? 
                     (moduleType === 'DI') ?
                      (row.querySelector('select[name$="_part_no"]')?.value.includes('DI-16') ? 'DI-16' : 'DI-32') :
                      (row.querySelector('select[name$="_part_no"]')?.value.includes('CO-8') ? 'CO-8-A' : 'CO-16-A') :
                     undefined
            });
        });
        
        moduleData[moduleType] = moduleArray;
    });
    
    return moduleData;
}

function generateTXTContent() {
    const contractNo = localStorage.getItem('session_contractNo') || 'xxxxxx';
    const rtuSerial = localStorage.getItem('session_rtuSerial') || '';
    const vendorNumber = document.getElementById('vendorNumber')?.value || localStorage.getItem('session_vendorNumber') || '(VENDOR NUMBER)';
    
    const moduleData = gatherAllModuleData();
    let txtContent = '';
    
    txtContent += `${contractNo} |\n`;
    txtContent += `${vendorNumber} |\n`;
    txtContent += `RTU DONGFANG 1725 IED |\n`;
    txtContent += `DF1725IED |\n`;
    txtContent += `DONGFANG |\n`;
    txtContent += `CN |\n`;
    txtContent += `${rtuSerial} |\n`;
    
    if (moduleData.Subrack && moduleData.Subrack.length > 0) {
        moduleData.Subrack.forEach((subrack, index) => {
            if (subrack.serial) {
                txtContent += `DF1725IED,SUBRACK SN ${subrack.serial} |\n`;
            }
        });
    }
    txtContent += `||\n`;
    
    if (moduleData.Power && moduleData.Power.length > 0) {
        moduleData.Power.forEach((power, index) => {
            if (power.serial) {
                const powerType = power.partNo || 'POWER';
                txtContent += `DF1725IED,${powerType} SN ${power.serial} |\n`;
            }
        });
    }
    txtContent += `||\n`;
    txtContent += `||\n`;
    txtContent += `||\n`;
    
    if (moduleData.Processor && moduleData.Processor.length > 0) {
        moduleData.Processor.forEach((processor, index) => {
            if (processor.serial) {
                const processorType = processor.partNo || 'MCU';
                txtContent += `DF1725IED,${processorType} SN ${processor.serial} |\n`;
            }
        });
    }
    txtContent += `||\n`;
    txtContent += `||\n`;
    txtContent += `||\n`;
    
    if (moduleData.DI && moduleData.DI.length > 0) {
        moduleData.DI.forEach((di, index) => {
            if (di.serial) {
                const diNumber = index + 1;
                txtContent += `DF1725IED,DI ${diNumber} SN ${di.serial} |\n`;
            }
        });
    }
    txtContent += `||\n`;
    txtContent += `||\n`;
    txtContent += `||\n`;
    
    if (moduleData.DO && moduleData.DO.length > 0) {
        moduleData.DO.forEach((doModule, index) => {
            if (doModule.serial) {
                const doNumber = index + 1;
                txtContent += `DF1725IED,CO ${doNumber} SN ${doModule.serial} |\n`;
            }
        });
    }
    txtContent += `||\n`;
    txtContent += `||\n`;
    
    if (moduleData.AI && moduleData.AI.length > 0) {
        moduleData.AI.forEach((ai, index) => {
            if (ai.serial) {
                const aiNumber = index + 1;
                txtContent += `DF1725IED,DCAI ${aiNumber} SN ${ai.serial} |\n`;
            }
        });
    }
    txtContent += `||\n`;
    txtContent += `||\n`;
    txtContent += `||\n`;
    txtContent += `||\n`;
    txtContent += `||\n`;
    txtContent += `||\n`;
    txtContent += `||\n`;
    
    return txtContent;
}

function generateAndDownloadQRCode(txtContent, dateformat, contractNo, rtuSerial) {
    try {
        console.log("Starting QR code generation...");
        
        const typeNumber = 0;
        const errorCorrectionLevel = 'L';
        const qr = qrcode(typeNumber, errorCorrectionLevel);
        qr.addData(txtContent);
        qr.make();
        
        const filename = `${dateformat}_QR_CODE_${contractNo}_${rtuSerial}.png`;
        const targetSize = 810;
        const moduleCount = qr.getModuleCount();
        const moduleSize = Math.floor(targetSize / moduleCount);
        const actualQrSize = moduleSize * moduleCount;
        const marginModules = 1;
        const marginPixels = marginModules * moduleSize;
        const qrTotalSize = actualQrSize + (marginPixels * 2);
        
        const line1Height = 30;
        const line2Height = 30;
        const spacingBetweenLines = 15;
        const labelHeight = line1Height + spacingBetweenLines + line2Height + 15;
        const totalHeight = qrTotalSize + labelHeight;
        
        const canvas = document.createElement('canvas');
        canvas.width = qrTotalSize;
        canvas.height = totalHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#000000';
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    const x = marginPixels + (col * moduleSize);
                    const y = marginPixels + (row * moduleSize);
                    ctx.fillRect(Math.round(x), Math.round(y), moduleSize, moduleSize);
                }
            }
        }
        
        const supplierName = document.getElementById('supplierName')?.value || 
                            localStorage.getItem('session_supplierName') || 
                            'Unknown Supplier';
        
        const textStartY = qrTotalSize + 10;
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 35px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(rtuSerial, canvas.width / 2, textStartY);
        
        ctx.font = 'bold 35px Arial';
        const line2Y = textStartY + line1Height + spacingBetweenLines;
        ctx.fillText(`${contractNo} - ${supplierName}`, canvas.width / 2, line2Y);
        
        const qrDataUrl = canvas.toDataURL('image/png', 1.0);
        const qrLink = document.createElement('a');
        qrLink.href = qrDataUrl;
        qrLink.download = filename;
        document.body.appendChild(qrLink);
        qrLink.click();
        document.body.removeChild(qrLink);
        
        console.log(`QR code generated with ${spacingBetweenLines}px spacing between lines`);
        return true;
        
    } catch (error) {
        console.error('Error generating QR code:', error);
        showCustomAlert('Error generating QR code: ' + error.message);
        return false;
    }
}

async function generateBQPDFForDrive(contractNo, rtuSerial) {
    try {
        if (!window.jspdf) {
            console.error("jsPDF library not found");
            return null;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const dateString = `${day}/${month}/${year}`;

        const testerName = localStorage.getItem('session_checkerName') || 'N/A';
        const vendorNum = localStorage.getItem('session_vendorNumber') || 'N/A';
        const supplierName = localStorage.getItem('session_supplierName') || 'N/A';

        doc.setFontSize(18);
        doc.text(`RTU Serial Number List for ${contractNo} | ${rtuSerial}`, 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${dateString}`, 14, 26);
        
        doc.setTextColor(0);
        doc.setFontSize(11);
        doc.text(`Contract No: ${contractNo}`, 14, 35);
        doc.text(`RTU Serial No: ${rtuSerial}`, 14, 40);
        doc.text(`Vendor No: ${vendorNum}`, 14, 45);
        doc.text(`Supplier: ${supplierName}`, 14, 50);
        doc.text(`Tester: ${testerName}`, 14, 55);

        const moduleConfig = [
            { type: 'Subrack', color: '#808080' },
            { type: 'Processor', color: '#0000FF' },
            { type: 'COM', color: '#2E8B57' },
            { type: 'DI', color: '#FFA500' },
            { type: 'DO', color: '#800080' },
            { type: 'AI', color: '#008080' },
            { type: 'AO', color: '#DAA520' },
            { type: 'Power', color: '#FF0000' }
        ];

        const allData = gatherAllModuleData();
        let currentY = 55;

        moduleConfig.forEach(config => {
            const modules = allData[config.type];

            if (modules && modules.length > 0) {
                const tableBody = modules.map((m, index) => [
                    index + 1,
                    m.partNo || '-',
                    m.subrack || '-',
                    (m.slot == '0' || m.slot === 0) ? 'N/A' : (m.slot || '-'),                
                    m.serial || '-'
                ]);

                doc.autoTable({
                    startY: currentY + 5,
                    head: [[`${config.type} Module`, 'Part Number', 'Subrack', 'Slot', 'Serial No.']],
                    body: tableBody,
                    theme: 'grid',
                    headStyles: { 
                        fillColor: config.color, 
                        textColor: 255, 
                        fontStyle: 'bold',
                        halign: 'center' 
                    },
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 25 },
                        1: { halign: 'center', cellWidth: 50 },
                        2: { halign: 'center' },
                        3: { halign: 'center' },
                        4: { halign: 'center' }
                    },
                    didDrawPage: function (data) {
                        currentY = data.cursor.y;
                    },
                    margin: { top: 20 } 
                });
                
                currentY = doc.lastAutoTable.finalY;
            }
        });

        const pdfBlob = doc.output('blob');
        const dateformat = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const filename = `${dateformat}_RTU_SERIAL_NUMBER_LIST_${contractNo}_${rtuSerial}.pdf`;
        
        return {
            blob: pdfBlob,
            filename: filename
        };
        
    } catch (error) {
        console.error('Error generating PDF for Drive:', error);
        return null;
    }
}