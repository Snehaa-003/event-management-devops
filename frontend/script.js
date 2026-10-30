// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Event definitions
const eventDefinitions = [
    { id: 1, name: "Sports" },
    { id: 2, name: "Sponsored - Hackathons/Conference/Coding Contest/quiz" },
    { id: 3, name: "In Campus - Hackathons/Coding Contest/quiz/Workshop" },
    { id: 4, name: "Certification Courses" }
];

// DOM elements
const mainContainer = document.getElementById('main-container');
const loginNavBtn = document.getElementById('login-nav-btn');
const registerNavBtn = document.getElementById('register-nav-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const eventSelection = document.getElementById('event-selection');
const eventDetails = document.getElementById('event-details');
const adminPanel = document.getElementById('admin-panel');
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');
const eventMessage = document.getElementById('event-message');
const studentIdGroup = document.getElementById('student-id-group');
const eventsTableBody = document.getElementById('events-table-body');
const searchInput = document.getElementById('search-input');
const eventTitle = document.getElementById('event-title');
const eventDuration = document.getElementById('eventDuration');
const singleDateGroup = document.getElementById('singleDateGroup');
const multipleDateGroup = document.getElementById('multipleDateGroup');

// Show/hide password fields based on role
document.getElementById('register-role').addEventListener('change', function() {
    const isStudent = this.value === 'student';
    document.getElementById('register-password-group').style.display = isStudent ? 'none' : 'block';
    document.getElementById('register-confirm-password-group').style.display = isStudent ? 'none' : 'block';
    document.getElementById('student-id-group').style.display = isStudent ? 'block' : 'none';
});

// Toggle date input fields based on duration selection
eventDuration.addEventListener('change', function() {
    if (this.value === 'single') {
        singleDateGroup.style.display = 'block';
        multipleDateGroup.style.display = 'none';
    } else {
        singleDateGroup.style.display = 'none';
        multipleDateGroup.style.display = 'block';
    }
});

// Show/hide forms functions
function showLoginForm() {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    document.getElementById('event-selection').style.display = 'none';
    document.getElementById('event-details').style.display = 'none';
    adminPanel.style.display = 'none';
}

function showRegisterForm() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    document.getElementById('event-selection').style.display = 'none';
    document.getElementById('event-details').style.display = 'none';
    adminPanel.style.display = 'none';
}

function showEventSelection(userData) {
    document.querySelector('.header').style.display = 'none';
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    document.getElementById('event-selection').style.display = 'block';
    document.getElementById('event-details').style.display = 'none';
    adminPanel.style.display = 'none';
    // Reset event title to neutral when showing event selection
    document.getElementById('event-title').textContent = 'Event Details';
}

function showEventDetails(userData, eventId) {
    document.querySelector('.header').style.display = 'none';
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    document.getElementById('event-selection').style.display = 'none';
    document.getElementById('event-details').style.display = 'block';
    adminPanel.style.display = 'none';
    
    // Pre-fill student information
    document.getElementById('studentId').value = userData.student_id || '';
    document.getElementById('name').value = userData.name || '';
    
    // Get the event name from eventDefinitions
    const selectedEvent = eventDefinitions.find(e => e.id === Number(eventId));
    console.log('Selected Event:', selectedEvent); // Debug log
    document.getElementById('event-title').textContent = `${selectedEvent ? selectedEvent.name : ''} Details`;
    
    // Store the event ID for submission
    document.getElementById('event-details').dataset.eventId = eventId;
}

async function showAdminPanel() {
    document.querySelector('.header').style.display = 'none';
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    eventSelection.style.display = 'none';
    eventDetails.style.display = 'none';
    adminPanel.style.display = 'block';
    
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        const events = await response.json();
        populateEventsTable(events);
    } catch (error) {
        showMessage(adminPanel, 'Error loading events', 'error');
    }
}

function logout() {
    document.querySelector('.header').style.display = 'flex';
    localStorage.removeItem('currentUser');
    showLoginForm();
}

// Initialize page based on user session
function initPage() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        if (currentUser.role === 'admin') {
            showAdminPanel();
        } else {
            showEventSelection(currentUser);
        }
    } else {
        showLoginForm();
    }
}

// Event handlers
loginNavBtn.addEventListener('click', showLoginForm);
registerNavBtn.addEventListener('click', showRegisterForm);
document.getElementById('selection-logout-btn').addEventListener('click', logout);
document.getElementById('event-logout-btn').addEventListener('click', logout);
document.getElementById('admin-logout-btn').addEventListener('click', logout);

