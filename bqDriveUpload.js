// bqDriveUpload.js - Integrated version with Save & Continue
let isDriveInitialized = false;
let driveStatusElement = null;

// ---------- filename helper (NO space before "(") ----------
function buildContractWithBatch() {
    const rawContract = localStorage.getItem('session_contractNo') || 'ContractNo';
    const rawBatch = localStorage.getItem('session_Batch_No') || 'BatchNo';
    const cleanContract = String(rawContract).replace(/"/g, '').replace(/[\s\u00A0]+$/g, '').trim() || 'ContractNo';
    const cleanBatch = String(rawBatch).replace(/"/g, '').trim() || 'BatchNo';
    return `${cleanContract}(B${cleanBatch})`;
}
window.buildContractWithBatch = buildContractWithBatch;

async function initDriveUpload() {
    console.log('Initializing Drive Upload...');
    
    if (typeof uploadToDrive !== 'undefined' && typeof uploadOrReplaceInContractFolder !== 'undefined') {
        isDriveInitialized = true;
        console.log('Google Drive functions available');
        return true;
    }
    
    console.warn('Google Drive functions not loaded yet');
    return false;
}

async function uploadBQFiles() {
    try {
        console.log('=== STARTING UPLOAD PROCESS ===');
        
        const contractNo = localStorage.getItem('session_contractNo') || 'ContractNo';
        const cleanRtuSerial = (localStorage.getItem('session_rtuSerial') || 'SerialNo').replace(/"/g, '').trim() || 'SerialNo';
        const contractWithBatch = buildContractWithBatch();
        const now = new Date();
        const dateformat = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        
        console.log('Contract:', contractNo, 'Batch:', contractWithBatch, 'RTU Serial:', cleanRtuSerial);
        
        showDriveStatus('Starting Google Drive upload...', 'info');
        
        // 1. Generate JSON file
        const jsonData = await generateBQJsonData(contractNo, cleanRtuSerial);
        if (!jsonData) {
            throw new Error('Failed to generate JSON data');
        }
        
        // 2. Generate TXT file
        let txtContent = '';
        if (typeof generateTXTContent === 'function') {
            txtContent = generateTXTContent();
            if (!txtContent) {
                console.warn('Failed to generate TXT content');
            }
        }
        
        // 3. Generate PDF
        let pdfBlob = null;
        if (typeof generateAndDownloadPDF === 'function') {
            try {
                showDriveStatus('Generating PDF...', 'info');
                const pdfResult = await generateAndDownloadPDF(contractWithBatch, cleanRtuSerial, true);
                if (pdfResult && pdfResult.blob) {
                    pdfBlob = pdfResult.blob;
                }
            } catch (error) {
                console.error('Error generating PDF:', error);
            }
        }
        
        const uploadResults = [];
        
        // UPLOAD JSON FILE
        if (jsonData) {
            try {
                const jsonFileName = `${dateformat}_BQ_BACKUP_${contractWithBatch}_${cleanRtuSerial}.json`;
                showDriveStatus(`Uploading ${jsonFileName}...`, 'info');
                console.log('Uploading JSON file:', jsonFileName);
                
                const jsonBlob = new Blob([jsonData], { type: 'application/json' });
                const result = await uploadOrReplaceInContractFolder(jsonBlob, jsonFileName, 'application/json');
                
                uploadResults.push({
                    success: true,
                    fileName: jsonFileName,
                    fileId: result.id,
                    action: 'uploaded'
                });
                console.log('JSON uploaded successfully');
            } catch (error) {
                console.error('Failed to upload JSON:', error);
                uploadResults.push({
                    success: false,
                    fileName: 'JSON file',
                    error: error.message
                });
            }
        }
        
        // UPLOAD TXT FILE
        if (txtContent) {
            try {
                const txtFileName = `${dateformat}_QR_TXT_${contractWithBatch}_${cleanRtuSerial}.txt`;
                showDriveStatus(`Uploading ${txtFileName}...`, 'info');
                console.log('Uploading TXT file:', txtFileName);
                
                const txtBlob = new Blob([txtContent], { type: 'text/plain' });
                const result = await uploadOrReplaceInContractFolder(txtBlob, txtFileName, 'text/plain');
                
                uploadResults.push({
                    success: true,
                    fileName: txtFileName,
                    fileId: result.id,
                    action: 'uploaded'
                });
                console.log('TXT uploaded successfully');
            } catch (error) {
                console.error('Failed to upload TXT:', error);
                uploadResults.push({
                    success: false,
                    fileName: 'TXT file',
                    error: error.message
                });
            }
        }
        
        // UPLOAD PDF FILE
        if (pdfBlob) {
            try {
                const pdfFileName = `${dateformat}_RTU_SERIAL_NUMBER_LIST_${contractWithBatch}_${cleanRtuSerial}.pdf`;
                showDriveStatus(`Uploading ${pdfFileName}...`, 'info');
                console.log('Uploading PDF file:', pdfFileName);
                
                const result = await uploadOrReplaceInContractFolder(pdfBlob, pdfFileName, 'application/pdf');
                
                uploadResults.push({
                    success: true,
                    fileName: pdfFileName,
                    fileId: result.id,
                    action: 'uploaded'
                });
                console.log('PDF uploaded successfully');
            } catch (error) {
                console.error('Failed to upload PDF:', error);
                uploadResults.push({
                    success: false,
                    fileName: 'PDF file',
                    error: error.message
                });
            }
        }
        
        // UPLOAD QR CODE PNG
        if (txtContent && typeof qrcode !== 'undefined') {
            try {
                const qrDataUrl = await generateQRCodeDataURL(txtContent);
                if (qrDataUrl) {
                    const qrBlob = dataURLtoBlob(qrDataUrl);
                    const qrFileName = `${dateformat}_QR_CODE_${contractWithBatch}_${cleanRtuSerial}.png`;
                    showDriveStatus(`Uploading ${qrFileName}...`, 'info');
                    console.log('Uploading QR Code:', qrFileName);
                    
                    const result = await uploadOrReplaceInContractFolder(qrBlob, qrFileName, 'image/png');
                    
                    uploadResults.push({
                        success: true,
                        fileName: qrFileName,
                        fileId: result.id,
                        action: 'uploaded'
                    });
                    console.log('QR Code uploaded successfully');
                }
            } catch (error) {
                console.error('Failed to upload QR Code:', error);
                uploadResults.push({
                    success: false,
                    fileName: 'QR Code',
                    error: error.message
                });
            }
        }
        
        console.log('Upload results:', uploadResults);
        
        const successful = uploadResults.filter(r => r.success);
        const failed = uploadResults.filter(r => !r.success);
        
        if (successful.length === 0) {
            throw new Error('All uploads failed');
        }
        
        let statusMessage = `${successful.length} file(s) uploaded successfully`;
        if (failed.length > 0) {
            statusMessage += `, ${failed.length} failed`;
        }
        
        return { 
            success: true, 
            partial: failed.length > 0,
            message: statusMessage, 
            results: uploadResults 
        };
        
    } catch (error) {
        console.error('Failed to upload BQ files:', error);
        showDriveStatus(`Upload failed: ${error.message}`, 'error');
        return { success: false, message: error.message };
    }
}

async function generateBQJsonData(contractNo, rtuSerial) {
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
        
        exportData.metadata = {
            generationDate: new Date().toISOString(),
            rtuSerial: rtuSerial,
            contractNo: contractNo,
            Batch_No: localStorage.getItem('session_Batch_No') || 'N/A',
            testerName: localStorage.getItem('session_name') || 'N/A',
            uploadType: 'BQ_Configuration'
        };
        
        return JSON.stringify(exportData, null, 2);
        
    } catch (error) {
        console.error('Error generating JSON data:', error);
        return null;
    }
}

async function generateQRCodeDataURL(txtContent) {
    return new Promise((resolve) => {
        try {
            if (typeof qrcode === 'undefined') {
                console.error('qrcode library not loaded');
                resolve(null);
                return;
            }
            
            const typeNumber = 0;
            const errorCorrectionLevel = 'L';
            const qr = qrcode(typeNumber, errorCorrectionLevel);
            qr.addData(txtContent);
            qr.make();
            
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
            
            const contractWithBatch = buildContractWithBatch();
            const rtuSerial = (localStorage.getItem('session_rtuSerial') || 'SerialNo').replace(/"/g, '').trim() || 'SerialNo';
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
            ctx.fillText(`${contractWithBatch} - ${supplierName}`, canvas.width / 2, line2Y);
            
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            resolve(dataUrl);
            
        } catch (error) {
            console.error('Error generating QR code:', error);
            resolve(null);
        }
    });
}

function dataURLtoBlob(dataurl) {
    try {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], { type: mime });
    } catch (error) {
        console.error('Error converting data URL to blob:', error);
        return null;
    }
}

function showDriveStatus(message, type = 'info') {
    console.log(`Drive Status [${type}]: ${message}`);
    
    if (!driveStatusElement || !document.body.contains(driveStatusElement)) {
        driveStatusElement = document.createElement('div');
        driveStatusElement.id = 'driveUploadStatus';
        document.body.appendChild(driveStatusElement);
    }
    
    const styles = {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px',
        borderRadius: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        zIndex: '10000',
        maxWidth: '300px',
        fontSize: '14px',
        transition: 'all 0.3s ease',
        backgroundColor: type === 'error' ? '#f8d7da' : 
                        type === 'success' ? '#d4edda' : 
                        type === 'warning' ? '#fff3cd' : '#d1ecf1',
        color: type === 'error' ? '#721c24' : 
               type === 'success' ? '#155724' : 
               type === 'warning' ? '#856404' : '#0c5460',
        border: type === 'error' ? '1px solid #f5c6cb' : 
                type === 'success' ? '1px solid #c3e6cb' : 
                type === 'warning' ? '1px solid #ffeaa7' : '1px solid #bee5eb'
    };
    
    Object.assign(driveStatusElement.style, styles);
    driveStatusElement.textContent = message;
    
    const delay = type === 'error' ? 8000 : type === 'success' ? 5000 : 4000;
    clearTimeout(driveStatusElement.hideTimeout);
    driveStatusElement.hideTimeout = setTimeout(() => {
        if (driveStatusElement && driveStatusElement.parentNode) {
            driveStatusElement.style.opacity = '0';
            driveStatusElement.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (driveStatusElement && driveStatusElement.parentNode) {
                    driveStatusElement.parentNode.removeChild(driveStatusElement);
                    driveStatusElement = null;
                }
            }, 300);
        }
    }, delay);
}

