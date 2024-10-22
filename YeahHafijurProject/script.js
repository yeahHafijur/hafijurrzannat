let reportCounter = 1; // To generate unique report numbers
let currentUserId = prompt("Enter your username to submit reports:"); // Store the user ID (session-based)

// Load reports from localStorage on page load
document.addEventListener('DOMContentLoaded', loadReports);

// Show/Hide Lost Report Number field based on the selected type
document.getElementById('type').addEventListener('change', function() {
    const itemType = document.getElementById('type').value;
    const lostReportNumberField = document.getElementById('lostReportNumberField');
    
    if (itemType === 'found') {
        lostReportNumberField.style.display = 'block'; // Show the lost report number field for "Found" items
    } else {
        lostReportNumberField.style.display = 'none'; // Hide the field for "Lost" items
    }
});

document.getElementById('reportForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent form from refreshing the page
    
    const itemType = document.getElementById('type').value;
    const itemName = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const lostReportNumber = document.getElementById('lostReportNumber').value; // Get lost report number if entered
    const reportId = document.getElementById('reportId').value; // Check if it's an edit action

    // Perform validation
    if (itemType && itemName && description) {
        if (reportId) {
            // Update existing report if it's an edit action
            updateExistingReport(reportId, itemType, itemName, description, lostReportNumber);
        } else {
            // Generate a new report number for new submissions
            const reportNumber = reportCounter++; 
            const report = {
                reportNumber,
                itemType,
                itemName,
                description,
                lostReportNumber,
                reportedOn: new Date().toLocaleDateString(),
                userId: currentUserId // Store the user ID with the report
            };
            
            // Store the new report in localStorage
            saveReportToLocalStorage(report);

            // Append the new item to the correct section
            appendReportToDOM(report);
        }
        
        // Clear the form after submission
        document.getElementById('reportForm').reset();
        document.getElementById('lostReportNumberField').style.display = 'none'; // Hide the lost report number field again
        document.getElementById('reportId').value = ''; // Clear reportId for new submissions
        document.getElementById('reportTitle').innerText = 'Report an Item'; // Reset title to default
    } else {
        document.getElementById('responseMessage').innerText = 'Please fill out all fields.';
    }
});

// Load reports from localStorage
function loadReports() {
    const reports = JSON.parse(localStorage.getItem('reports')) || [];
    reports.forEach(report => {
        appendReportToDOM(report);
        reportCounter = Math.max(reportCounter, report.reportNumber + 1); // Update the reportCounter for new reports
    });
}

// Save report to localStorage
function saveReportToLocalStorage(report) {
    const reports = JSON.parse(localStorage.getItem('reports')) || [];
    reports.push(report);
    localStorage.setItem('reports', JSON.stringify(reports));
}

// Update an existing report in localStorage and DOM
function updateExistingReport(reportId, itemType, itemName, description, lostReportNumber) {
    const reports = JSON.parse(localStorage.getItem('reports')) || [];

    // Find the report by reportId and update its details
    const reportIndex = reports.findIndex(report => report.reportNumber == reportId);
    if (reportIndex > -1) {
        reports[reportIndex].itemType = itemType;
        reports[reportIndex].itemName = itemName;
        reports[reportIndex].description = description;
        reports[reportIndex].lostReportNumber = lostReportNumber;

        // Save the updated reports array back to localStorage
        localStorage.setItem('reports', JSON.stringify(reports));

        // Update the DOM for the edited report
        const reportElement = document.getElementById(`report-${reportId}`);
        reportElement.querySelector('h3').innerText = `${itemType === 'lost' ? 'Lost' : 'Found'}: ${itemName} (Report #${reportId})`;
        reportElement.querySelector('p:nth-child(2)').innerText = `Description: ${description}`;
        
        if (itemType === 'found' && lostReportNumber) {
            reportElement.querySelector('p:nth-child(3)').innerText = `Associated Lost Report #: ${lostReportNumber}`;
        }

        document.getElementById('responseMessage').innerText = `Report #${reportId} has been successfully updated.`;
    }
}

// Append report to the DOM
function appendReportToDOM(report) {
    const newItem = document.createElement('div');
    newItem.classList.add('item');
    newItem.id = `report-${report.reportNumber}`;
    newItem.setAttribute('data-user-id', report.userId); // Store the user ID with the report
    newItem.innerHTML = `
        <h3>${report.itemType === 'lost' ? 'Lost' : 'Found'}: ${report.itemName} (Report #${report.reportNumber})</h3>
        <p>Description: ${report.description}</p>
        <p>Reported on: ${report.reportedOn}</p>
        <button onclick="editReport('${report.reportNumber}')">Edit</button>
        <button onclick="deleteReport('${report.reportNumber}')">Delete</button>
    `;

    // If the item is found and a lost report number is provided
    if (report.itemType === 'found' && report.lostReportNumber) {
        newItem.innerHTML += `<p>Associated Lost Report #: ${report.lostReportNumber}</p>`;
        
        // Highlight the matching lost item
        const lostItems = document.querySelectorAll('#lostItems .item');
        lostItems.forEach(lostItem => {
            if (lostItem.innerHTML.includes(`Report #${report.lostReportNumber}`)) {
                lostItem.classList.add('found-highlight'); // Highlight the matching lost item
            }
        });
    }

    // Append the new item to the correct section
    if (report.itemType === 'lost') {
        document.getElementById('lostItems').appendChild(newItem); // Append to Lost Items
    } else {
        document.getElementById('foundItems').appendChild(newItem); // Append to Found Items
    }
}

// Function to edit reports
function editReport(reportId) {
    const reportElement = document.getElementById(`report-${reportId}`);
    
    // Allow editing if the current user is the report owner or "HafijurAdmin"
    if (reportElement.getAttribute('data-user-id') === currentUserId || currentUserId === 'HafijurAdmin') {
        // Pre-fill the form with the existing data
        const itemType = reportElement.querySelector('h3').innerText.includes('Lost') ? 'lost' : 'found';
        const itemName = reportElement.querySelector('h3').innerText.split(': ')[1].split(' (')[0];
        const description = reportElement.querySelector('p:nth-child(2)').innerText.split(': ')[1];

        // Set the form fields
        document.getElementById('type').value = itemType;
        document.getElementById('name').value = itemName;
        document.getElementById('description').value = description;
        document.getElementById('reportId').value = reportId; // Store the report ID for updating
        
        // Scroll to the form and allow the user to edit
        document.getElementById('reportTitle').innerText = 'Edit Report';
        window.scrollTo(0, document.getElementById('report').offsetTop);
    } else {
        alert("You can only edit your own reports.");
    }
}

// Function to delete reports
function deleteReport(reportId) {
    const reportElement = document.getElementById(`report-${reportId}`);

    // Allow deletion if the current user is the report owner or "HafijurAdmin"
    if (reportElement.getAttribute('data-user-id') === currentUserId || currentUserId === 'HafijurAdmin') {
        // Remove report from localStorage
        let reports = JSON.parse(localStorage.getItem('reports')) || [];
        reports = reports.filter(report => report.reportNumber !== parseInt(reportId));
        localStorage.setItem('reports', JSON.stringify(reports));

        // Remove report from DOM
        reportElement.remove();

        alert(`Report #${reportId} has been deleted.`);
    } else {
        alert("You can only delete your own reports.");
    }
}