// Back button in event details
document.getElementById('back-to-events-btn').addEventListener('click', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    showEventSelection(currentUser);
});

// Event button click handlers
document.querySelectorAll('.event-btn').forEach(button => {
    button.addEventListener('click', function() {
        const eventId = this.dataset.eventId;
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        showEventDetails(currentUser, eventId);
    });
});

// Login form submission
document.getElementById('login-btn').addEventListener('click', async function() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email) {
        showMessage(loginMessage, 'Please enter your email', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showMessage(loginMessage, data.message, 'error');
            return;
        }
        
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        showMessage(loginMessage, 'Login successful!', 'success');
        
        if (data.user.role === 'admin') {
            showAdminPanel();
        } else {
            showEventSelection(data.user);
        }
    } catch (error) {
        showMessage(loginMessage, 'Error during login', 'error');
    }
});

// Register form submission
document.getElementById('register-btn').addEventListener('click', async function() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const role = document.getElementById('register-role').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const studentId = document.getElementById('register-student-id').value;
    
    // Basic validation
    if (!name || !email) {
        showMessage(registerMessage, 'Please fill in all required fields', 'error');
        return;
    }
    
    // Admin-specific validation
    if (role === 'admin') {
        if (!password) {
            showMessage(registerMessage, 'Password is required for admin accounts', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage(registerMessage, 'Passwords do not match', 'error');
            return;
        }
    }
    
    // Student-specific validation
    if (role === 'student' && !studentId) {
        showMessage(registerMessage, 'Student ID is required for student accounts', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                password,
                role,
                studentId
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showMessage(registerMessage, data.message, 'error');
            return;
        }
        
        showMessage(registerMessage, 'Registration successful! Please login.', 'success');
        
        // Clear form
        document.getElementById('register-form').reset();
        
        // Show login form after successful registration
        setTimeout(() => {
            showLoginForm();
        }, 1500);
    } catch (error) {
        showMessage(registerMessage, 'Error during registration', 'error');
    }
});

// Event submission
document.getElementById('submit-event-btn').addEventListener('click', async function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const eventId = Number(eventDetails.dataset.eventId);
    const selectedEvent = eventDefinitions.find(e => e.id === eventId);
    
    const studentId = document.getElementById('studentId').value;
    const name = document.getElementById('name').value;
    const photo1 = document.getElementById('photo1').files[0];
    
    let eventDate = null;
    let eventStartDate = null;
    let eventEndDate = null;
    
    if (eventDuration.value === 'single') {
        eventDate = document.getElementById('eventDate').value;
        if (!eventDate) {
            showMessage(eventMessage, 'Please select the event date', 'error');
            return;
        }
    } else {
        eventStartDate = document.getElementById('eventStartDate').value;
        eventEndDate = document.getElementById('eventEndDate').value;
        if (!eventStartDate || !eventEndDate) {
            showMessage(eventMessage, 'Please select both start and end dates', 'error');
            return;
        }
        
        if (new Date(eventStartDate) > new Date(eventEndDate)) {
            showMessage(eventMessage, 'Start date cannot be after end date', 'error');
            return;
        }
    }
    
    // Basic validation
    if (!studentId || !name || !photo1) {
        showMessage(eventMessage, 'Please fill all required fields', 'error');
        return;
    }
    
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('eventId', eventId);
        formData.append('studentId', studentId);
        formData.append('name', name);
        formData.append('eventName', selectedEvent.name);
        formData.append('eventDate', eventDate);
        formData.append('eventStartDate', eventStartDate);
        formData.append('eventEndDate', eventEndDate);
        formData.append('proofPhoto1', photo1);
        
        const photo2 = document.getElementById('photo2').files[0];
        if (photo2) {
            formData.append('proofPhoto2', photo2);
        }
        
        const certificate = document.getElementById('certificate').files[0];
        if (certificate) {
            formData.append('certificate', certificate);
        }
        
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showMessage(eventMessage, data.message, 'error');
            return;
        }
        
        showMessage(eventMessage, 'Event submitted successfully!', 'success');
        
        // Clear form and reset fields
        document.getElementById('photo1').value = '';
        document.getElementById('photo2').value = '';
        document.getElementById('certificate').value = '';
        document.getElementById('eventDate').value = '';
        document.getElementById('eventStartDate').value = '';
        document.getElementById('eventEndDate').value = '';
        eventDuration.value = 'single';
        singleDateGroup.style.display = 'block';
        multipleDateGroup.style.display = 'none';
        
        // Return to event selection after a delay
        setTimeout(() => {
            showEventSelection(currentUser);
        }, 2000);
    } catch (error) {
        console.error('Event submission failed:', error);
        showMessage(
            eventMessage,
            error instanceof TypeError
                ? 'Cannot connect to the backend. Start it from the project folder with npm start.'
                : `Event submission failed: ${error.message}`,
            'error'
        );
    }
});

