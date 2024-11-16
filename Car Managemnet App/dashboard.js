const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'index.html';
}

const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const addCarBtn = document.getElementById('addCarBtn');
const carList = document.getElementById('carList');

logoutBtn.addEventListener('click', logout);
searchInput.addEventListener('input', searchCars);
addCarBtn.addEventListener('click', () => window.location.href = 'add-car.html');

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

async function fetchCars(search = '') {
    try {
        const response = await fetch(`${API_URL}/cars?search=${search}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
            const cars = await response.json();
            displayCars(cars);
        } else {
            console.error('Error fetching cars');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayCars(cars) {
    carList.innerHTML = '';
    cars.forEach(car => {
        const carElement = document.createElement('div');
        carElement.classList.add('car-item');
        carElement.innerHTML = `
            <h3>${car.title}</h3>
            <p>${car.description}</p>
            <button onclick="window.location.href='car-details.html?id=${car.id}'">View Details</button>
        `;
        carList.appendChild(carElement);
    });
}

function searchCars() {
    const searchTerm = searchInput.value;
    fetchCars(searchTerm);
}

fetchCars();