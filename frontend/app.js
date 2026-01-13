// Configuration
const API_URL = 'http://localhost:5000';

// DOM Elements
const searchForm = document.getElementById('searchForm');
const companyInput = document.getElementById('companyInput');
const searchBtn = document.getElementById('searchBtn');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');
const resultsSection = document.getElementById('results');
const loadingSection = document.getElementById('loading');
const loadingTitle = document.getElementById('loadingTitle');
const loadingStep = document.getElementById('loadingStep');
const errorSection = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const copyBtn = document.getElementById('copyBtn');
const exampleBtns = document.querySelectorAll('.example-btn');
const loadingSteps = document.querySelectorAll('.step');

// State
let currentData = null;
let loadingInterval = null;

// Event Listeners
searchForm.addEventListener('submit', handleSearch);
copyBtn.addEventListener('click', copyToClipboard);
exampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        companyInput.value = btn.dataset.company;
        searchForm.dispatchEvent(new Event('submit'));
    });
});

// Handle Search
async function handleSearch(e) {
    e.preventDefault();

    const company = companyInput.value.trim();
    if (!company) return;

    setLoading(true, company);
    hideError();
    hideResults();

    try {
        const response = await fetch(`${API_URL}/research`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify({ name: company }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        currentData = data;
        completeLoading();
        setTimeout(() => {
            displayResults(data);
        }, 500);
    } catch (error) {
        showError(error.message || 'Failed to research company. Make sure the API server is running.');
        setLoading(false);
    }
}

// Display Results
function displayResults(data) {
    // Company name
    document.getElementById('companyName').textContent = data.name || 'Unknown';

    // Confidence
    const confidenceEl = document.getElementById('confidence');
    const score = Math.round((data.confidence_score || 0) * 100);
    confidenceEl.textContent = `${score}% confidence`;
    confidenceEl.style.background = score >= 80
        ? 'rgba(34, 197, 94, 0.15)'
        : score >= 50
            ? 'rgba(234, 179, 8, 0.15)'
            : 'rgba(239, 68, 68, 0.15)';
    confidenceEl.style.color = score >= 80
        ? '#22c55e'
        : score >= 50
            ? '#eab308'
            : '#ef4444';

    // Overview
    document.getElementById('description').textContent = data.description || 'No description available';
    document.getElementById('industry').textContent = data.industry || '-';
    document.getElementById('size').textContent = capitalizeFirst(data.size) || '-';
    document.getElementById('founded').textContent = data.founded || '-';

    // Details
    document.getElementById('location').textContent = data.location || '-';
    document.getElementById('employees').textContent = data.employee_count || '-';
    document.getElementById('funding').textContent = data.funding || '-';

    const websiteEl = document.getElementById('website');
    if (data.website) {
        websiteEl.href = data.website;
        websiteEl.textContent = new URL(data.website).hostname;
        websiteEl.classList.remove('hidden');
    } else {
        websiteEl.textContent = '-';
        websiteEl.removeAttribute('href');
    }

    // Key People
    const peopleList = document.getElementById('keyPeople');
    peopleList.innerHTML = '';
    if (data.key_people && data.key_people.length > 0) {
        data.key_people.slice(0, 5).forEach(person => {
            const li = document.createElement('li');
            li.textContent = person;
            peopleList.appendChild(li);
        });
    } else {
        peopleList.innerHTML = '<li>No data available</li>';
    }

    // Tech Stack
    const techStack = document.getElementById('techStack');
    techStack.innerHTML = '';
    if (data.tech_stack && data.tech_stack.length > 0) {
        data.tech_stack.slice(0, 10).forEach(tech => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = tech;
            techStack.appendChild(span);
        });
    } else {
        techStack.innerHTML = '<span class="tag">No data available</span>';
    }

    // Recent News
    const newsList = document.getElementById('recentNews');
    newsList.innerHTML = '';
    if (data.recent_news && data.recent_news.length > 0) {
        data.recent_news.forEach(news => {
            const li = document.createElement('li');
            li.textContent = news;
            newsList.appendChild(li);
        });
    } else {
        newsList.innerHTML = '<li>No recent news</li>';
    }

    // Social Links
    const linkedinLink = document.getElementById('linkedinLink');
    const twitterLink = document.getElementById('twitterLink');

    if (data.linkedin) {
        linkedinLink.href = data.linkedin;
        linkedinLink.classList.remove('hidden');
    } else {
        linkedinLink.classList.add('hidden');
    }

    if (data.twitter) {
        twitterLink.href = data.twitter;
        twitterLink.classList.remove('hidden');
    } else {
        twitterLink.classList.add('hidden');
    }

    // Sources
    const sourcesList = document.getElementById('sources');
    sourcesList.innerHTML = '';
    if (data.sources && data.sources.length > 0) {
        data.sources.forEach(source => {
            const a = document.createElement('a');
            a.className = 'source-link';
            a.href = source;
            a.target = '_blank';
            a.textContent = new URL(source).hostname;
            a.title = source;
            sourcesList.appendChild(a);
        });
    } else {
        sourcesList.innerHTML = '<span class="source-link">No sources</span>';
    }

    resultsSection.classList.remove('hidden');
}

// Copy to Clipboard
async function copyToClipboard() {
    if (!currentData) return;

    try {
        await navigator.clipboard.writeText(JSON.stringify(currentData, null, 2));

        // Visual feedback
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '✓';
        copyBtn.style.color = '#22c55e';

        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.color = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

// UI Helpers
function setLoading(loading, companyName = '') {
    searchBtn.disabled = loading;
    if (loading) {
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');

        // Show loading section
        loadingSection.classList.remove('hidden');
        loadingTitle.textContent = `Researching ${companyName}...`;
        loadingStep.textContent = 'Initializing AI agent';

        // Reset steps
        loadingSteps.forEach(step => {
            step.classList.remove('active', 'completed');
        });

        // Start step animation
        startLoadingAnimation();
    } else {
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        loadingSection.classList.add('hidden');
        stopLoadingAnimation();
    }
}

function startLoadingAnimation() {
    const steps = [
        { step: 1, text: 'Searching the web for information...' },
        { step: 2, text: 'Analyzing search results...' },
        { step: 3, text: 'Extracting company details...' },
        { step: 4, text: 'Identifying leadership team...' },
        { step: 5, text: 'Generating comprehensive report...' }
    ];

    let currentStep = 0;

    // Activate first step immediately
    activateStep(steps[0]);

    loadingInterval = setInterval(() => {
        // Mark current as completed
        const currentStepEl = document.querySelector(`.step[data-step="${steps[currentStep].step}"]`);
        if (currentStepEl) {
            currentStepEl.classList.remove('active');
            currentStepEl.classList.add('completed');
        }

        currentStep++;

        if (currentStep < steps.length) {
            activateStep(steps[currentStep]);
        } else {
            // Loop back or stay on last step
            currentStep = steps.length - 1;
        }
    }, 4000); // Change step every 4 seconds
}

function activateStep(stepInfo) {
    const stepEl = document.querySelector(`.step[data-step="${stepInfo.step}"]`);
    if (stepEl) {
        stepEl.classList.add('active');
        loadingStep.textContent = stepInfo.text;
    }
}

function completeLoading() {
    // Mark all steps as completed
    loadingSteps.forEach(step => {
        step.classList.remove('active');
        step.classList.add('completed');
    });
    loadingStep.textContent = 'Research complete!';
    loadingTitle.textContent = 'Done!';

    stopLoadingAnimation();

    // Hide loading after brief delay
    setTimeout(() => {
        loadingSection.classList.add('hidden');
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        searchBtn.disabled = false;
    }, 500);
}

function stopLoadingAnimation() {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
}

function hideError() {
    errorSection.classList.add('hidden');
}

function hideResults() {
    resultsSection.classList.add('hidden');
}

function capitalizeFirst(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}