async function overrideSubmitButton() {
    console.log('=== OVERRIDING SUBMIT BUTTON ===');
    
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) {
        console.error('Submit button not found');
        return;
    }
    
    const newSubmitBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    
    newSubmitBtn.addEventListener('click', async function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('=== SUBMIT BUTTON CLICKED ===');
        
        const originalText = newSubmitBtn.textContent;
        newSubmitBtn.disabled = true;
        newSubmitBtn.textContent = 'Processing...';
        
        try {
            if (typeof validateAllModuleFields === 'function') {
                if (!validateAllModuleFields()) {
                    newSubmitBtn.disabled = false;
                    newSubmitBtn.textContent = originalText;
                    return;
                }
            }
            
            if (typeof saveCurrentBQCounts === 'function') {
                saveCurrentBQCounts();
            }
            
            console.log('Generating local files...');
            showDriveStatus('Generating local backup files...', 'info');
            
            let exportData = null;
            if (typeof window.goToNext === 'function') {
                exportData = await window.goToNext(true);
            }
            
            await generateLocalFiles();
            
            console.log('Starting Google Drive upload...');
            showDriveStatus('Uploading to Google Drive...', 'info');
            
            let uploadSuccess = false;
            let uploadMessage = '';
            
            try {
                await initDriveUpload();
                const uploadResult = await uploadBQFiles();
                
                if (uploadResult.success) {
                    uploadSuccess = true;
                    uploadMessage = uploadResult.message;
                } else {
                    uploadMessage = 'Drive upload failed: ' + uploadResult.message;
                }
            } catch (uploadError) {
                console.error('Drive upload error:', uploadError);
                uploadMessage = 'Drive upload error: ' + uploadError.message;
            }
            
            if (uploadSuccess) {
                showDriveStatus(uploadMessage, 'success');
                showCustomAlert('✅ Files saved locally and uploaded to Google Drive!');
            } else {
                showDriveStatus(uploadMessage, 'warning');
                showCustomAlert('⚠️ Files saved locally but Drive upload had issues. Check console for details.');
            }
            
            setTimeout(() => {
                if (window.navigationGuard && typeof window.navigationGuard.markPageAsCompleted === 'function') {
                    window.navigationGuard.markPageAsCompleted();
                }
                console.log('Redirecting to Pre-requisite.html');
                window.location.href = './Pre-requisite.html';
            }, 2000);
            
        } catch (error) {
            console.error('Error in submit process:', error);
            showDriveStatus(`Error: ${error.message}`, 'error');
            showCustomAlert('❌ Error during save process. Please try again.');
            
            newSubmitBtn.disabled = false;
            newSubmitBtn.textContent = originalText;
        }
    });
    
    console.log('Submit button overridden successfully');
}

