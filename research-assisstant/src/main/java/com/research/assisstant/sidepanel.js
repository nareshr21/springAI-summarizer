
// Load saved notes when the popup opens
function loadNotes() {
    chrome.storage.local.get(['researchNotes'], (result) => {
        if (result.researchNotes) {
            document.getElementById('notes').value = result.researchNotes;
        }
    });
}

// Save notes to Chrome storage
function saveNotes() {
    const notes = document.getElementById('notes').value;
    chrome.storage.local.set({ 'researchNotes': notes }, () => {
        alert('Notes saved successfully');
    });
}

async function summariseText() {
    try {
        console.log("Summarization started...");

        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log("Active tab:", tab);

        // Get selected text from the page
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        console.log("ExecuteScript results:", results);

        if (!results || !results[0] || !results[0].result) {
            showResult('Please select some text first.');
            console.error("No text selected.");
            return;
        }

        const selectedText = results[0].result;
        console.log("Selected text:", selectedText);

        // Call backend API
        const response = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: selectedText, operation: 'summarize' })
        });

        console.log("Fetch request sent...");

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const text = await response.text();
        console.log("API Response:", text);

        showResult(text.replace(/\n/g, '<br>'));
    } catch (error) {
        console.error("Summarization Error:", error);
        showResult('Error: ' + error.message);
    }
}


// Display results inside the UI
function showResult(content) {
    const resultElement = document.getElementById('results');
    if (resultElement) {
        resultElement.innerHTML = `<div class="result-item"><div class="result-content">${content}</div></div>`;
    } else {
        console.error('Result container not found.');
    }
}

// Attach event listeners when the popup is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    
    document.getElementById('summarizeBtn')?.addEventListener('click', summariseText);
    document.getElementById('saveNotesBtn')?.addEventListener('click', saveNotes);
});
