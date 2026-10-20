// ============================================================
// PAGE SEQUENCES
// ============================================================
const PAGE_SEQUENCE_EQUIPPED = [
    'BQ.html',
    'Pre-requisite.html',
    'ProductDeclaration.html',
    'TestSetup.html',
    'PanelInformation.html',
    'SubrackInspection.html',
    'QualityInspectionPowerSupply.html',
    'QualityInspectionProcessor.html',
    'QualityInspectionCOM6.html',
    'QualityInspectionDI.html',
    'QualityInspectionDO.html',
    'QualityInspectionAI.html',
    'RTUPowerUp.html',
    'ParameterSettingProc.html',
    'ParameterSettingDI.html',   
    'ParameterSettingDO.html', 
    'ParameterSettingAI.html',
    'ParameterSettingIEC101.html',
    'FunctionalityTestPowerSupply.html',
    'FunctionalityTestProcessor.html',
    'FunctionalityTestCOM6.html',
    'FunctionalityDIPage.html',
    'FunctionalityDOPage.html',
    'Dummy&CESFunctionalTest.html',
    'FunctionalityAIPage.html',
    'CsuTestingChecklist.html',
    'CsuTestingChecklist2.html',
    'CsuTestingChecklist_SPARE.html',
    'CsuTestingChecklist3.html',
    'DIP Switch Setting.html',
    'VirtualAlarmTest.html',
    'ChannelRedundacyTest.html',
    'LimitofAuthority.html',
    'userdetail.html',
    'signature.html'
];

const PAGE_SEQUENCE_READY = [
    'PanelInformation.html',
    'RTUPowerUp.html',
    'CsuTestingChecklist.html',
    'CsuTestingChecklist_SCADA_READY.html',
    'DIP Switch Setting.html',
];

// ============================================================
// MODE MANAGEMENT
// ============================================================
const SCADA_MODE_KEY = 'scadaMode'; // 'equipped' | 'ready'

function getScadaMode() {
    return localStorage.getItem(SCADA_MODE_KEY) === 'ready' ? 'ready' : 'equipped';
}

function getActiveSequence() {
    return getScadaMode() === 'ready' ? PAGE_SEQUENCE_READY : PAGE_SEQUENCE_EQUIPPED;
}

// Keep a mutable reference so existing code using PAGE_SEQUENCE still works
let PAGE_SEQUENCE = getActiveSequence();

function updateSequenceForMode(mode) {
    localStorage.setItem(SCADA_MODE_KEY, mode === 'ready' ? 'ready' : 'equipped');
    PAGE_SEQUENCE = getActiveSequence();
    console.log('Navigation sequence switched to:', mode, PAGE_SEQUENCE);
}

// ============================================================
// NAVIGATION GUARD
// ============================================================
function resetNavigationMarks() {
    PAGE_SEQUENCE.forEach(page => {
        localStorage.removeItem(`${page}_completed`);
    });
    console.log('Navigation marks reset successfully');
}

function checkNavigationPermission(targetPage = null) {
    const currentPage = window.location.pathname.split('/').pop();
    const currentIndex = PAGE_SEQUENCE.indexOf(currentPage);
    
    if (currentIndex === -1) return true;
    if (currentIndex === 0) return true;

    if (targetPage) {
        const targetIndex = PAGE_SEQUENCE.indexOf(targetPage);
        if (targetIndex === -1) return true;

        // If going backward, clear all forward pages' completion status
        if (targetIndex < currentIndex) {
            for (let i = currentIndex; i < PAGE_SEQUENCE.length; i++) {
                localStorage.removeItem(`${PAGE_SEQUENCE[i]}_completed`);
            }
            return true;
        }

        // Check if all previous pages are completed
        for (let i = 0; i < targetIndex; i++) {
            const requiredPage = PAGE_SEQUENCE[i];
            const pageCompleted = localStorage.getItem(`${requiredPage}_completed`);
            
            if (!pageCompleted) {
                alert('Please complete all previous pages in order.');
                window.location.href = 'index.html';
                return false;
            }
        }

        return true;
    }

    // For non-targeted navigation (like direct URL access)
    for (let i = 0; i < currentIndex; i++) {
        const requiredPage = PAGE_SEQUENCE[i];
        const pageCompleted = localStorage.getItem(`${requiredPage}_completed`);
        
        if (!pageCompleted) {
            alert('Please complete all previous pages in order.');
            window.location.href = 'index.html';
            return false;
        }
    }

    return true;
}

function markPageAsCompleted() {
    const currentPage = window.location.pathname.split('/').pop();
    localStorage.setItem(`${currentPage}_completed`, 'true');
}

function markPageAsCompletedWithValidation(targetPage = null) {
    const currentPage = window.location.pathname.split('/').pop();
    const currentIndex = PAGE_SEQUENCE.indexOf(currentPage);
    const targetIndex = PAGE_SEQUENCE.indexOf(targetPage);

    // If we have a target page and it's a backward navigation, skip validation
    if (targetPage && targetIndex < currentIndex) {
        return true;
    }

    // Check if page has a validation function
    if (typeof canMarkPageAsCompleted === 'function') {
        if (!canMarkPageAsCompleted()) {
            alert('You did not complete this page.');
            window.location.href = 'index.html';
            return false;
        }
    }

    // If validation passes or no validation needed
    localStorage.setItem(`${currentPage}_completed`, 'true');
    return true;
}

function isPageInSequence(page) {
    return PAGE_SEQUENCE.includes(page);
}

// ============================================================
// DOM INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Bind toggle buttons if present on this page
    const readyBtn = document.getElementById('scadaReadyBtn');
    const equippedBtn = document.getElementById('scadaEquippedBtn');

    function applyToggleUI(mode) {
        if (!readyBtn || !equippedBtn) return;
        if (mode === 'ready') {
            readyBtn.classList.add('active');
            equippedBtn.classList.remove('active');
        } else {
            equippedBtn.classList.add('active');
            readyBtn.classList.remove('active');
        }
    }

    // Initial UI state
    const initialMode = getScadaMode();
    updateSequenceForMode(initialMode);
    applyToggleUI(initialMode);

    if (readyBtn) {
        readyBtn.addEventListener('click', () => {
            if (getScadaMode() === 'ready') return;
            updateSequenceForMode('ready');
            applyToggleUI('ready');
            // Reload so the new sequence applies to the page currently loaded
            window.location.reload();
        });
    }

    if (equippedBtn) {
        equippedBtn.addEventListener('click', () => {
            if (getScadaMode() === 'equipped') return;
            updateSequenceForMode('equipped');
            applyToggleUI('equipped');
            window.location.reload();
        });
    }

    // Check navigation permission
    if (!checkNavigationPermission()) return;
    
    // For all navigation buttons, use the validation version with target page info
    const navButtons = document.querySelectorAll('button[onclick*="goTo"], button[onclick*="handle"]');
    navButtons.forEach(button => {
        const originalOnClick = button.getAttribute('onclick');
        const match = originalOnClick.match(/['"]([^'"]+)['"]/);
        const targetPage = match ? match[1] : null;
        
        button.setAttribute('onclick', `
            if (navigationGuard.markPageAsCompletedWithValidation('${targetPage}')) {
                ${originalOnClick}
            }
        `);
    });
});

// ============================================================
// EXPORT
// ============================================================
window.navigationGuard = {
    checkNavigationPermission,
    markPageAsCompleted,
    markPageAsCompletedWithValidation,
    isPageInSequence,
    resetNavigationMarks,
    updateSequenceForMode,
    getScadaMode,
    getActiveSequence,
};