async function generateLocalFiles() {
    try {
        console.log('Generating local files...');
        
        const contractWithBatch = buildContractWithBatch();
        const cleanRtuSerial = (localStorage.getItem('session_rtuSerial') || 'SerialNo').replace(/"/g, '').trim() || 'SerialNo';
        const now = new Date();
        const dateformat = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        
        // PDF
        if (typeof generateAndDownloadPDF === 'function') {
            setTimeout(async () => {
                await generateAndDownloadPDF(contractWithBatch, cleanRtuSerial, false);
            }, 500);
        }
        
        // QR Code
        if (typeof generateAndDownloadQRCode === 'function' && typeof generateTXTContent === 'function') {
            const txtContent = generateTXTContent();
            if (txtContent) {
                setTimeout(async () => {
                    await generateAndDownloadQRCode(txtContent, dateformat, contractWithBatch, cleanRtuSerial);
                }, 1000);
            }
        }
        
        console.log('Local files generated');
        return true;
        
    } catch (error) {
        console.error('Error generating local files:', error);
        throw error;
    }
}

function showCustomAlert(message) {
    const existingAlert = document.getElementById('customAlertBox');
    if (existingAlert) existingAlert.remove();
    
    const messageBox = document.createElement('div');
    messageBox.id = 'customAlertBox';
    messageBox.textContent = message;
    messageBox.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #f8d7da;
        color: #721c24;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 1001;
        text-align: center;
    `;
    document.body.appendChild(messageBox);
    setTimeout(() => messageBox.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== BQ DRIVE UPLOAD MODULE LOADED ===');
    
    setTimeout(async () => {
        await overrideSubmitButton();
    }, 1000);
});

window.uploadBQFiles = uploadBQFiles;
window.initDriveUpload = initDriveUpload;
window.overrideSubmitButton = overrideSubmitButton;
window.showCustomAlert = showCustomAlert;