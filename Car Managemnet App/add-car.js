// add-car.js
const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'index.html';
}

const addCarForm = document.getElementById('addCarForm');

addCarForm.addEventListener('submit', addCar);

async function addCar(e) {
    e.preventDefault();
    const formData = new FormData(addCarForm);

    try {
        const response = await fetch(`${API_URL}/cars`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (response.ok) {
            alert('Car added successfully');
            window.location.href = 'dashboard.html';
        } else {
            alert('Error adding car');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}