// Search functionality
searchInput.addEventListener('input', async function() {
    const searchTerm = this.value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/search?term=${encodeURIComponent(searchTerm)}`);
        const events = await response.json();
        populateEventsTable(events);
    } catch (error) {
        showMessage(adminPanel, 'Error searching events', 'error');
    }
});

// Helper function to show messages
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'block';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

// Helper function to populate events table
function populateEventsTable(events) {
    const tbody = document.getElementById('events-table-body');
    tbody.innerHTML = '';

    events.forEach(event => {
        const row = document.createElement('tr');
        
        // Create download buttons for files
        const photo1Btn = event.proof_photo1 ? 
            `<button class="download-btn" onclick="downloadFile(${event.id}, 'photo1')">Download Photo 1</button>` : 
            'No photo';
            
        const photo2Btn = event.proof_photo2 ? 
            `<button class="download-btn" onclick="downloadFile(${event.id}, 'photo2')">Download Photo 2</button>` : 
            'No photo';
            
        const certBtn = event.certificate ? 
            `<button class="download-btn" onclick="downloadFile(${event.id}, 'certificate')">Download Certificate</button>` : 
            'No certificate';

        row.innerHTML = `
            <td>${event.student_id}</td>
            <td>${event.name}</td>
            <td>${event.event_name}</td>
            <td>${event.event_date || `${event.start_date} to ${event.end_date}`}</td>
            <td>
                ${photo1Btn}<br>
                ${photo2Btn}
            </td>
            <td>${certBtn}</td>
            <td>${new Date(event.submitted_at).toLocaleString()}</td>
            <td>
                <button class="action-btn" onclick="viewEventDetails(${event.id})">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Add download file function
async function downloadFile(eventId, fileType) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/download/${eventId}/${fileType}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Download failed');
        }

        // Get the filename from the response headers
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition
            ? contentDisposition.split('filename=')[1].replace(/"/g, '')
            : `${fileType}_${eventId}`;

        // Create a blob from the response
        const blob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Download error:', error);
        showMessage('Error downloading file: ' + error.message, 'error');
    }
}

// Calculate days automatically when dates change
document.getElementById('eventStartDate').addEventListener('change', calculateDays);
document.getElementById('eventEndDate').addEventListener('change', calculateDays);

function calculateDays() {
    const startDate = new Date(document.getElementById('eventStartDate').value);
    const endDate = new Date(document.getElementById('eventEndDate').value);
    
    if (startDate && endDate && !isNaN(startDate) && !isNaN(endDate)) {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Add 1 to include both start and end dates
        document.getElementById('numberOfDays').value = diffDays;
    }
}

// Helper function to download files
function downloadFiles(event) {
    // In a real application, these would be actual file URLs
    const files = [];
    
    if (event.proof_photo1) {
        files.push({
            name: `photo1_${event.student_id}.jpg`,
            url: event.proof_photo1
        });
    }
    
    if (event.proof_photo2) {
        files.push({
            name: `photo2_${event.student_id}.jpg`,
            url: event.proof_photo2
        });
    }
    
    if (event.certificate) {
        files.push({
            name: `certificate_${event.student_id}.pdf`,
            url: event.certificate
        });
    }

    // Create text file with student details
    const studentDetails = `
Student Details:
ID: ${event.student_id}
Name: ${event.name}
Event: ${event.event_name}
Date: ${event.event_date}
Submitted: ${event.submitted_at}
    `;
    
    const blob = new Blob([studentDetails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_${event.student_id}_files.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // In a real application, you would download each file
    // For now, we'll show a success message
    alert(`Downloading files for student ${event.student_id}`);
}

// Initialize page
initPage(); 