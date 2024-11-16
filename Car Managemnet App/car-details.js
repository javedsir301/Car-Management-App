const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'index.html';    
}

const urlParams = new URLSearchParams(window.location.search);
const carId = urlParams.get('id');

const carDetails = document.getElementById('carDetails');
const editCarForm = document.getElementById('editCarForm');
const editCarBtn = document.getElementById('editCarBtn');
const deleteCarBtn = document.getElementById('deleteCarBtn');

editCarBtn.addEventListener('click', showEditForm);
deleteCarBtn.addEventListener('click', deleteCar);
editCarForm.addEventListener('submit', updateCar);

async function fetchCarDetails() {
    try {
        const response = await fetch(`${API_URL}/cars/${carId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
            const car = await response.json();
            displayCarDetails(car);
        } else {
            console.error('Error fetching car details');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayCarDetails(car) {
    document.getElementById('carTitle').textContent = car.title;
    document.getElementById('carDescription').textContent = car.description;
    document.getElementById('carType').textContent = `Type: ${car.car_type}`;
    document.getElementById('carCompany').textContent = `Company: ${car.company}`;
    document.getElementById('carDealer').textContent = `Dealer: ${car.dealer}`;

    const carImages = document.getElementById('carImages');
    carImages.innerHTML = '';
    JSON.parse(car.images).forEach(image => {
        const img = document.createElement('img');
        img.src = `${API_URL}/uploads/${image}`;
        carImages.appendChild(img);
    });

    document.getElementById('editCarTitle').value = car.title;
    document.getElementById('editCarDescription').value = car.description;
    document.getElementById('editCarType').value = car.car_type;
    document.getElementById('editCarCompany').value = car.company;
    document.getElementById('editCarDealer').value = car.dealer;
}

function showEditForm() {
    carDetails.style.display = 'none';
    editCarForm.style.display = 'block';
}

async function updateCar(e) {
    e.preventDefault();
    const formData = new FormData(editCarForm);

    try {
        const response = await fetch(`${API_URL}/cars/${carId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (response.ok) {
            alert('Car updated successfully');
            fetchCarDetails();
            carDetails.style.display = 'block';
            editCarForm.style.display = 'none';
        } else {
            alert('Error updating car');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function deleteCar() {
    if (confirm('Are you sure you want to delete this car?')) {
        try {
            const response = await fetch(`${API_URL}/cars/${carId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                alert('Car deleted successfully');
                window.location.href = 'dashboard.html';
            } else {
                alert('Error deleting car');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

fetchCarDetails();